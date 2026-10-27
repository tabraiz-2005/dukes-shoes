import type { Metadata } from "next";
import { getMemberWith } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";
import { SettingsForm } from "@/components/admin/settings-form";
import { StoreForm } from "@/components/admin/store-form";
import { mergeStore } from "@/config/content";
import type { StoreContent } from "@/types";

export const metadata: Metadata = { title: "Store settings" };

export default async function Settings() {
  const admin = await getMemberWith("admin");
  if (!admin) return <AdminOnly />;
  const [{ data }, { data: content, error }] = await Promise.all([
    admin.supabase.from("store_settings").select("shipping_fee, free_shipping_threshold").maybeSingle(),
    admin.supabase.from("site_content").select("value").eq("key", "store").maybeSingle(),
  ]);
  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Store</p>
          <h1>Store settings</h1>
          <p className="muted">Delivery charges, the announcement bar and the contact details in the footer.</p>
        </div>
      </header>
      <div className="form-columns">
        <section className="panel">
          <h2>Delivery charges</h2>
          <SettingsForm shippingFee={(data?.shipping_fee ?? 25000) / 100} threshold={(data?.free_shipping_threshold ?? 1500000) / 100} />
        </section>
        <section className="panel">
          <h2>Store details</h2>
          {error ? (
            <p className="form-error">Run the database update (0003_admin_upgrade.sql) in Supabase first.</p>
          ) : (
            <StoreForm initial={mergeStore(content?.value as Partial<StoreContent> | null)} />
          )}
        </section>
      </div>
    </>
  );
}
