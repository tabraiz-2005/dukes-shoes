"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/types";
import { money } from "@/lib/format";
import { getImages, priceInfo } from "@/services/catalog";
import { Photo } from "./ui";
import { useStore } from "./store-provider";

/** Price text for a product, e.g. "From Rs 12,500". */
export function priceLabel(p: Product) {
  const { price, varies } = priceInfo(p);
  return `${varies ? "From " : ""}${money(price)}`;
}

/** Current price with the original price struck through when on sale. */
export function PriceLine({ product }: { product: Product }) {
  const { price, compare, varies, percentOff } = priceInfo(product);
  return (
    <p className={compare ? "price-line on-sale" : "price-line"}>
      <span className="price-now">
        {varies ? "From " : ""}
        {money(price)}
      </span>
      {compare && (
        <>
          <s className="price-was">
            <span className="sr-only">Was </span>
            {money(compare)}
          </s>
          <span className="price-off">−{percentOff}%</span>
        </>
      )}
    </p>
  );
}

export function ProductCard({
  product: p,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const s = useStore();
  const saved = s.hydrated && s.wishlist.includes(p.id);
  const colors = [
    ...new Map(p.variants.map((v) => [v.color.name, v.color])).values(),
  ];
  const [first, second] = getImages(p);
  const soldOut = p.variants.every((v) => v.stock < 1);
  const { compare } = priceInfo(p);
  const tag = soldOut ? "Sold out" : compare ? "Sale" : p.isNew ? "New" : null;

  return (
    <article className="product-card">
      <div className="product-image">
        <Link href={`/products/${p.slug}`} aria-label={`View ${p.name}`}>
          <Photo
            src={first.src}
            alt={first.alt}
            priority={priority}
            sizes="(max-width: 800px) 50vw, 25vw"
          />
          {second && (
            <Photo
              src={second.src}
              alt=""
              className="card-alt"
              sizes="(max-width: 800px) 50vw, 25vw"
            />
          )}
        </Link>
        {tag && (
          <span className={`tag tag-${tag.toLowerCase().replace(" ", "-")}`}>
            {tag}
          </span>
        )}
        <button
          className={`save icon-button ${saved ? "saved" : ""}`}
          aria-label={`${saved ? "Remove" : "Save"} ${p.name} ${saved ? "from" : "to"} wishlist`}
          aria-pressed={saved}
          disabled={!s.hydrated}
          onClick={() => s.toggle(p.id)}
        >
          <Heart size={17} strokeWidth={1.4} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="card-info">
        <h3>
          <Link href={`/products/${p.slug}`}>{p.name}</Link>
        </h3>
        <PriceLine product={p} />
        {colors.length > 1 && (
          <p className="card-colours">
            <span className="swatches" aria-hidden="true">
              {colors.map((c) => (
                <span key={c.name} style={{ background: c.hex }} />
              ))}
            </span>
            {colors.length} colours
            <span className="sr-only">: {colors.map((c) => c.name).join(", ")}</span>
          </p>
        )}
      </div>
    </article>
  );
}
