import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdmin } from "@/lib/admin/auth";
import { getAdminCategories } from "@/lib/admin/queries";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

type Row = {
  id: string; name: string; style: string; slug: string; status: string; category_id: string; featured: boolean;
  product_images: { url: string; sort: number }[];
  variants: { stock: number; price: number }[];
};

export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; q?: string }>;
}) {
  const admin = await getAdmin();
  if (!admin?.isAdmin) return null;
  const { category = "", status = "", q = "" } = await searchParams;
  const categories = await getAdminCategories(admin.supabase);
  let query = admin.supabase
    .from("products")
    .select("id, name, style, slug, status, category_id, featured, product_images(url, sort), variants(stock, price)")
    .order("created_at", { ascending: false });
  if (category) query = query.eq("category_id", category);
  if (status) query = query.eq("status", status);
  if (q.trim()) query = query.ilike("name", `%${q.trim().replace(/[%,()]/g, "")}%`);
  const { data } = await query;
  const products = (data ?? []) as Row[];
  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <>
      <header className="admin-head">
        <h1>Products</h1>
        <div className="head-actions">
          <form className="admin-search">
            {category && <input type="hidden" name="category" value={category} />}
            <input name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" />
          </form>
          <Link href="/admin/products/new" className="button"><Plus size={16} /> New product</Link>
        </div>
      </header>
      <nav className="chip-row admin-chips" aria-label="Filter by category">
        <Link href="/admin/products" className={!category ? "chip selected" : "chip"}>All</Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/admin/products?category=${c.id}`} className={category === c.id ? "chip selected" : "chip"}>{c.name}</Link>
        ))}
      </nav>
      {products.length ? (
        <div className="panel flush">
          <table className="admin-table">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Status</th><th className="num">Stock</th><th className="num">Price</th></tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const img = p.product_images.toSorted((a, b) => a.sort - b.sort)[0]?.url ?? "/images/fallback.svg";
                const stock = p.variants.reduce((n, v) => n + v.stock, 0);
                const prices = p.variants.map((v) => v.price);
                return (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="product-cell">
                        <Image src={img} alt="" width={44} height={55} unoptimized />
                        <span>{p.name}<small>{p.style}</small></span>
                      </Link>
                    </td>
                    <td>{catName[p.category_id] ?? p.category_id}</td>
                    <td><span className={`status status-${p.status}`}>{p.status === "active" ? "Live" : p.status === "draft" ? "Draft" : "Archived"}</span>{p.featured && <small>Our picks</small>}</td>
                    <td className={`num ${stock === 0 ? "out" : ""}`}>{stock}</td>
                    <td className="num">{prices.length ? money(Math.min(...prices)) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel empty-panel">
          <p>No products here yet.</p>
          <Link href="/admin/products/new" className="button">Add your first product</Link>
        </div>
      )}
    </>
  );
}
