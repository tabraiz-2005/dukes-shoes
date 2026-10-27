import Link from "next/link";
import { getAdmin } from "@/lib/admin/auth";
import { money } from "@/lib/format";
import { STATUS_LABEL, dateTime, daysAgoIso } from "@/lib/admin/format";

export default async function Dashboard() {
  const admin = await getAdmin();
  if (!admin?.isAdmin) return null;
  const db = admin.supabase;
  const since = daysAgoIso(30);
  const [recent, month, pending, lowStock, products] = await Promise.all([
    db.from("orders").select("id, number, customer_name, city, total, status, created_at").order("created_at", { ascending: false }).limit(8),
    db.from("orders").select("total, status").gte("created_at", since),
    db.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("variants").select("id, sku, size, color_name, stock, products!inner(id, name, status)").lte("stock", 2).eq("products.status", "active").order("stock").limit(8),
    db.from("products").select("status"),
  ]);
  const live = (month.data ?? []).filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const activeCount = (products.data ?? []).filter((p) => p.status === "active").length;

  return (
    <>
      <header className="admin-head">
        <h1>Dashboard</h1>
      </header>
      <div className="stat-row">
        <Link href="/admin/orders?status=pending" className="stat">
          <span>To confirm</span>
          <strong>{pending.count ?? 0}</strong>
          <small>pending orders</small>
        </Link>
        <div className="stat">
          <span>Last 30 days</span>
          <strong>{live.length}</strong>
          <small>orders, excluding cancelled</small>
        </div>
        <div className="stat">
          <span>Sales, 30 days</span>
          <strong>{money(revenue)}</strong>
          <small>cash on delivery value</small>
        </div>
        <Link href="/admin/products" className="stat">
          <span>Live products</span>
          <strong>{activeCount}</strong>
          <small>{(products.data ?? []).length - activeCount} draft or archived</small>
        </Link>
      </div>
      <div className="admin-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Latest orders</h2>
            <Link href="/admin/orders" className="text-link">All orders</Link>
          </div>
          {recent.data?.length ? (
            <table className="admin-table">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Status</th><th className="num">Total</th></tr>
              </thead>
              <tbody>
                {recent.data.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/orders/${o.id}`}>#{o.number}</Link><small>{dateTime(o.created_at)}</small></td>
                    <td>{o.customer_name}<small>{o.city}</small></td>
                    <td><span className={`status status-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                    <td className="num">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No orders yet. They appear here as soon as a customer checks out.</p>
          )}
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>Low stock</h2>
          </div>
          {lowStock.data?.length ? (
            <ul className="low-stock">
              {lowStock.data.map((v) => {
                const p = v.products as unknown as { id: string; name: string };
                return (
                  <li key={v.id}>
                    <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                    <span>{v.color_name}, {v.size}</span>
                    <b className={v.stock === 0 ? "out" : ""}>{v.stock === 0 ? "Sold out" : `${v.stock} left`}</b>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">Every size has more than 2 in stock.</p>
          )}
        </section>
      </div>
    </>
  );
}
