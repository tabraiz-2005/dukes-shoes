import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/admin/auth";
import { money } from "@/lib/format";
import { STATUS_LABEL, dateTime } from "@/lib/admin/format";
import { OrderStatusForm } from "@/components/admin/order-status";
import { Photo } from "@/components/ui";

export const metadata: Metadata = { title: "Order" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin?.isAdmin) return null;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: o } = await admin.supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!o) notFound();
  const items = o.order_items as {
    id: string; product_id: string | null; product_name: string; image: string | null;
    color: string; size: string; sku: string; unit_price: number; quantity: number; line_total: number;
  }[];
  const phoneDigits = String(o.phone).replace(/\D/g, "").replace(/^0/, "92");

  return (
    <>
      <header className="admin-head">
        <div>
          <Link href="/admin/orders" className="back-link">Orders</Link>
          <h1>Order #{o.number}</h1>
          <p className="muted">{dateTime(o.created_at)} · <span className={`status status-${o.status}`}>{STATUS_LABEL[o.status]}</span></p>
        </div>
      </header>
      <div className="admin-grid wide-left">
        <section className="panel">
          <h2>Items</h2>
          {items.map((i) => (
            <div className="checkout-line" key={i.id}>
              <span className="checkout-thumb">
                <Photo src={i.image || "/images/fallback.svg"} alt="" sizes="64px" />
                <b>{i.quantity}</b>
              </span>
              <span className="checkout-name">
                {i.product_id ? <Link href={`/admin/products/${i.product_id}`}>{i.product_name}</Link> : i.product_name}
                <small>{i.color}, size {i.size} · SKU {i.sku} · {money(i.unit_price)} each</small>
              </span>
              <strong>{money(i.line_total)}</strong>
            </div>
          ))}
          <div className="summary-line"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
          <div className="summary-line minor"><span>Delivery</span><span>{o.shipping ? money(o.shipping) : "Free"}</span></div>
          <div className="summary-line total"><span>Collect on delivery</span><strong>{money(o.total)}</strong></div>
        </section>
        <div className="admin-stack">
          <section className="panel">
            <h2>Status</h2>
            <OrderStatusForm orderId={o.id} status={o.status} />
          </section>
          <section className="panel">
            <h2>Customer</h2>
            <p><strong>{o.customer_name}</strong></p>
            <p><a href={`tel:${o.phone}`}>{o.phone}</a> · <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer">WhatsApp</a></p>
            {o.email && <p><a href={`mailto:${o.email}`}>{o.email}</a></p>}
            <h3>Deliver to</h3>
            <p>{o.address}<br />{o.city}{o.postal_code ? ` ${o.postal_code}` : ""}</p>
            {o.notes && (<><h3>Notes</h3><p>{o.notes}</p></>)}
            <p className="muted">Payment: cash on delivery</p>
          </section>
        </div>
      </div>
    </>
  );
}
