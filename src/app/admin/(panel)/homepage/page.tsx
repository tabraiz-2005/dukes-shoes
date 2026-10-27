import type { Metadata } from "next";
import { getMemberWith } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";
import { HomeForm } from "@/components/admin/home-form";
import { mergeHome } from "@/config/content";
import type { HomeContent } from "@/types";

export const metadata: Metadata = { title: "Homepage" };

export default async function Homepage() {
  const admin = await getMemberWith("admin");
  if (!admin) return <AdminOnly />;
  const { data, error } = await admin.supabase.from("site_content").select("value").eq("key", "home").maybeSingle();
  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Storefront</p>
          <h1>Homepage</h1>
          <p className="muted">The large photos and headline customers see first. Changes go live as soon as you save.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="button outline-button">View homepage</a>
      </header>
      {error ? (
        <div className="panel">
          <p className="form-error">Run the database update (0003_admin_upgrade.sql) in Supabase first, then reload this page.</p>
        </div>
      ) : (
        <HomeForm initial={mergeHome(data?.value as Partial<HomeContent> | null)} />
      )}
    </>
  );
}
