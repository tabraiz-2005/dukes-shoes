import Link from "next/link";
import { Banknote, RefreshCcw, Truck } from "lucide-react";
import { createCatalog } from "@/services/catalog";
import { getCatalogData } from "@/lib/catalog/source";
import { Photo } from "@/components/ui";
import { ProductCard } from "@/components/product-card";

const HERO = [
  {
    src: "/images/dukes/croc-chain-loafer.jpg",
    alt: "Black pebble-grain loafers with navy croc-embossed vamps and a gold chain",
  },
  {
    src: "/images/dukes/horsebit-noir.jpg",
    alt: "Polished black horsebit loafers on red velvet",
  },
  {
    src: "/images/dukes/pebble-loafer.jpg",
    alt: "Black pebble-grain loafers with cedar shoe trees",
  },
];

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
  const { getProducts, getProductCount } = createCatalog(await getCatalogData());
  const all = getProducts();
  const total = getProductCount();
  const fresh = all.filter((p) => p.isNew).slice(0, 4);
  const picks = all.filter((p) => p.featured).slice(0, 4);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media">
          {HERO.map((img, i) => (
            <div key={img.src} className="hero-frame">
              <Photo
                src={img.src}
                alt={img.alt}
                priority={i === 0}
                sizes="(max-width: 800px) 100vw, 34vw"
              />
            </div>
          ))}
        </div>
        <div className="hero-overlay">
          <p className="eyebrow">Autumn / Winter 2026</p>
          <h1 id="hero-title">The Dress Shoe Edit</h1>
          <div className="hero-links">
            <Link className="button" href="/shop?category=dress-shoes">
              Dress shoes
            </Link>
            <Link className="button ghost" href="/shop?category=chappal">
              Chappal
            </Link>
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

      <section className="edits" aria-label="Collections">
        <Link href="/shop?category=dress-shoes&type=loafers" className="edit-tile">
          <Photo
            src="/images/dukes/horsebit-cognac.jpg"
            alt=""
            sizes="(max-width: 800px) 100vw, 50vw"
          />
          <span className="edit-copy">
            <span className="edit-title">The loafer edit</span>
            <span>Horsebit, chain and penny loafers in polished leather.</span>
            <span className="text-link">Explore</span>
          </span>
        </Link>
        <Link href="/shop?category=dress-shoes&type=derbies" className="edit-tile">
          <Photo
            src="/images/dukes/captoe-derby.jpg"
            alt=""
            sizes="(max-width: 800px) 100vw, 50vw"
          />
          <span className="edit-copy">
            <span className="edit-title">The cap-toe Derby</span>
            <span>Perforated toe cap, contrast welt, made to be resoled.</span>
            <span className="text-link">Explore</span>
          </span>
        </Link>
      </section>

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
