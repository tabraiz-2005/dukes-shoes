import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getMemberWith } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";

export const metadata: Metadata = { title: "Collections" };

export default async function Collections() {
  const admin = await getMemberWith("admin");
  if (!admin) return <AdminOnly />;
  const { data, error } = await admin.supabase
    .from("collections")
    .select("id, slug, title, image, status, show_on_home, sort, collection_products(product_id)")
    .order("sort");
  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Catalogue</p>
          <h1>Collections</h1>
          <p className="muted">Hand-picked edits like “The loafer edit”. The first two shown on the homepage appear as the large photo tiles.</p>
        </div>
        <Link href="/admin/collections/new" className="button"><Plus size={16} /> Add collection</Link>
      </header>
      {error ? (
        <div className="panel"><p className="form-error">Run the database update (0003_admin_upgrade.sql) in Supabase first.</p></div>
      ) : data?.length ? (
        <div className="panel flush">
          <table className="admin-table">
            <thead><tr><th>Collection</th><th>Status</th><th className="num">Products</th><th className="num">Order</th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/collections/${c.id}`} className="product-cell">
                      <Image src={c.image || "/images/fallback.svg"} alt="" width={52} height={65} unoptimized />
                      <span>{c.title}<small>/collections/{c.slug}</small></span>
                    </Link>
                  </td>
                  <td>
                    <span className="badges">
                      <span className={`status status-${c.status}`}>{c.status === "active" ? "Live" : "Draft"}</span>
                      {c.show_on_home && <span className="status">Homepage</span>}
                    </span>
                  </td>
                  <td className="num">{(c.collection_products as unknown[]).length}</td>
                  <td className="num">{c.sort}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel empty-panel"><p>No collections yet.</p><Link href="/admin/collections/new" className="button">Add a collection</Link></div>
      )}
    </>
  );
}
