import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createCatalog } from "@/services/catalog";
import { getCatalogData } from "@/lib/catalog/source";
import { ProductCard } from "@/components/product-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = createCatalog(await getCatalogData()).getCollection((await params).slug);
  return c ? { title: c.title, description: c.description } : {};
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const catalog = createCatalog(await getCatalogData());
  const collection = catalog.getCollection(slug);
  if (!collection) notFound();
  const products = catalog.getCollectionProducts(slug);
  return (
    <div className="shop">
      <header className="shop-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{collection.title}</span>
        </nav>
        <h1>{collection.title}</h1>
        {collection.description && <p>{collection.description}</p>}
      </header>
      {products.length ? (
        <div className="product-grid shop-grid">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>This collection is being prepared.</h2>
          <p>Browse the full collection in the meantime.</p>
          <Link className="button" href="/shop">
            Shop all pieces
          </Link>
        </div>
      )}
    </div>
  );
}
