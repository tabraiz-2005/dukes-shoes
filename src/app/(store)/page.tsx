import Link from "next/link";
import { Banknote, RefreshCcw, Truck } from "lucide-react";
import { createCatalog } from "@/services/catalog";
import { getCatalogData } from "@/lib/catalog/source";
import { Photo } from "@/components/ui";
import { ProductCard } from "@/components/product-card";

const SERVICES = [
  {
    icon: Truck,
    title: "Delivery across Pakistan",
    text: "Tracked courier to your door. Free on orders above Rs 15,000.",
  },
  {
    icon: RefreshCcw,
    title: "Easy exchanges",
    text: "A different size or colour, arranged on WhatsApp.",
  },
  {
    icon: Banknote,
    title: "Cash on delivery",
    text: "Pay the courier when your order arrives, anywhere in Pakistan.",
  },
];

export default async function Home() {
  const data = await getCatalogData();
  const { getProducts, getProductCount } = createCatalog(data);
  const home = data.content.home;
  const tiles = data.collections.filter((c) => c.showOnHome && c.image).slice(0, 2);
  const all = getProducts();
  const total = getProductCount();
  const fresh = all.filter((p) => p.isNew).slice(0, 4);
  const picks = all.filter((p) => p.featured).slice(0, 4);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media" data-count={Math.min(home.images.length, 3)}>
          {home.images.slice(0, 3).map((img, i) => (
            <div key={img.url + i} className="hero-frame">
              <Photo
                src={img.url}
                alt={img.alt}
                priority={i === 0}
                sizes={`(max-width: 800px) 100vw, ${Math.round(100 / Math.min(home.images.length, 3))}vw`}
              />
            </div>
          ))}
        </div>
        <div className="hero-overlay">
          {home.eyebrow && <p className="eyebrow">{home.eyebrow}</p>}
          <h1 id="hero-title">{home.title}</h1>
          <div className="hero-links">
            {home.primary.label && (
              <Link className="button" href={home.primary.href || "/shop"}>
                {home.primary.label}
              </Link>
            )}
            {home.secondary.label && (
              <Link className="button ghost" href={home.secondary.href || "/shop"}>
                {home.secondary.label}
              </Link>
            )}
            <Link className="text-link" href="/shop">
              The collection
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="all-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The collection</p>
            <h2 id="all-title">All pieces</h2>
          </div>
          <Link className="text-link" href="/shop">
            Shop all {total}
          </Link>
        </div>
        <div className="product-grid">
          {all.slice(0, 12).map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
        <div className="section-foot">
          <Link className="button outline-button" href="/shop">
            View all {total} pieces
          </Link>
        </div>
      </section>

      {fresh.length > 0 && (
        <section className="section" aria-labelledby="new-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Just in</p>
              <h2 id="new-title">New arrivals</h2>
            </div>
            <Link className="text-link" href="/shop?sort=newest">
              View all
            </Link>
          </div>
          <div className="product-grid">
            {fresh.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {tiles.length > 0 && (
        <section className={`edits edits-${tiles.length}`} aria-label="Collections">
          {tiles.map((c) => (
            <Link key={c.id} href={`/collections/${c.slug}`} className="edit-tile">
              <Photo src={c.image!} alt="" sizes="(max-width: 800px) 100vw, 50vw" />
              <span className="edit-copy">
                <span className="edit-title">{c.title}</span>
                {c.description && <span>{c.description}</span>}
                <span className="text-link">Explore</span>
              </span>
            </Link>
          ))}
        </section>
      )}

      {picks.length > 0 && (
        <section className="section" aria-labelledby="picks-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Our picks</p>
              <h2 id="picks-title">The essentials</h2>
            </div>
            <Link className="text-link" href="/shop">
              Full catalogue
            </Link>
          </div>
          <div className="product-grid">
            {picks.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="services" aria-label="Services">
        {SERVICES.map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <Icon size={22} strokeWidth={1.3} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </section>
    </>
  );
}
