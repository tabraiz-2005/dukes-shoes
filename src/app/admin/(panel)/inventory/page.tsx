import type { Metadata } from "next";
import Link from "next/link";
import { getMemberWith } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";
import { StockInput } from "@/components/admin/stock-input";

export const metadata: Metadata = { title: "Inventory" };

const LOW = 3;
const FILTERS = [
  { key: "all", label: "All" },
  { key: "low", label: `Low (${LOW} or fewer)` },
  { key: "out", label: "Sold out" },
];

type Row = {
  id: string;
  sku: string;
  size: string;
  size_system: string;
  color_name: string;
  stock: number;
  products: { id: string; name: string; status: string } | null;
};

export default async function Inventory({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const member = await getMemberWith("staff");
  if (!member) return <AdminOnly />;
  const { filter = "all", q = "" } = await searchParams;
  const term = q.trim().replace(/[%,()]/g, "");
  let query = member.supabase
    .from("variants")
    .select("id, sku, size, size_system, color_name, stock, products!inner(id, name, status)")
    .neq("products.status", "archived")
    .order("sku")
    .limit(1000);
  if (filter === "low") query = query.gt("stock", 0).lte("stock", LOW);
  if (filter === "out") query = query.eq("stock", 0);
  if (term) query = query.or(`sku.ilike.%${term}%,color_name.ilike.%${term}%`);
  const { data } = await query;
  let rows = (data ?? []) as unknown as Row[];
  // Product name search runs here because PostgREST cannot OR across an embedded table.
  if (term) {
    const { data: byName } = await member.supabase
      .from("variants")
      .select("id, sku, size, size_system, color_name, stock, products!inner(id, name, status)")
      .neq("products.status", "archived")
      .ilike("products.name", `%${term}%`)
      .limit(1000);
    const seen = new Set(rows.map((r) => r.id));
    for (const r of (byName ?? []) as unknown as Row[])
      if (!seen.has(r.id) && (filter !== "low" || (r.stock > 0 && r.stock <= LOW)) && (filter !== "out" || r.stock === 0)) rows.push(r);
    rows = rows.toSorted((a, b) => a.sku.localeCompare(b.sku));
  }
  const total = rows.reduce((n, r) => n + r.stock, 0);
  const href = (f: string) => {
    const p = new URLSearchParams();
    if (f !== "all") p.set("filter", f);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `/admin/inventory?${s}` : "/admin/inventory";
  };

  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Catalogue</p>
          <h1>Inventory</h1>
          <p className="muted">Stock for every size and colour. Type a new number and press Enter — it saves on its own.</p>
        </div>
      </header>
      <div className="list-tools">
        <nav className="tab-row" aria-label="Stock filter">
          {FILTERS.map((f) => (
            <Link key={f.key} href={href(f.key)} className={f.key === filter ? "tab selected" : "tab"}>
              {f.label}
            </Link>
          ))}
        </nav>
        <form className="filter-form">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <input name="q" defaultValue={q} placeholder="Search product, SKU or colour" aria-label="Search inventory" />
          <button className="button outline-button">Search</button>
        </form>
      </div>
      {rows.length ? (
        <div className="panel flush">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Colour</th>
                <th>Size</th>
                <th className="num">In stock</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {member.role === "staff" ? (
                      r.products?.name
                    ) : (
                      <Link href={`/admin/products/${r.products?.id}`}>{r.products?.name}</Link>
                    )}
                    {r.products?.status === "draft" && <span className="status status-draft">Draft</span>}
                  </td>
                  <td className="mono">{r.sku}</td>
                  <td>{r.color_name}</td>
                  <td>{r.size_system === "ONE_SIZE" ? "One size" : `${r.size} ${r.size_system === "WAIST_IN" ? "in" : r.size_system}`}</td>
                  <td className="num">
                    <StockInput id={r.id} stock={r.stock} label={`Stock for ${r.sku}`} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>{rows.length} variants</td>
                <td className="num">{total} pieces</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="panel empty-panel"><p>Nothing here. {filter !== "all" && "Every size is well stocked."}</p></div>
      )}
    </>
  );
}
