-- DUKES store schema for Supabase (Postgres 15+).
-- Run once in Supabase: Dashboard > SQL Editor > paste this file > Run.
-- Then run supabase/seed.sql to load the starting catalogue.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profiles / roles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- catalogue
create table if not exists public.categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  image text,
  sort integer not null default 0
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.categories (id) on delete cascade,
  slug text not null,
  name text not null,
  sort integer not null default 0,
  unique (category_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 120),
  style text not null default '',
  description text not null default '',
  category_id text not null references public.categories (id),
  subcategory text,
  leather text not null default '',
  construction text not null default '',
  lining text not null default '',
  sole text not null default '',
  care text not null default '',
  featured boolean not null default false,
  is_new boolean not null default false,
  status text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_status_idx on public.products (status);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color text not null,
  url text not null,
  alt text not null default '',
  sort integer not null default 0
);
create index if not exists product_images_product_idx on public.product_images (product_id);

create table if not exists public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  size text not null,
  size_system text not null default 'EU'
    check (size_system in ('EU', 'UK', 'US', 'WAIST_IN', 'ONE_SIZE')),
  color_name text not null,
  color_hex text not null default '#000000' check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  stock integer not null default 0 check (stock >= 0),
  -- integer minor units (paisa): Rs 12,500 = 1250000
  price integer not null check (price >= 0),
  unique (product_id, color_name, size)
);
create index if not exists variants_product_idx on public.variants (product_id);

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  shipping_fee integer not null default 25000,             -- Rs 250
  free_shipping_threshold integer not null default 1500000, -- Rs 15,000
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------- orders
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique default nextval('public.order_number_seq'),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  city text not null,
  postal_code text,
  notes text,
  payment_method text not null default 'cod' check (payment_method in ('cod')),
  subtotal integer not null,
  shipping integer not null default 0,
  total integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.variants (id) on delete set null,
  product_name text not null,
  product_slug text,
  image text,
  color text not null,
  size text not null,
  sku text not null,
  unit_price integer not null,
  quantity integer not null check (quantity > 0),
  line_total integer not null
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------- updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- place_order
-- The only way to create an order. Prices, stock and shipping come from the
-- database, never from the browser. Stock rows are locked to prevent overselling.
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

  update public.orders
     set subtotal = v_subtotal, shipping = v_shipping, total = v_subtotal + v_shipping
   where id = v_order_id;

  return query select v_order_id, v_order_number;
end;
$$;

-- Order confirmation for the customer. The order id is an unguessable UUID,
-- so it acts as the access key; only non-sensitive fields are returned.
create or replace function public.get_order_summary(p_order_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id,
    'number', o.number,
    'status', o.status,
    'customer_name', o.customer_name,
    'city', o.city,
    'payment_method', o.payment_method,
    'subtotal', o.subtotal,
    'shipping', o.shipping,
    'total', o.total,
    'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_name', i.product_name, 'product_slug', i.product_slug, 'image', i.image,
        'color', i.color, 'size', i.size, 'quantity', i.quantity,
        'unit_price', i.unit_price, 'line_total', i.line_total) order by i.product_name)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o where o.id = p_order_id;
$$;

