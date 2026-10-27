-- DUKES: admin upgrade.
-- Team roles (owner, admin, staff), editable homepage and store details,
-- collections, discount codes and quick stock editing.
-- Run once in Supabase > SQL Editor after 0002_sale_prices.sql. Safe to run again.

-- ---------------------------------------------------------------- roles
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('customer', 'staff', 'admin', 'owner'));

-- The first admin becomes the owner.
update public.profiles set role = 'owner'
 where role = 'admin'
   and not exists (select 1 from public.profiles where role = 'owner')
   and id = (select id from public.profiles where role = 'admin' order by created_at limit 1);

-- Admins and owners manage the catalogue and settings.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'owner'));
$$;

-- Staff, admins and owners handle orders and stock.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin', 'owner'));
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner');
$$;

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'customer');
$$;

drop policy if exists "own profile or admin" on public.profiles;
drop policy if exists "own profile or staff" on public.profiles;
create policy "own profile or staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());
-- Role changes only through set_member_role().
drop policy if exists "admin manages profiles" on public.profiles;

drop policy if exists "admin read" on public.orders;
drop policy if exists "staff read" on public.orders;
create policy "staff read" on public.orders for select using (public.is_staff());
drop policy if exists "admin read" on public.order_items;
drop policy if exists "staff read" on public.order_items;
create policy "staff read" on public.order_items for select using (public.is_staff());

-- Staff can see draft products (for inventory), but only admins can edit them.
drop policy if exists "read active or admin" on public.products;
drop policy if exists "read active or staff" on public.products;
create policy "read active or staff" on public.products
  for select using (status = 'active' or public.is_staff());
drop policy if exists "read with product" on public.variants;
create policy "read with product" on public.variants for select using (
  public.is_staff() or exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
drop policy if exists "read with product" on public.product_images;
create policy "read with product" on public.product_images for select using (
  public.is_staff() or exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));

