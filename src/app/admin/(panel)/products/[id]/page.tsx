import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMemberWith } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";
import { getAdminCategories, getAdminProduct } from "@/lib/admin/queries";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const admin = await getMemberWith("admin");
  if (!admin) return <AdminOnly />;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [categories, product] = await Promise.all([
    getAdminCategories(admin.supabase),
    getAdminProduct(admin.supabase, id),
  ]);
  if (!product) notFound();
  const { created } = await searchParams;
  return (
    <ProductForm
      key={product.id}
      categories={categories}
      product={product}
      notice={created ? "Product saved." : undefined}
    />
  );
}
