import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { money } from "@/lib/format";
import { Photo } from "@/components/ui";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

type Summary = {
  id: string;
  number: number;
  status: string;
  customer_name: string;
  city: string;
  subtotal: number;
  shipping: number;
  total: number;
  items: {
    product_name: string;
    product_slug: string | null;
    image: string | null;
    color: string;
    size: string;
    quantity: number;
    line_total: number;
  }[];
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await createPublicClient({ cached: false }).rpc(
    "get_order_summary",
    { p_order_id: id },
  );
  const order = data as Summary | null;
  if (!order) notFound();
  const first = order.customer_name.split(" ")[0];
  return (
    <section className="section page order-confirmation">
      <div className="order-head">
        <CheckCircle2 size={40} strokeWidth={1.2} aria-hidden="true" />
        <p className="order-number">Order #{order.number}</p>
        <h1>Thank you, {first}.</h1>
        <p>
          Your order is placed. We will call you to confirm it before it is
          dispatched to {order.city}. Pay in cash when it arrives.
        </p>
      </div>
      <div className="order-summary order-box">
        {order.items.map((i, k) => (
          <div className="checkout-line" key={k}>
            <span className="checkout-thumb">
              <Photo src={i.image || "/images/fallback.svg"} alt="" sizes="64px" />
              <b>{i.quantity}</b>
            </span>
            <span className="checkout-name">
              {i.product_name}
              <small>
                {i.color}
                {i.size === "One size" ? "" : `, size ${i.size}`}
              </small>
            </span>
            <strong>{money(i.line_total)}</strong>
          </div>
        ))}
        <div className="summary-line">
          <span>Subtotal</span>
          <span>{money(order.subtotal)}</span>
        </div>
        <div className="summary-line minor">
          <span>Delivery</span>
          <span>{order.shipping ? money(order.shipping) : "Free"}</span>
        </div>
        <div className="summary-line total">
          <span>Total, cash on delivery</span>
          <strong>{money(order.total)}</strong>
        </div>
      </div>
      <Link className="button" href="/shop">
        Continue shopping
      </Link>
    </section>
  );
}
