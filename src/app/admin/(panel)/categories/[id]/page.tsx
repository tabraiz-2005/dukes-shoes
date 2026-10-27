import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMemberWith } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";
import { CategoryForm, type CategoryRecord } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "Category" };

export default async function CategoryPage({
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
  let category: CategoryRecord | null = null;
  if (id !== "new") {
    const { data } = await admin.supabase
      .from("categories")
      .select("id, name, description, image, sort, subcategories(slug, name, sort)")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    category = {
      ...data,
      subcategories: ((data.subcategories as { slug: string; name: string; sort: number }[]) ?? [])
        .toSorted((a, b) => a.sort - b.sort)
        .map(({ slug, name }) => ({ slug, name })),
    };
  }
  return (
    <>
      <header className="admin-head">
        <div>
          <Link href="/admin/categories" className="back-link">Categories</Link>
          <h1>{category ? category.name : "New category"}</h1>
        </div>
      </header>
      <CategoryForm category={category} notice={created ? "Category created." : undefined} />
    </>
  );
}