-- Order status: staff and above.
create or replace function public.set_order_status(p_order_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_current text;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_status not in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;
  select status into v_current from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_current = 'cancelled' and p_status <> 'cancelled' then
    raise exception 'ORDER_CANCELLED' using errcode = 'P0001';
  end if;
  if p_status = 'cancelled' and v_current <> 'cancelled' then
    update public.variants v set stock = v.stock + i.quantity
      from public.order_items i where i.order_id = p_order_id and i.variant_id = v.id;
  end if;
  update public.orders set status = p_status where id = p_order_id;
end;
$$;

-- Stock: staff and above can change stock (only stock).
create or replace function public.set_stock(p_variant_id uuid, p_stock integer)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_stock is null or p_stock < 0 or p_stock > 100000 then
    raise exception 'INVALID_STOCK' using errcode = 'P0001';
  end if;
  update public.variants set stock = p_stock where id = p_variant_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  return p_stock;
end;
$$;

-- Team: the owner changes roles by email. The account must already exist
-- (create it in Supabase > Authentication > Users).
create or replace function public.set_member_role(p_email text, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_current text;
begin
  if not public.is_owner() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_role not in ('customer', 'staff', 'admin', 'owner') then
    raise exception 'INVALID_ROLE' using errcode = 'P0001';
  end if;
  select id, role into v_id, v_current from public.profiles where lower(email) = lower(btrim(p_email));
  if not found then
    raise exception 'NO_ACCOUNT' using errcode = 'P0001';
  end if;
  if v_current = 'owner' and p_role <> 'owner'
     and (select count(*) from public.profiles where role = 'owner') = 1 then
    raise exception 'LAST_OWNER' using errcode = 'P0001';
  end if;
  update public.profiles set role = p_role where id = v_id;
end;
$$;

-- ---------------------------------------------------------------- site content
-- Editable text and images: key 'home' (homepage hero) and 'store' (announcement, contact).
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
drop policy if exists "public read" on public.site_content;
create policy "public read" on public.site_content for select using (true);
drop policy if exists "admin write" on public.site_content;
create policy "admin write" on public.site_content for all using (public.is_admin()) with check (public.is_admin());

insert into public.site_content (key, value) values
('home', '{
  "eyebrow": "Autumn / Winter 2026",
  "title": "The Dress Shoe Edit",
  "images": [
    {"url": "/images/dukes/croc-chain-loafer.jpg", "alt": "Black loafers with navy croc-embossed vamps and a gold chain"},
    {"url": "/images/dukes/horsebit-noir.jpg", "alt": "Polished black horsebit loafers on red velvet"},
    {"url": "/images/dukes/pebble-loafer.jpg", "alt": "Black pebble-grain loafers with cedar shoe trees"}
  ],
  "primary": {"label": "Dress shoes", "href": "/shop?category=dress-shoes"},
  "secondary": {"label": "Chappal", "href": "/shop?category=chappal"}
}'::jsonb),
('store', '{
  "announcement": "Complimentary delivery across Pakistan on orders above Rs 15,000. Cash on delivery available.",
  "address": "",
  "hours": "",
  "whatsapp": "",
  "email": "",
  "instagram": "https://www.instagram.com/dukes_shoes/"
}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------- collections
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  description text not null default '',
  image text,
  status text not null default 'draft' check (status in ('active', 'draft')),
  show_on_home boolean not null default false,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort integer not null default 0,
  primary key (collection_id, product_id)
);
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
drop policy if exists "read active or admin" on public.collections;
create policy "read active or admin" on public.collections for select using (status = 'active' or public.is_admin());
drop policy if exists "admin write" on public.collections;
create policy "admin write" on public.collections for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read" on public.collection_products;
create policy "public read" on public.collection_products for select using (true);
drop policy if exists "admin write" on public.collection_products;
create policy "admin write" on public.collection_products for all using (public.is_admin()) with check (public.is_admin());

-- Save a collection and its products in one step.
create or replace function public.admin_save_collection(payload jsonb)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := nullif(payload ->> 'id', '')::uuid;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_id is null then
    insert into public.collections (slug, title, description, image, status, show_on_home, sort)
    values (payload ->> 'slug', payload ->> 'title', coalesce(payload ->> 'description', ''),
            nullif(payload ->> 'image', ''), coalesce(payload ->> 'status', 'draft'),
            coalesce((payload ->> 'show_on_home')::boolean, false), coalesce((payload ->> 'sort')::int, 0))
    returning id into v_id;
  else
    update public.collections set
      slug = payload ->> 'slug', title = payload ->> 'title',
      description = coalesce(payload ->> 'description', ''), image = nullif(payload ->> 'image', ''),
      status = coalesce(payload ->> 'status', 'draft'),
      show_on_home = coalesce((payload ->> 'show_on_home')::boolean, false),
      sort = coalesce((payload ->> 'sort')::int, 0)
    where id = v_id;
    if not found then
      raise exception 'NOT_FOUND' using errcode = 'P0001';
    end if;
  end if;
  delete from public.collection_products where collection_id = v_id;
  insert into public.collection_products (collection_id, product_id, sort)
  select v_id, (x.value #>> '{}')::uuid, (x.ordinality - 1)::int
    from jsonb_array_elements(coalesce(payload -> 'product_ids', '[]')) with ordinality as x
  on conflict do nothing;
  return v_id;
end;
$$;

-- Starting collections, shown on the homepage.
insert into public.collections (slug, title, description, image, status, show_on_home, sort) values
  ('the-loafer-edit', 'The loafer edit', 'Horsebit, chain and penny loafers in polished leather.', '/images/dukes/horsebit-cognac.jpg', 'active', true, 0),
  ('the-cap-toe-derby', 'The cap-toe Derby', 'Perforated toe cap, contrast welt, made to be resoled.', '/images/dukes/captoe-derby.jpg', 'active', true, 1)
on conflict (slug) do nothing;
insert into public.collection_products (collection_id, product_id, sort)
select c.id, p.id, row_number() over (partition by c.id order by p.created_at desc)::int
  from public.collections c join public.products p
    on (c.slug = 'the-loafer-edit' and p.subcategory = 'loafers')
    or (c.slug = 'the-cap-toe-derby' and p.subcategory in ('derbies', 'oxfords'))
on conflict do nothing;

-- ---------------------------------------------------------------- discounts
create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,30}$'),
  description text not null default '',
  kind text not null check (kind in ('percent', 'fixed')),
  -- percent: 1 to 90; fixed: minor units (paisa)
  value integer not null check (value > 0),
  min_subtotal integer not null default 0 check (min_subtotal >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value between 1 and 90)
);
alter table public.discounts enable row level security;
-- Codes are private: customers check them only through check_discount().
drop policy if exists "admin all" on public.discounts;
create policy "admin all" on public.discounts for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.discount_is_usable(d public.discounts, p_subtotal integer)
returns boolean language sql stable as $$
  select d.active
     and (d.starts_at is null or d.starts_at <= now())
     and (d.ends_at is null or d.ends_at > now())
     and (d.usage_limit is null or d.used_count < d.usage_limit)
     and p_subtotal >= d.min_subtotal;
