import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getMemberWith } from "@/lib/admin/auth";
import { getAdminCategories } from "@/lib/admin/queries";
import { money } from "@/lib/format";
import { AdminOnly } from "@/components/admin/denied";

export const metadata: Metadata = { title: "Products" };

const TABS = [
  { key: "current", label: "Current", statuses: ["active", "draft"] },
  { key: "live", label: "Live", statuses: ["active"] },
  { key: "drafts", label: "Drafts", statuses: ["draft"] },
  { key: "archived", label: "Archived", statuses: ["archived"] },
  { key: "all", label: "All", statuses: ["active", "draft", "archived"] },
] as const;

type Row = {
  id: string;
  name: string;
  style: string;
  slug: string;
  status: string;
  category_id: string;
  featured: boolean;
  is_new: boolean;
  product_images: { url: string; sort: number }[];
  variants: { sku: string; stock: number; price: number; compare_at_price: number | null }[];
};

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; category?: string; q?: string }>;
}) {
  const admin = await getMemberWith("admin");
  if (!admin) return <AdminOnly />;
  const { tab = "current", category = "", q = "" } = await searchParams;
  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const term = q.trim().replace(/[%,()]/g, "");
  const db = admin.supabase;
  const categories = await getAdminCategories(db);

  // A search matches the product name or any of its SKUs.
  let skuIds: string[] = [];
  if (term) {
    const { data } = await db.from("variants").select("product_id").ilike("sku", `%${term}%`).limit(200);
    skuIds = [...new Set((data ?? []).map((v) => v.product_id as string))];
  }
  let query = db
    .from("products")
    .select("id, name, style, slug, status, category_id, featured, is_new, product_images(url, sort), variants(sku, stock, price, compare_at_price)")
    .in("status", [...active.statuses])
    .order("created_at", { ascending: false });
  if (category) query = query.eq("category_id", category);
  if (term)
    query = skuIds.length
      ? query.or(`name.ilike.%${term}%,id.in.(${skuIds.join(",")})`)
      : query.ilike("name", `%${term}%`);
  const { data } = await query;
  const products = (data ?? []) as Row[];
  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const href = (changes: Record<string, string>) => {
    const p = new URLSearchParams({ tab, category, q, ...changes });
    for (const [k, v] of [...p.entries()]) if (!v || (k === "tab" && v === "current")) p.delete(k);
    const s = p.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  };

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Catalogue</p>
          <h1>Products</h1>
          <p className="muted">Everything in the store. Drafts stay hidden from customers until you set them live.</p>
        </div>
        <Link href="/admin/products/new" className="button">
          <Plus size={16} /> Add product
        </Link>
      </header>

      <div className="list-tools">
        <nav className="tab-row" aria-label="Product status">
          {TABS.map((t) => (
            <Link key={t.key} href={href({ tab: t.key })} className={t.key === active.key ? "tab selected" : "tab"} aria-current={t.key === active.key ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>
        <form className="filter-form">
          {tab !== "current" && <input type="hidden" name="tab" value={tab} />}
          <input name="q" defaultValue={q} placeholder="Search name or SKU" aria-label="Search products by name or SKU" />
          <select name="category" defaultValue={category} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className="button outline-button">Filter</button>
        </form>
      </div>

      {products.length ? (
        <div className="panel flush">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Category</th>
                <th className="num">Price</th>
                <th className="num">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const img = p.product_images.toSorted((a, b) => a.sort - b.sort)[0]?.url ?? "/images/fallback.svg";
                const stock = p.variants.reduce((n, v) => n + v.stock, 0);
                const prices = p.variants.map((v) => v.price);
                const onSale = p.variants.some((v) => (v.compare_at_price ?? 0) > v.price);
                const skuPrefix = p.variants[0]?.sku.split("-").slice(0, 2).join("-");
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="product-cell">
                        <Image src={img} alt="" width={52} height={65} unoptimized />
                        <span>
                          {p.name}
                          <small>{skuPrefix || p.style}</small>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <span className="badges">
                        <span className={`status status-${p.status}`}>
                          {p.status === "active" ? "Live" : p.status === "draft" ? "Draft" : "Archived"}
                        </span>
                        {p.is_new && <span className="status">New</span>}
                        {p.featured && <span className="status">Featured</span>}
                        {onSale && <span className="status status-cancelled">Sale</span>}
                      </span>
                    </td>
                    <td>{catName[p.category_id] ?? p.category_id}</td>
                    <td className="num">{prices.length ? money(Math.min(...prices)) : "—"}</td>
                    <td className={`num ${stock === 0 ? "out" : ""}`}>
                      {stock}
                      <small>{p.variants.length} variants</small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel empty-panel">
          <p>No products match. Try another tab, category or search.</p>
          <Link href="/admin/products/new" className="button">Add a product</Link>
        </div>
      )}
    </>
  );
}
