import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getMemberWith } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";

export const metadata: Metadata = { title: "Categories" };

export default async function Categories() {
  const admin = await getMemberWith("admin");
  if (!admin) return <AdminOnly />;
  const db = admin.supabase;
  const [{ data: cats }, { data: prods }] = await Promise.all([
    db.from("categories").select("id, name, description, image, sort, subcategories(name, sort)").order("sort"),
    db.from("products").select("category_id").neq("status", "archived"),
  ]);
  const counts: Record<string, number> = {};
  for (const p of prods ?? []) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Catalogue</p>
          <h1>Categories</h1>
          <p className="muted">The menu customers browse by: name, photo, order and the smaller groups inside each one.</p>
        </div>
        <Link href="/admin/categories/new" className="button"><Plus size={16} /> Add category</Link>
      </header>
      <div className="panel flush">
        <table className="admin-table">
          <thead>
            <tr><th>Category</th><th>Groups inside</th><th className="num">Products</th><th className="num">Order</th></tr>
          </thead>
          <tbody>
            {(cats ?? []).map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/categories/${c.id}`} className="product-cell">
                    <Image src={c.image || "/images/fallback.svg"} alt="" width={52} height={65} unoptimized />
                    <span>{c.name}<small>/shop?category={c.id}</small></span>
                  </Link>
                </td>
                <td className="muted">
                  {((c.subcategories as { name: string; sort: number }[]) ?? [])
                    .toSorted((a, b) => a.sort - b.sort)
                    .map((s) => s.name)
                    .join(", ") || "—"}
                </td>
                <td className="num">{counts[c.id] ?? 0}</td>
                <td className="num">{c.sort}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
