import type { Metadata } from "next";
import { getAdmin } from "@/lib/admin/auth";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function Settings() {
  const admin = await getAdmin();
  if (!admin?.isAdmin) return null;
  const { data } = await admin.supabase.from("store_settings").select("shipping_fee, free_shipping_threshold").maybeSingle();
  return (
    <>
      <header className="admin-head"><h1>Settings</h1></header>
      <section className="panel narrow">
        <h2>Delivery charges</h2>
        <SettingsForm shippingFee={(data?.shipping_fee ?? 25000) / 100} threshold={(data?.free_shipping_threshold ?? 1500000) / 100} />
      </section>
    </>
  );
}
