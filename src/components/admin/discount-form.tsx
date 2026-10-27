"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDiscount, saveDiscount } from "@/app/admin/actions";
import { FormMessage } from "./image-field";

export type DiscountRecord = {
  id: string;
  code: string;
  description: string;
  kind: "percent" | "fixed";
  value: number;
  min_subtotal: number;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  used_count: number;
  active: boolean;
};

/** Dates are picked as Pakistan calendar days. */
const toDay = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }) : "";
const fromDay = (day: string, end: boolean) => (day ? `${day}T${end ? "23:59:59" : "00:00:00"}+05:00` : null);
const digits = (s: string) => s.replace(/[^\d]/g, "");

export function DiscountForm({ discount, notice }: { discount: DiscountRecord | null; notice?: string }) {
  const router = useRouter();
  const d = discount;
  const [code, setCode] = useState(d?.code ?? "");
  const [description, setDescription] = useState(d?.description ?? "");
  const [kind, setKind] = useState<"percent" | "fixed">(d?.kind ?? "percent");
  const [value, setValue] = useState(d ? String(d.kind === "percent" ? d.value : d.value / 100) : "10");
  const [min, setMin] = useState(d?.min_subtotal ? String(d.min_subtotal / 100) : "");
  const [starts, setStarts] = useState(toDay(d?.starts_at ?? null));
  const [ends, setEnds] = useState(toDay(d?.ends_at ?? null));
  const [limit, setLimit] = useState(d?.usage_limit ? String(d.usage_limit) : "");
  const [active, setActive] = useState(d?.active ?? true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(notice ? { ok: true, text: notice } : null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    setMsg(null);
    if (starts && ends && ends < starts) return setMsg({ ok: false, text: "The end date is before the start date." });
    start(async () => {
      const r = await saveDiscount({
        id: d?.id,
        code,
        description,
        kind,
        value: kind === "percent" ? Number(value) : Number(value) * 100,
        min_subtotal: (Number(min) || 0) * 100,
        starts_at: fromDay(starts, false),
        ends_at: fromDay(ends, true),
        usage_limit: limit ? Number(limit) : null,
        active,
      });
      if (!r.ok) return setMsg({ ok: false, text: r.message });
      if (!d) router.replace(`/admin/discounts/${r.id}?created=1`);
      else {
        setMsg({ ok: true, text: r.message ?? "Saved." });
        router.refresh();
      }
    });
  }

  return (
    <form className="admin-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <section className="panel narrow">
        <label className="field">
          <span>Code</span>
          <input className="mono" value={code} maxLength={30} required placeholder="EID20" onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} />
          <small className="muted">What customers type at checkout. Letters, numbers, dashes.</small>
        </label>
        <label className="field">
          <span>Note for your team<em> (optional)</em></span>
          <input value={description} maxLength={200} placeholder="Eid campaign on Instagram" onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Type</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as "percent" | "fixed")}>
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed amount off, Rs</option>
            </select>
          </label>
          <label className="field">
            <span>{kind === "percent" ? "Percent off" : "Rupees off"}</span>
            <input inputMode="numeric" value={value} required onChange={(e) => setValue(digits(e.target.value).slice(0, kind === "percent" ? 2 : 7))} />
          </label>
        </div>
        <label className="field">
          <span>Minimum order, Rs<em> (optional)</em></span>
          <input inputMode="numeric" value={min} placeholder="No minimum" onChange={(e) => setMin(digits(e.target.value).slice(0, 7))} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Starts<em> (optional)</em></span>
            <input type="date" value={starts} onChange={(e) => setStarts(e.target.value)} />
          </label>
          <label className="field">
            <span>Ends<em> (optional)</em></span>
            <input type="date" value={ends} onChange={(e) => setEnds(e.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Total uses allowed<em> (optional)</em></span>
          <input inputMode="numeric" value={limit} placeholder="Unlimited" onChange={(e) => setLimit(digits(e.target.value).slice(0, 6))} />
        </label>
        <label className="check">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Turned on (customers can use it)
        </label>
      </section>
      <div className="save-bar">
        {d &&
          (confirm ? (
            <span className="confirm">
              Delete this code? Past orders keep their discount.
              <button type="button" className="text-link danger" disabled={pending} onClick={() => start(async () => { const r = await deleteDiscount(d.id); if (r && !r.ok) setMsg({ ok: false, text: r.message }); })}>Yes, delete</button>
              <button type="button" className="text-link" onClick={() => setConfirm(false)}>Cancel</button>
            </span>
          ) : (
            <button type="button" className="text-link danger" onClick={() => setConfirm(true)}>Delete code</button>
          ))}
        <FormMessage msg={msg} />
        <button className="button" disabled={pending || code.length < 3 || !value}>{pending ? "Saving…" : "Save code"}</button>
      </div>
    </form>
  );
}
