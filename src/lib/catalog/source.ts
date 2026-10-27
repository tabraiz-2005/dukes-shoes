import "server-only";
import { cache } from "react";
import { categories as demoCategories, products as demoProducts } from "@/data/catalog";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  CatalogData,
  Category,
  Product,
  ProductImage,
  SizeSystem,
} from "@/types";

const DEMO_SETTINGS = { shippingFee: 25000, freeShippingThreshold: 1500000 };

type Row = Record<string, unknown>;
type ImageRow = { color: string; url: string; alt: string; sort: number };
type VariantRow = {
  id: string;
  sku: string;
  size: string;
  size_system: SizeSystem;
  color_name: string;
  color_hex: string;
  stock: number;
  price: number;
  compare_at_price: number | null;
};

const sizeOrder = (a: string, b: string) =>
  Number(a) - Number(b) || a.localeCompare(b);

export function mapProduct(row: Row): Product {
  const images = ((row.product_images as ImageRow[]) ?? []).toSorted(
    (a, b) => a.sort - b.sort,
  );
  const variantRows = (row.variants as VariantRow[]) ?? [];
  const colorOrder = [
    ...new Set([
      ...images.map((i) => i.color),
      ...variantRows.map((v) => v.color_name),
    ]),
  ];
  const byColor: Record<string, ProductImage[]> = {};
  for (const c of colorOrder) byColor[c] = [];
  for (const i of images)
    byColor[i.color].push({ src: i.url, alt: i.alt || `${row.name}` });
  const variants = variantRows
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      sizeSystem: v.size_system,
      color: { name: v.color_name, hex: v.color_hex },
      stock: v.stock,
      price: v.price,
      compareAtPrice: v.compare_at_price,
    }))
    .sort(
      (a, b) =>
        colorOrder.indexOf(a.color.name) - colorOrder.indexOf(b.color.name) ||
        sizeOrder(a.size, b.size),
    );
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    style: (row.style as string) ?? "",
    description: (row.description as string) ?? "",
    categoryId: row.category_id as string,
    subcategory: (row.subcategory as string) ?? "",
    leather: (row.leather as string) ?? "",
    construction: (row.construction as string) ?? "",
    lining: (row.lining as string) ?? "",
    sole: (row.sole as string) ?? "",
    care: (row.care as string) ?? "",
    images: byColor,
    tags: [],
    createdAt: row.created_at as string,
    featured: Boolean(row.featured),
    isNew: Boolean(row.is_new),
    variants,
  };
}

export const PRODUCT_SELECT =
  "*, product_images(color, url, alt, sort), variants(id, sku, size, size_system, color_name, color_hex, stock, price, compare_at_price)";

async function loadFromSupabase(): Promise<CatalogData> {
  const db = createPublicClient();
  const [cats, prods, settings] = await Promise.all([
    db
      .from("categories")
      .select("id, slug, name, description, image, sort, subcategories(slug, name, sort)")
      .order("sort"),
    db
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    db.from("store_settings").select("shipping_fee, free_shipping_threshold").maybeSingle(),
  ]);
  if (cats.error) throw new Error(`Catalogue: ${cats.error.message}`);
  if (prods.error) throw new Error(`Catalogue: ${prods.error.message}`);

  const categories: Category[] = (cats.data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description ?? "",
    image: c.image ?? "/images/fallback.svg",
    subcategories: ((c.subcategories as { slug: string; name: string; sort: number }[]) ?? [])
      .toSorted((a, b) => a.sort - b.sort)
      .map(({ slug, name }) => ({ slug, name })),
  }));
  const products = (prods.data ?? [])
    .map(mapProduct)
    // A product needs at least one variant to be sold.
    .filter((p) => p.variants.length > 0);

  return {
    categories,
    products,
    settings: settings.data
      ? {
          shippingFee: settings.data.shipping_fee,
          freeShippingThreshold: settings.data.free_shipping_threshold,
        }
      : DEMO_SETTINGS,
    source: "supabase",
  };
}

/** The catalogue for this request: Supabase when configured, otherwise demo data. */
export const getCatalogData = cache(async (): Promise<CatalogData> => {
  if (isSupabaseConfigured()) return loadFromSupabase();
  return {
    categories: demoCategories,
    products: demoProducts,
    settings: DEMO_SETTINGS,
    source: "demo",
  };
});