-- Admin status change. Cancelling returns stock; a cancelled order stays cancelled.
create or replace function public.set_order_status(p_order_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current text;
begin
  if not public.is_admin() then
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
    update public.variants v
       set stock = v.stock + i.quantity
      from public.order_items i
     where i.order_id = p_order_id and i.variant_id = v.id;
  end if;
  update public.orders set status = p_status where id = p_order_id;
end;
$$;

-- Admin: save a product with its images and variants in one transaction.
-- Runs with the caller's rights, so row-level security still applies.
create or replace function public.admin_save_product(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid := nullif(payload ->> 'id', '')::uuid;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if v_id is null then
    insert into public.products (slug, name, style, description, category_id, subcategory, leather,
                                 construction, lining, sole, care, featured, is_new, status)
    values (payload ->> 'slug', payload ->> 'name', coalesce(payload ->> 'style', ''),
            coalesce(payload ->> 'description', ''), payload ->> 'category_id',
            nullif(payload ->> 'subcategory', ''), coalesce(payload ->> 'leather', ''),
            coalesce(payload ->> 'construction', ''), coalesce(payload ->> 'lining', ''),
            coalesce(payload ->> 'sole', ''), coalesce(payload ->> 'care', ''),
            coalesce((payload ->> 'featured')::boolean, false),
            coalesce((payload ->> 'is_new')::boolean, false),
            coalesce(payload ->> 'status', 'draft'))
    returning id into v_id;
  else
    update public.products set
      slug = payload ->> 'slug',
      name = payload ->> 'name',
      style = coalesce(payload ->> 'style', ''),
      description = coalesce(payload ->> 'description', ''),
      category_id = payload ->> 'category_id',
      subcategory = nullif(payload ->> 'subcategory', ''),
      leather = coalesce(payload ->> 'leather', ''),
      construction = coalesce(payload ->> 'construction', ''),
      lining = coalesce(payload ->> 'lining', ''),
      sole = coalesce(payload ->> 'sole', ''),
      care = coalesce(payload ->> 'care', ''),
      featured = coalesce((payload ->> 'featured')::boolean, false),
      is_new = coalesce((payload ->> 'is_new')::boolean, false),
      status = coalesce(payload ->> 'status', 'draft')
    where id = v_id;
    if not found then
      raise exception 'NOT_FOUND' using errcode = 'P0001';
    end if;
  end if;

  -- Images: remove the ones no longer listed, then upsert in the given order.
  delete from public.product_images
   where product_id = v_id
     and id not in (select (x ->> 'id')::uuid
                      from jsonb_array_elements(coalesce(payload -> 'images', '[]')) x
                     where coalesce(x ->> 'id', '') <> '');
  insert into public.product_images (id, product_id, color, url, alt, sort)
  select coalesce(nullif(x ->> 'id', '')::uuid, gen_random_uuid()), v_id, x ->> 'color', x ->> 'url',
         coalesce(x ->> 'alt', ''), (ord - 1)::int
    from jsonb_array_elements(coalesce(payload -> 'images', '[]')) with ordinality as t(x, ord)
  on conflict (id) do update
    set color = excluded.color, url = excluded.url, alt = excluded.alt, sort = excluded.sort
    where public.product_images.product_id = v_id;

  -- Variants: same approach. Past orders keep their own copy of name, size and price.
  delete from public.variants
   where product_id = v_id
     and id not in (select (x ->> 'id')::uuid
                      from jsonb_array_elements(coalesce(payload -> 'variants', '[]')) x
                     where coalesce(x ->> 'id', '') <> '');
  insert into public.variants (id, product_id, sku, size, size_system, color_name, color_hex, stock, price)
  select coalesce(nullif(x ->> 'id', '')::uuid, gen_random_uuid()), v_id, x ->> 'sku', x ->> 'size',
         x ->> 'size_system', x ->> 'color_name', x ->> 'color_hex',
         (x ->> 'stock')::int, (x ->> 'price')::int
    from jsonb_array_elements(coalesce(payload -> 'variants', '[]')) x
  on conflict (id) do update
    set sku = excluded.sku, size = excluded.size, size_system = excluded.size_system,
        color_name = excluded.color_name, color_hex = excluded.color_hex,
        stock = excluded.stock, price = excluded.price
    where public.variants.product_id = v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------- row level security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.variants enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "own profile or admin" on public.profiles;
create policy "own profile or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "admin manages profiles" on public.profiles;
create policy "admin manages profiles" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read" on public.categories;
create policy "public read" on public.categories for select using (true);
drop policy if exists "admin write" on public.categories;
create policy "admin write" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read" on public.subcategories;
create policy "public read" on public.subcategories for select using (true);
drop policy if exists "admin write" on public.subcategories;
create policy "admin write" on public.subcategories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read active or admin" on public.products;
create policy "read active or admin" on public.products
  for select using (status = 'active' or public.is_admin());
drop policy if exists "admin write" on public.products;
create policy "admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read with product" on public.product_images;
create policy "read with product" on public.product_images for select using (
  public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
drop policy if exists "admin write" on public.product_images;
create policy "admin write" on public.product_images for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read with product" on public.variants;
create policy "read with product" on public.variants for select using (
  public.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
drop policy if exists "admin write" on public.variants;
create policy "admin write" on public.variants for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read" on public.store_settings;
create policy "public read" on public.store_settings for select using (true);
drop policy if exists "admin write" on public.store_settings;
create policy "admin write" on public.store_settings for update using (public.is_admin()) with check (public.is_admin());

-- Orders: no public insert/select policies. Customers create orders only through place_order().
drop policy if exists "admin read" on public.orders;
create policy "admin read" on public.orders for select using (public.is_admin());
drop policy if exists "admin read" on public.order_items;
create policy "admin read" on public.order_items for select using (public.is_admin());

revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
revoke all on function public.get_order_summary(uuid) from public;
grant execute on function public.get_order_summary(uuid) to anon, authenticated;
revoke all on function public.set_order_status(uuid, text) from public;
grant execute on function public.set_order_status(uuid, text) to authenticated;
revoke all on function public.admin_save_product(jsonb) from public;
grant execute on function public.admin_save_product(jsonb) to authenticated;

-- ---------------------------------------------------------------- storage (product photos)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

-- Make the new tables and functions visible to the Supabase API immediately.
notify pgrst, 'reload schema';
