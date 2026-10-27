import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/lib/admin/auth";
import { money } from "@/lib/format";
import { STATUS_LABEL, dateTime } from "@/lib/admin/format";

export const metadata: Metadata = { title: "Orders" };
const FILTERS = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"];

export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const admin = await getAdmin();
  if (!admin?.isAdmin) return null;
  const { status = "all", q = "" } = await searchParams;
  let query = admin.supabase
    .from("orders")
    .select("id, number, customer_name, phone, city, total, status, created_at, order_items(quantity)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status !== "all" && FILTERS.includes(status)) query = query.eq("status", status);
  const term = q.trim().replace(/[%,()]/g, "");
  if (term)
    query = /^\d+$/.test(term)
      ? query.or(`number.eq.${term},phone.ilike.%${term}%`)
      : query.ilike("customer_name", `%${term}%`);
  const { data: orders, error } = await query;

  return (
    <>
      <header className="admin-head">
        <h1>Orders</h1>
        <form className="admin-search">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Order number, phone or name" aria-label="Search orders" />
        </form>
      </header>
      <nav className="chip-row admin-chips" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <Link key={f} href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`} className={status === f ? "chip selected" : "chip"}>
            {f === "all" ? "All" : STATUS_LABEL[f]}
          </Link>
        ))}
      </nav>
      {error && <p className="form-error">{error.message}</p>}
      {orders?.length ? (
        <div className="panel flush">
          <table className="admin-table">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Items</th><th>Status</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`}>#{o.number}</Link><small>{dateTime(o.created_at)}</small></td>
                  <td>{o.customer_name}<small>{o.phone}, {o.city}</small></td>
                  <td>{(o.order_items as { quantity: number }[]).reduce((n, i) => n + i.quantity, 0)}</td>
                  <td><span className={`status status-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                  <td className="num">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted panel">No orders match. New orders appear here as customers check out.</p>
      )}
    </>
  );
}
