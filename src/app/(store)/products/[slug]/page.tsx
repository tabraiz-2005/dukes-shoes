import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createCatalog } from "@/services/catalog";
import { getCatalogData } from "@/lib/catalog/source";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = createCatalog(await getCatalogData()).getProductBySlug(slug);
  return p ? { title: `${p.name}, ${p.style}`, description: p.description } : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const catalog = createCatalog(await getCatalogData());
  const p = catalog.getProductBySlug(slug);
  if (!p) notFound();
  const related = catalog.getRelatedProducts(p.id);
  return (
    <div className="detail-wrap">
      <ProductDetail key={p.id} product={p} />
      {related.length > 0 && (
        <section className="related" aria-labelledby="related-title">
          <div className="section-heading">
            <h2 id="related-title">You may also like</h2>
          </div>
          <div className="product-grid trim-4">
            {related.map((x) => (
              <ProductCard key={x.id} product={x} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
