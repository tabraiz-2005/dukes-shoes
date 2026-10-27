"use client";
import { useState, useTransition } from "react";
import { saveStoreContent } from "@/app/admin/actions";
import type { StoreContent } from "@/types";
import { FormMessage } from "./image-field";

const FIELDS: { k: keyof StoreContent; label: string; placeholder: string; hint?: string; type?: string }[] = [
  { k: "announcement", label: "Announcement bar", placeholder: "Free delivery across Pakistan on orders above Rs 15,000.", hint: "The thin line at the very top of every page. Leave empty to hide it." },
  { k: "address", label: "Store address", placeholder: "Shop 12, MM Alam Road, Gulberg III, Lahore" },
  { k: "hours", label: "Opening hours", placeholder: "Mon – Sat, 11am – 9pm" },
  { k: "whatsapp", label: "WhatsApp number", placeholder: "+92 300 1234567", type: "tel", hint: "Shown in the footer as a chat link." },
  { k: "email", label: "Email", placeholder: "hello@dukes.pk", type: "email" },
  { k: "instagram", label: "Instagram link", placeholder: "https://www.instagram.com/dukes_shoes/", type: "url" },
];

export function StoreForm({ initial }: { initial: StoreContent }) {
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await saveStoreContent(v);
          setMsg({ ok: r.ok, text: r.ok ? (r.message ?? "Saved.") : r.message });
        });
      }}
    >
      {FIELDS.map((f) => (
        <label className="field" key={f.k}>
          <span>{f.label}</span>
          {f.k === "announcement" ? (
            <textarea rows={2} maxLength={200} value={v[f.k]} placeholder={f.placeholder} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} />
          ) : (
            <input type={f.type ?? "text"} value={v[f.k]} placeholder={f.placeholder} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} />
          )}
          {f.hint && <small className="muted">{f.hint}</small>}
        </label>
      ))}
      <FormMessage msg={msg} />
      <button className="button" disabled={pending}>{pending ? "Saving…" : "Save store details"}</button>
    </form>
  );
}
