"use client";
import { useState, useTransition } from "react";
import { saveSettings } from "@/app/admin/actions";

export function SettingsForm({ shippingFee, threshold }: { shippingFee: number; threshold: number }) {
  const [fee, setFee] = useState(String(shippingFee));
  const [free, setFree] = useState(String(threshold));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveSettings({
            shippingFee: Math.round(Number(fee) * 100),
            freeShippingThreshold: Math.round(Number(free) * 100),
          });
          setMsg({ ok: r.ok, text: r.ok ? (r.message ?? "Saved.") : r.message });
        });
      }}
    >
      <label className="field">
        <span>Delivery charge, Rs</span>
        <input inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d]/g, ""))} />
      </label>
      <label className="field">
        <span>Free delivery on orders from, Rs</span>
        <input inputMode="numeric" value={free} onChange={(e) => setFree(e.target.value.replace(/[^\d]/g, ""))} />
      </label>
      <p className="muted">Applied at checkout. Update the announcement bar below to match.</p>
      {msg && <p className={msg.ok ? "form-ok" : "form-error"} role="status">{msg.text}</p>}
      <button className="button" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
