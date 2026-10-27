import Image from "next/image";
import Link from "next/link";
import { store } from "@/config/store";
import { createCatalog } from "@/services/catalog";
import { getCatalogData } from "@/lib/catalog/source";
import { Photo } from "@/components/ui";
import { ProductCard } from "@/components/product-card";

const making = [
  {
    title: "Cutting",
    text: "Each panel is cut by hand from a single hide, avoiding scars and stretch marks so both shoes of a pair match.",
  },
  {
    title: "Closing",
    text: "The upper is stitched together and the broguing punched, then skived so seams lie flat against the foot.",
  },
  {
    title: "Lasting",
    text: "The upper is pulled over a wooden last and left to rest, so it keeps the shape of the foot it was made for.",
  },
  {
    title: "Finishing",
    text: "Soles are stitched, edges set with a hot iron, and the colour built up by hand in layers of cream and wax.",
  },
];

export default async function Home() {
  const { getProducts, getCategories, getProductCount } = createCatalog(
    await getCatalogData(),
  );
  const all = getProducts();
  const total = getProductCount();
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <Image
            src="/brand/lion.png"
            alt=""
            width={300}
            height={410}
            className="hero-mark"
            priority
          />
          <h1 id="hero-title">
            Made by hand,
            <br />
            made to last.
          </h1>
          <p>
            Designer dress shoes, chappal and leather goods, cut and stitched
            by hand in pure leather.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/shop">
              Shop the collection
            </Link>
            <Link className="text-link" href="/shop?category=dress-shoes">
              Dress shoes
            </Link>
          </div>
        </div>
        <div className="hero-media">
          <Photo
            src="/images/dukes/croc-chain-loafer.jpg"
            alt="DUKES black leather loafers with croc-embossed navy vamps and gold chain detail"
            priority
            sizes="(max-width: 1000px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="section categories" aria-labelledby="cat-title">
        <div className="section-heading">
          <h2 id="cat-title">Shop by category</h2>
        </div>
        <div className="category-rail">
          {getCategories().map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="category-tile"
            >
              <span className="category-photo">
                <Photo src={c.image} alt="" sizes="(max-width: 800px) 60vw, 20vw" />
              </span>
              <span className="category-name">{c.name}</span>
              <span className="category-count">
                {getProducts({ category: c.id }).length} pieces
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="all-title">
        <div className="section-heading">
          <h2 id="all-title">The collection</h2>
          <Link className="text-link" href="/shop">
            Shop all {total}
          </Link>
        </div>
        <div className="product-grid home-grid-trim">
          {all.slice(0, 8).map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
        <div className="section-foot">
          <Link className="button outline-button" href="/shop">
            View all {total} pieces
          </Link>
        </div>
      </section>

      <section className="edits" aria-label="Featured collections">
        <Link
          href="/shop?category=dress-shoes&type=loafers"
          className="edit-tile"
        >
          <span className="edit-photo">
            <Photo
              src="/images/dukes/horsebit-noir.jpg"
              alt=""
              sizes="(max-width: 800px) 100vw, 50vw"
            />
          </span>
          <span className="edit-copy">
            <span className="edit-title">The loafer edit</span>
            <span>
              Horsebit, chain and penny loafers in polished and pebble-grain
              leather.
            </span>
            <span className="text-link">Shop loafers</span>
          </span>
        </Link>
        <Link href="/shop?category=chappal" className="edit-tile">
          <span className="edit-photo">
            <Photo
              src="/images/products/chappal-peshawari-cognac.svg"
              alt=""
              sizes="(max-width: 800px) 100vw, 50vw"
            />
          </span>
          <span className="edit-copy">
            <span className="edit-title">The Peshawari, made properly</span>
            <span>
              Double-flap toes, hand stitching and stacked leather soles.
            </span>
            <span className="text-link">Explore chappal</span>
          </span>
        </Link>
      </section>

      <section className="section" aria-labelledby="new-title">
        <div className="section-heading">
          <h2 id="new-title">New arrivals</h2>
          <Link className="text-link" href="/shop?sort=newest">
            View all
          </Link>
        </div>
        <div className="product-grid trim-4">
          {all
            .filter((p) => p.isNew)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>

      <section className="making" aria-labelledby="making-title">
        <div className="making-intro">
          <h2 id="making-title">
            One pair, many hands, no shortcuts.
          </h2>
          <p>
            Every DUKES piece is made in pure leather. Nothing is glued that
            could be stitched.
          </p>
          <Link className="text-link light" href="/shop?category=dress-shoes">
            Shop dress shoes
          </Link>
        </div>
        <ol className="making-steps">
          {making.map((m) => (
            <li key={m.title}>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="picks-title">
        <div className="section-heading">
          <h2 id="picks-title">Our picks</h2>
          <Link className="text-link" href="/shop">
            Full catalogue
          </Link>
        </div>
        <div className="product-grid trim-4">
          {all
            .filter((p) => p.featured)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>

      <section className="services" aria-label="Services">
        {store.services.map((s) => (
          <div key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
        <p className="approval services-note">{store.approvalLabel}</p>
      </section>
    </>
  );
}
