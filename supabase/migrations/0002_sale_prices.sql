-- DUKES: sale prices ("was" price shown struck through).
-- Run once in Supabase > SQL Editor after 0001_init.sql. Safe to run again.

alter table public.variants
  add column if not exists compare_at_price integer;

alter table public.variants drop constraint if exists variants_compare_at_price_check;
alter table public.variants
  add constraint variants_compare_at_price_check
  check (compare_at_price is null or compare_at_price > price);

-- Product save now also stores the "was" price.
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
  insert into public.variants (id, product_id, sku, size, size_system, color_name, color_hex, stock, price, compare_at_price)
  select coalesce(nullif(x ->> 'id', '')::uuid, gen_random_uuid()), v_id, x ->> 'sku', x ->> 'size',
         x ->> 'size_system', x ->> 'color_name', x ->> 'color_hex',
         (x ->> 'stock')::int, (x ->> 'price')::int,
         nullif(x ->> 'compare_at_price', '')::int
    from jsonb_array_elements(coalesce(payload -> 'variants', '[]')) x
  on conflict (id) do update
    set sku = excluded.sku, size = excluded.size, size_system = excluded.size_system,
        color_name = excluded.color_name, color_hex = excluded.color_hex,
        stock = excluded.stock, price = excluded.price,
        compare_at_price = excluded.compare_at_price
    where public.variants.product_id = v_id;

  return v_id;
end;
$$;

-- Sample sale prices on four demo products so the Sale page has something to show.
-- Edit or clear them in Admin > Products.
update public.variants v set compare_at_price = x.was
  from public.products p, (values ('clifton', 1850000), ('norozi', 1650000),
                                  ('heritage-belt-35mm', 1550000), ('card-holder', 850000)) as x(slug, was)
 where v.product_id = p.id and p.slug = x.slug and v.compare_at_price is null and x.was > v.price;

notify pgrst, 'reload schema';
