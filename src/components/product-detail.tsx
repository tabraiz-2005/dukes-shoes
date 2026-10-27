"use client";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import type { Product } from "@/types";
import { store } from "@/config/store";
import { money } from "@/lib/format";
import { getImages } from "@/services/catalog";
import { useCatalog } from "./catalog-provider";
import { Photo, Modal, Quantity } from "./ui";
import { useStore } from "./store-provider";
import { priceLabel } from "./product-card";

export function ProductDetail({ product: p }: { product: Product }) {
  const s = useStore();
  const colors = [
    ...new Map(p.variants.map((v) => [v.color.name, v.color])).values(),
  ];
  const firstAvailable =
    colors.find((c) =>
      p.variants.some((v) => v.color.name === c.name && v.stock > 0),
    ) ?? colors[0];
  const sizes = [...new Set(p.variants.map((v) => v.size))];
  const oneSize = p.variants[0].sizeSystem === "ONE_SIZE";
  const [color, setColor] = useState(firstAvailable.name),
    [size, setSize] = useState<string | null>(oneSize ? sizes[0] : null),
    [qty, setQty] = useState(1),
    [image, setImage] = useState(0),
    [guide, setGuide] = useState(false),
    [message, setMessage] = useState("");
  const variant = p.variants.find(
    (v) => v.color.name === color && v.size === size,
  );
  const colourSoldOut = !p.variants.some(
    (v) => v.color.name === color && v.stock > 0,
  );
  const images = getImages(p, color);
  const category = useCatalog().getCategory(p.categoryId);
  const sub = category?.subcategories.find((x) => x.slug === p.subcategory);
  const saved = s.hydrated && s.wishlist.includes(p.id);
  const system = p.variants[0].sizeSystem;
  const unavailableReason = colourSoldOut
    ? `${color} is sold out. Choose another colour.`
    : !variant
      ? "Select a size to add this to your bag."
      : variant.stock < 1
        ? "This size is sold out."
        : variant.stock <= 3
          ? `Only ${variant.stock} left in this size.`
          : "In stock. Dispatched from the atelier.";
  const details = [
    ["Leather", p.leather],
    ["Construction", p.construction],
    ["Lining", p.lining],
    ["Sole", p.sole],
  ].filter(([, v]) => v !== "Not applicable");

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/shop?category=${p.categoryId}`}>{category?.name}</Link>
        {sub && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/shop?category=${p.categoryId}&type=${sub.slug}`}>
              {sub.name}
            </Link>
          </>
        )}
      </nav>
      <section className="product-detail">
        <div className="gallery">
          <div className="main-product-photo">
            <Photo
              key={images[image]?.src}
              src={images[image]?.src ?? images[0].src}
              alt={images[image]?.alt ?? images[0].alt}
              priority
              sizes="(max-width: 900px) 100vw, 58vw"
            />
          </div>
          <div className="thumbnails">
            {images.map((img, i) => (
              <button
                key={img.src}
                className={image === i ? "selected" : ""}
                onClick={() => setImage(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-pressed={image === i}
              >
                <Photo src={img.src} alt="" sizes="96px" />
              </button>
            ))}
          </div>
          {!images[0].src.startsWith("/images/dukes/") && (
            <p className="small">
              Demo imagery. Final photography of each DUKES piece will replace
              it.
            </p>
          )}
        </div>

        <div className="product-copy">
          <p className="product-kicker">{sub?.name ?? category?.name}</p>
          <h1>{p.name}</h1>
          <p className="product-style">{p.style}</p>
          <p className="detail-price">
            {variant ? money(variant.price) : priceLabel(p)}
          </p>

          <fieldset>
            <legend>
              Colour <span>{color}</span>
            </legend>
            <div className="colour-options">
              {colors.map((c) => {
                const out = !p.variants.some(
                  (v) => v.color.name === c.name && v.stock > 0,
                );
                return (
                  <button
                    key={c.name}
                    className={color === c.name ? "selected" : ""}
                    aria-pressed={color === c.name}
                    aria-label={`${c.name}${out ? ", sold out" : ""}`}
                    onClick={() => {
                      setColor(c.name);
                      setSize(oneSize ? sizes[0] : null);
                      setQty(1);
                      setImage(0);
                      setMessage("");
                    }}
                  >
                    <span
                      className={out ? "dot out" : "dot"}
                      style={{ background: c.hex }}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </fieldset>

          {!oneSize && (
            <fieldset>
              <legend>
                Size <span>{store.sizeSystemLabel[system]}</span>
              </legend>
              <button className="size-guide" onClick={() => setGuide(true)}>
                Size guide
              </button>
              <div className="size-options">
                {sizes.map((n) => {
                  const v = p.variants.find(
                    (v) => v.size === n && v.color.name === color,
                  );
                  const out = !v || v.stock < 1;
                  return (
                    <button
                      key={n}
                      disabled={out}
                      className={size === n ? "selected" : ""}
                      aria-label={`${n}${out ? ", sold out" : ""}`}
                      aria-pressed={size === n}
                      onClick={() => {
                        setSize(n);
                        setQty(1);
                        setMessage("");
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <p className="stock-message">{unavailableReason}</p>
          <div className="add-row">
            <Quantity
              value={qty}
              max={variant?.stock || 1}
              onChange={setQty}
            />
            <button
              className="button add-button"
              disabled={!s.hydrated || !variant || variant.stock < 1}
              onClick={() => {
                if (variant) {
                  s.add(variant.id, qty);
                  setMessage(`${p.name} in ${color.toLowerCase()} is in your bag.`);
                }
              }}
            >
              Add to bag
            </button>
            <button
              className="icon-button outline"
              aria-label={`${saved ? "Remove from" : "Add to"} wishlist`}
              aria-pressed={saved}
              disabled={!s.hydrated}
              onClick={() => s.toggle(p.id)}
            >
              <Heart
                size={19}
                strokeWidth={1.4}
                fill={saved ? "currentColor" : "none"}
              />
            </button>
          </div>
          <div className="confirmation" role="status">
            {message && (
              <>
                {message} <Link href="/cart">View bag</Link>
              </>
            )}
          </div>

          <div className="accordions">
            <details open>
              <summary>Description</summary>
              <p>{p.description}</p>
            </details>
            <details>
              <summary>Materials and making</summary>
              <dl className="spec-list">
                {details.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="small">Sample specification, to be confirmed.</p>
            </details>
            <details>
              <summary>Care</summary>
              <p>{p.care}</p>
            </details>
            <details>
              <summary>Delivery and exchanges</summary>
              <p>
                Delivery regions, charges, timelines and exchange terms are not
                yet confirmed.
              </p>
              <p className="small">{store.approvalLabel}</p>
            </details>
          </div>
        </div>
      </section>

      <Modal open={guide} onClose={() => setGuide(false)} title="Size guide">
        <p className="small">{store.approvalLabel}</p>
        {system === "WAIST_IN" ? (
          <>
            <p>
              Belts are sized by waist in inches. As a starting point, choose
              the size two inches above your trouser waist size.
            </p>
            <p>
              Available: {sizes.join(", ")}. Measurements must be verified
              against the finished belts before launch.
            </p>
          </>
        ) : (
          <>
            <table className="size-table">
              <caption className="sr-only">Sample size conversion</caption>
              <thead>
                <tr>
                  <th scope="col">EU</th>
                  <th scope="col">UK</th>
                  <th scope="col">US</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((n) => (
                  <tr key={n}>
                    <td>{n}</td>
                    <td>{Number(n) - 33}</td>
                    <td>{Number(n) - 32}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              Conversions are indicative only and must be checked against the
              DUKES lasts before launch. No fit guarantee is offered.
            </p>
          </>
        )}
      </Modal>
    </>
  );
}
