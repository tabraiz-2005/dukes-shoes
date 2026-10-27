import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getMemberWith } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "Discounts" };

type D = {
  id: string; code: string; description: string; kind: "percent" | "fixed"; value: number;
  min_subtotal: number; starts_at: string | null; ends_at: string | null;
  usage_limit: number | null; used_count: number; active: boolean;
};

function discountState(d: D, now: number) {
  if (!d.active) return { label: "Off", cls: "status-archived" };
  if (d.starts_at && Date.parse(d.starts_at) > now) return { label: "Scheduled", cls: "status-pending" };
  if (d.ends_at && Date.parse(d.ends_at) < now) return { label: "Ended", cls: "status-archived" };
  if (d.usage_limit && d.used_count >= d.usage_limit) return { label: "Used up", cls: "status-archived" };
  return { label: "Active", cls: "status-active" };
}
const date = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : null;

async function load(db: NonNullable<Awaited<ReturnType<typeof getMemberWith>>>["supabase"]) {
  const r = await db.from("discounts").select("*").order("created_at", { ascending: false });
  return { ...r, now: Date.now() };
}

export default async function Discounts() {
  const admin = await getMemberWith("admin");
  if (!admin) return <AdminOnly />;
  const { data, error, now } = await load(admin.supabase);
  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Marketing</p>
          <h1>Discounts</h1>
          <p className="muted">Codes customers type at checkout. For a sale price on a product, set its “Was” price in Products instead.</p>
        </div>
        <Link href="/admin/discounts/new" className="button"><Plus size={16} /> Create code</Link>
      </header>
      {error ? (
        <div className="panel"><p className="form-error">Run the database update (0003_admin_upgrade.sql) in Supabase first.</p></div>
      ) : data?.length ? (
        <div className="panel flush">
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Status</th><th>Discount</th><th>Dates</th><th className="num">Used</th></tr></thead>
            <tbody>
              {(data as D[]).map((d) => {
                const s = discountState(d, now);
                return (
                  <tr key={d.id}>
                    <td><Link href={`/admin/discounts/${d.id}`} className="mono strong">{d.code}</Link>{d.description && <small className="block muted">{d.description}</small>}</td>
                    <td><span className={`status ${s.cls}`}>{s.label}</span></td>
                    <td>
                      {d.kind === "percent" ? `${d.value}% off` : `${money(d.value)} off`}
                      {d.min_subtotal > 0 && <small className="block muted">Orders from {money(d.min_subtotal)}</small>}
                    </td>
                    <td className="muted">{date(d.starts_at) || date(d.ends_at) ? `${date(d.starts_at) ?? "Now"} – ${date(d.ends_at) ?? "No end"}` : "Always"}</td>
                    <td className="num">{d.used_count}{d.usage_limit ? ` / ${d.usage_limit}` : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel empty-panel"><p>No discount codes yet.</p><Link href="/admin/discounts/new" className="button">Create a code</Link></div>
      )}
    </>
  );
}
