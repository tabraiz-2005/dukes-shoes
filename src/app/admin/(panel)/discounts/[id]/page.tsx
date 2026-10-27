import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMemberWith } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";
import { DiscountForm, type DiscountRecord } from "@/components/admin/discount-form";

export const metadata: Metadata = { title: "Discount" };

export default async function DiscountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const admin = await getMemberWith("admin");
  if (!admin) return <AdminOnly />;
  const { id } = await params;
  const { created } = await searchParams;
  let discount: DiscountRecord | null = null;
  if (id !== "new") {
    const { data } = await admin.supabase.from("discounts").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    discount = data as DiscountRecord;
  }
  return (
    <>
      <header className="admin-head">
        <div>
          <Link href="/admin/discounts" className="back-link">Discounts</Link>
          <h1>{discount ? discount.code : "New discount code"}</h1>
          {discount && <p className="muted">Used {discount.used_count} {discount.used_count === 1 ? "time" : "times"}.</p>}
        </div>
      </header>
      <DiscountForm discount={discount} notice={created ? "Discount created. Customers can use it now." : undefined} />
    </>
  );
}
