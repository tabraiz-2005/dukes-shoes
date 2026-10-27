import type { Metadata } from "next";
import { getAdmin } from "@/lib/admin/auth";
import { getAdminCategories } from "@/lib/admin/queries";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProduct() {
  const admin = await getAdmin();
  if (!admin?.isAdmin) return null;
  return <ProductForm categories={await getAdminCategories(admin.supabase)} product={null} />;
}
