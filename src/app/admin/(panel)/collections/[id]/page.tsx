import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMemberWith } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";
import { CollectionForm, type CollectionRecord, type PickProduct } from "@/components/admin/collection-form";

export const metadata: Metadata = { title: "Collection" };

export default async function CollectionPage({
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
  const db = admin.supabase;
  const { data: prods } = await db
    .from("products")
    .select("id, name, status, category_id, product_images(url, sort)")
    .neq("status", "archived")
    .order("name");
  const products: PickProduct[] = (prods ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    category: p.category_id,
    image: (p.product_images as { url: string; sort: number }[]).toSorted((a, b) => a.sort - b.sort)[0]?.url ?? null,
  }));
  let collection: CollectionRecord | null = null;
  if (id !== "new") {
    const { data } = await db
      .from("collections")
      .select("id, slug, title, description, image, status, show_on_home, sort, collection_products(product_id, sort)")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    const { collection_products, ...rest } = data;
    collection = {
      ...rest,
      status: rest.status as "active" | "draft",
      product_ids: (collection_products as { product_id: string; sort: number }[])
        .toSorted((a, b) => a.sort - b.sort)
        .map((x) => x.product_id),
    };
  }
  return (
    <>
      <header className="admin-head">
        <div>
          <Link href="/admin/collections" className="back-link">Collections</Link>
          <h1>{collection ? collection.title : "New collection"}</h1>
        </div>
        {collection?.status === "active" && (
          <a className="button outline-button" href={`/collections/${collection.slug}`} target="_blank" rel="noreferrer">View</a>
        )}
      </header>
      <CollectionForm collection={collection} products={products} notice={created ? "Collection created." : undefined} />
    </>
  );
}
