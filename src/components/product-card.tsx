"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/types";
import { money } from "@/lib/format";
import { getImages } from "@/services/catalog";
import { Photo } from "./ui";
import { useStore } from "./store-provider";

export function priceLabel(p: Product) {
  const prices = p.variants.map((v) => v.price);
  const min = Math.min(...prices);
  return `${min !== Math.max(...prices) ? "From " : ""}${money(min)}`;
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
  return (
    <article className="product-card">
      <div className="product-image">
        <Link href={`/products/${p.slug}`} aria-label={`View ${p.name}`}>
          <Photo src={first.src} alt={first.alt} priority={priority} />
          {second && (
            <Photo src={second.src} alt="" className="card-alt" />
          )}
        </Link>
        {(p.isNew || soldOut) && (
          <span className="tag">{soldOut ? "Sold out" : "New"}</span>
        )}
        <button
          className={`save icon-button ${saved ? "saved" : ""}`}
          aria-label={`${saved ? "Remove" : "Save"} ${p.name} ${saved ? "from" : "to"} wishlist`}
          aria-pressed={saved}
          disabled={!s.hydrated}
          onClick={() => s.toggle(p.id)}
        >
          <Heart
            size={18}
            strokeWidth={1.4}
            fill={saved ? "currentColor" : "none"}
          />
        </button>
      </div>
      <div className="card-info">
        <h3>
          <Link href={`/products/${p.slug}`}>{p.name}</Link>
        </h3>
        <p className="card-style">{p.style}</p>
        <p className="card-price">{priceLabel(p)}</p>
        <div className="card-colours">
          <span className="swatches" aria-hidden="true">
            {colors.map((c) => (
              <span key={c.name} style={{ background: c.hex }} />
            ))}
          </span>
          <span>
            {colors.length} {colors.length === 1 ? "colour" : "colours"}
            <span className="sr-only">: {colors.map((c) => c.name).join(", ")}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