$$;

create or replace function public.discount_amount(d public.discounts, p_subtotal integer)
returns integer language sql stable as $$
  select least(p_subtotal,
               case when d.kind = 'percent' then (p_subtotal * d.value / 100)
                    else d.value end);
$$;

-- Checkout preview: is this code valid for this subtotal, and how much does it take off?
create or replace function public.check_discount(p_code text, p_subtotal integer)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  d public.discounts;
begin
  select * into d from public.discounts where code = upper(btrim(coalesce(p_code, '')));
  if not found or not d.active
     or (d.starts_at is not null and d.starts_at > now())
     or (d.ends_at is not null and d.ends_at <= now())
     or (d.usage_limit is not null and d.used_count >= d.usage_limit) then
    return jsonb_build_object('valid', false, 'reason', 'This code is not valid.');
  end if;
  if p_subtotal < d.min_subtotal then
    return jsonb_build_object('valid', false, 'reason', 'min', 'min_subtotal', d.min_subtotal);
  end if;
  return jsonb_build_object('valid', true, 'code', d.code, 'amount', public.discount_amount(d, p_subtotal),
                            'kind', d.kind, 'value', d.value);
end;
$$;

alter table public.orders add column if not exists discount integer not null default 0;
alter table public.orders add column if not exists discount_code text;

create or replace function public.place_order(customer jsonb, items jsonb)
returns table (order_id uuid, order_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(customer ->> 'name', ''));
  v_phone text := btrim(coalesce(customer ->> 'phone', ''));
  v_email text := nullif(btrim(coalesce(customer ->> 'email', '')), '');
  v_address text := btrim(coalesce(customer ->> 'address', ''));
  v_city text := btrim(coalesce(customer ->> 'city', ''));
  v_postal text := nullif(btrim(coalesce(customer ->> 'postal_code', '')), '');
  v_notes text := nullif(btrim(coalesce(customer ->> 'notes', '')), '');
  v_item jsonb;
  v_qty integer;
  v_variant record;
  v_subtotal integer := 0;
  v_shipping integer;
  v_settings record;
  v_order_id uuid;
  v_order_number integer;
  v_code text := upper(nullif(btrim(coalesce(customer ->> 'discount_code', '')), ''));
  v_discount public.discounts;
  v_discount_amount integer := 0;
