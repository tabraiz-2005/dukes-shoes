"use client";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { useStore } from "./store-provider";
import { useCatalog } from "./catalog-provider";
import { getImages, shippingFor } from "@/services/catalog";
import { money } from "@/lib/format";
import { Photo, Quantity } from "./ui";
import { ProductCard } from "./product-card";

export function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <ShoppingBag size={30} strokeWidth={1.2} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="button" href="/shop">
        Explore the collection
      </Link>
    </div>
  );
}

/** Subtotal, delivery and total lines shared by the bag and checkout. */
export function Totals() {
  const s = useStore();
  const { data } = useCatalog();
  const shipping = shippingFor(data, s.subtotal);
  const remaining = data.settings.freeShippingThreshold - s.subtotal;
  return (
    <>
      <div className="summary-line">
        <span>Subtotal</span>
        <strong>{money(s.subtotal)}</strong>
      </div>
      <div className="summary-line minor">
        <span>Delivery</span>
        <span>{shipping ? money(shipping) : "Free"}</span>
      </div>
      {remaining > 0 && (
        <p className="free-note">
          Add {money(remaining)} more for free delivery.
        </p>
      )}
      <div className="summary-line total">
        <span>Total</span>
        <strong>{money(s.subtotal + shipping)}</strong>
      </div>
    </>
  );
}

export function Cart() {
  const s = useStore();
  const { getVariant } = useCatalog();
  if (!s.hydrated)
    return (
      <div className="section page" aria-busy="true">
        Loading your bag…
      </div>
    );
  return (
    <section className="section page">
      <div className="page-heading">
        <h1>Shopping bag</h1>
        <p>
          {s.count} {s.count === 1 ? "piece" : "pieces"}
        </p>
      </div>
      {!s.cart.length ? (
        <Empty
          title="Your bag is empty."
          text="Dress shoes, chappal, belts and wallets, all made by hand in leather."
        />
      ) : (
        <div className="cart-layout">
          <div>
            {s.cart.map((item) => {
              const found = getVariant(item.variantId);
              if (!found) return null;
              const { product: p, variant: v } = found;
              const img = getImages(p, v.color.name)[0];
              return (
                <article className="cart-item" key={v.id}>
                  <Link href={`/products/${p.slug}`} className="cart-photo">
                    <Photo src={img.src} alt={img.alt} sizes="140px" />
                  </Link>
                  <div className="cart-item-info">
                    <Link href={`/products/${p.slug}`}>
                      <h2>{p.name}</h2>
                    </Link>
                    <p>
                      {v.color.name}
                      {v.sizeSystem === "ONE_SIZE" ? "" : `, size ${v.size}`}
                    </p>
                    <p>{money(v.price)} each</p>
                    <Quantity
                      value={item.quantity}
                      max={Math.min(v.stock, 10)}
                      onChange={(n) => s.quantity(v.id, n)}
                    />
                  </div>
                  <div className="cart-item-end">
                    <strong>{money(v.price * item.quantity)}</strong>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${p.name} from bag`}
                      onClick={() => s.remove(v.id)}
                    >
                      <X size={18} strokeWidth={1.4} />
                    </button>
                  </div>
                </article>
              );
            })}
            <Link className="text-link" href="/shop">
              Continue shopping
            </Link>
          </div>
          <aside className="order-summary">
            <h2>Order summary</h2>
            <Totals />
            <Link className="button wide" href="/checkout">
              Checkout
            </Link>
            <p className="small">
              Cash on delivery across Pakistan. Pay when your order arrives.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}

export function Wishlist() {
  const s = useStore();
  const { getProductById } = useCatalog();
  return (
    <section className="section page">
      <div className="page-heading">
        <h1>Wishlist</h1>
        <p>Pieces you have saved, kept on this device.</p>
      </div>
      {!s.hydrated ? (
        <p>Loading your wishlist…</p>
      ) : s.wishlist.length ? (
        <div className="product-grid">
          {s.wishlist.map((id) => {
            const p = getProductById(id);
            return p ? <ProductCard key={id} product={p} /> : null;
          })}
        </div>
      ) : (
        <Empty
          title="Nothing saved yet."
          text="Select the heart on any piece to keep it here."
        />
      )}
    </section>
  );
}
