import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminCategory, ProductRecord } from "@/components/admin/product-form";

export async function getAdminCategories(db: SupabaseClient): Promise<AdminCategory[]> {
  const { data } = await db
    .from("categories")
    .select("id, name, sort, subcategories(slug, name, sort)")
    .order("sort");
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    subcategories: ((c.subcategories as { slug: string; name: string; sort: number }[]) ?? [])
      .toSorted((a, b) => a.sort - b.sort)
      .map(({ slug, name }) => ({ slug, name })),
  }));
}

export async function getAdminProduct(db: SupabaseClient, id: string) {
  const { data } = await db
    .from("products")
    .select("*, product_images(id, color, url, alt, sort), variants(id, sku, size, size_system, color_name, color_hex, stock, price, compare_at_price)")
    .eq("id", id)
    .maybeSingle();
  return data as ProductRecord | null;
}