begin
  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'INVALID_NAME' using errcode = 'P0001';
  end if;
  if regexp_replace(v_phone, '[^0-9]', '', 'g') !~ '^[0-9]{10,15}$' then
    raise exception 'INVALID_PHONE' using errcode = 'P0001';
  end if;
  if length(v_address) < 6 or length(v_address) > 400 then
    raise exception 'INVALID_ADDRESS' using errcode = 'P0001';
  end if;
  if length(v_city) < 2 or length(v_city) > 80 then
    raise exception 'INVALID_CITY' using errcode = 'P0001';
  end if;
  if v_email is not null and (length(v_email) > 200 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'INVALID_EMAIL' using errcode = 'P0001';
  end if;
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;
  if jsonb_array_length(items) > 30 then
    raise exception 'TOO_MANY_ITEMS' using errcode = 'P0001';
  end if;

  select * into v_settings from public.store_settings where id = 1;

  insert into public.orders (customer_name, phone, email, address, city, postal_code, notes, subtotal, shipping, total)
  values (v_name, v_phone, v_email, v_address, v_city, v_postal, left(v_notes, 500), 0, 0, 0)
  returning id, number into v_order_id, v_order_number;

  for v_item in select * from jsonb_array_elements(items) loop
    if jsonb_typeof(v_item) <> 'object'
       or coalesce(v_item ->> 'variant_id', '') !~ '^[0-9a-fA-F-]{36}$'
       or coalesce(v_item ->> 'quantity', '') !~ '^[0-9]{1,3}$' then
      raise exception 'INVALID_ITEM' using errcode = 'P0001';
    end if;
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

    select v.*, p.name as product_name, p.slug as product_slug, p.status,
           (select i.url from public.product_images i
             where i.product_id = p.id and i.color = v.color_name
             order by i.sort limit 1) as image
      into v_variant
      from public.variants v
      join public.products p on p.id = v.product_id
     where v.id = (v_item ->> 'variant_id')::uuid
       for update of v;

    if not found or v_variant.status <> 'active' then
      raise exception 'UNAVAILABLE:%', v_item ->> 'variant_id' using errcode = 'P0001';
    end if;
    if v_variant.stock < v_qty then
      raise exception 'OUT_OF_STOCK:%', v_variant.id using errcode = 'P0001';
    end if;

    update public.variants set stock = stock - v_qty where id = v_variant.id;

    insert into public.order_items (order_id, product_id, variant_id, product_name, product_slug, image,
                                    color, size, sku, unit_price, quantity, line_total)
    values (v_order_id, v_variant.product_id, v_variant.id, v_variant.product_name, v_variant.product_slug,
            v_variant.image, v_variant.color_name, v_variant.size, v_variant.sku, v_variant.price, v_qty,
            v_variant.price * v_qty);

    v_subtotal := v_subtotal + v_variant.price * v_qty;
  end loop;

  v_shipping := case when v_subtotal >= v_settings.free_shipping_threshold then 0
                     else v_settings.shipping_fee end;

  -- Discount code: validated and counted here, so the browser cannot change it.
  if v_code is not null then
    select * into v_discount from public.discounts where code = v_code for update;
    if not found or not public.discount_is_usable(v_discount, v_subtotal) then
      raise exception 'INVALID_DISCOUNT' using errcode = 'P0001';
    end if;
    v_discount_amount := public.discount_amount(v_discount, v_subtotal);
    update public.discounts set used_count = used_count + 1 where id = v_discount.id;
  end if;

  update public.orders
     set subtotal = v_subtotal, shipping = v_shipping, discount = v_discount_amount,
         discount_code = case when v_discount_amount > 0 then v_code end,
         total = greatest(v_subtotal - v_discount_amount, 0) + v_shipping
   where id = v_order_id;

  return query select v_order_id, v_order_number;
end;
$$;

-- Order confirmation now includes the discount.
create or replace function public.get_order_summary(p_order_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', o.id, 'number', o.number, 'status', o.status, 'customer_name', o.customer_name,
    'city', o.city, 'payment_method', o.payment_method, 'subtotal', o.subtotal,
    'discount', o.discount, 'discount_code', o.discount_code,
    'shipping', o.shipping, 'total', o.total, 'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_name', i.product_name, 'product_slug', i.product_slug, 'image', i.image,
        'color', i.color, 'size', i.size, 'quantity', i.quantity,
        'unit_price', i.unit_price, 'line_total', i.line_total) order by i.product_name)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb))
  from public.orders o where o.id = p_order_id;
$$;

-- ---------------------------------------------------------------- grants
revoke all on function public.set_stock(uuid, integer) from public;
grant execute on function public.set_stock(uuid, integer) to authenticated;
revoke all on function public.set_member_role(text, text) from public;
grant execute on function public.set_member_role(text, text) to authenticated;
revoke all on function public.admin_save_collection(jsonb) from public;
grant execute on function public.admin_save_collection(jsonb) to authenticated;
revoke all on function public.check_discount(text, integer) from public;
grant execute on function public.check_discount(text, integer) to anon, authenticated;
grant execute on function public.my_role() to authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_owner() to anon, authenticated;
revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
revoke all on function public.get_order_summary(uuid) from public;
grant execute on function public.get_order_summary(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
