import type { Metadata } from "next";
import { getMemberWith } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";
import { getAdminCategories } from "@/lib/admin/queries";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProduct() {
  const admin = await getMemberWith("admin");
  if (!admin) return <AdminOnly />;
  return <ProductForm categories={await getAdminCategories(admin.supabase)} product={null} />;
}
