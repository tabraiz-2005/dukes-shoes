"use client";
import { useState, useTransition } from "react";
import { setOrderStatus } from "@/app/admin/actions";
import { STATUS_LABEL } from "@/lib/admin/format";

const NEXT: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function OrderStatusForm({ orderId, status }: { orderId: string; status: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next = NEXT[status] ?? [];

  const go = (s: string) =>
    start(async () => {
      const r = await setOrderStatus(orderId, s);
      setMessage(r.ok ? (r.message ?? "") : r.message);
      setConfirmCancel(false);
    });

  if (!next.length)
    return <p className="muted">{status === "delivered" ? "This order is complete." : "This order was cancelled and its stock returned."}</p>;

  return (
    <div className="status-actions">
      {next.filter((s) => s !== "cancelled").map((s) => (
        <button key={s} className="button" disabled={pending} onClick={() => go(s)}>
          Mark as {STATUS_LABEL[s].toLowerCase()}
        </button>
      ))}
      {confirmCancel ? (
        <div className="confirm-row">
          <span>Cancel and return the stock?</span>
          <button className="button danger" disabled={pending} onClick={() => go("cancelled")}>Cancel order</button>
          <button className="text-link" onClick={() => setConfirmCancel(false)}>Keep order</button>
        </div>
      ) : (
        <button className="text-link danger-link" disabled={pending} onClick={() => setConfirmCancel(true)}>
          Cancel order
        </button>
      )}
      {message && <p role="status" className="muted">{message}</p>}
    </div>
  );
}
