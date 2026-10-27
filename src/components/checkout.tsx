"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { checkDiscount, placeOrder } from "@/app/(store)/checkout/actions";
import { getImages } from "@/services/catalog";
import { money } from "@/lib/format";
import { useStore } from "./store-provider";
import { useCatalog } from "./catalog-provider";
import { Empty, Totals } from "./cart";
import { Photo } from "./ui";

const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Abbottabad",
];

function Field({
  name,
  label,
  error,
  optional,
  ...props
}: {
  name: string;
  label: string;
  error?: string;
  optional?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={error ? "field has-error" : "field"}>
      <span>
        {label}
        {optional && <em> (optional)</em>}
      </span>
      <input
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      {error && (
        <small id={`${name}-error`} className="field-error">
          {error}
        </small>
      )}
    </label>
  );
}

export function Checkout() {
  const s = useStore();
  const { data, getVariant } = useCatalog();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const live = data.source === "supabase";
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [codeMsg, setCodeMsg] = useState("");
  const [checking, startCheck] = useTransition();

  // A discount was calculated for a specific subtotal: drop it if the bag changes.
  const [discountFor, setDiscountFor] = useState(0);
  if (discount && discountFor !== s.subtotal) {
    setDiscount(null);
    setCodeMsg("Your bag changed. Apply the code again.");
  }

  function applyCode() {
    if (!code.trim()) return;
    startCheck(async () => {
      const r = await checkDiscount(code, s.subtotal);
      if (r.valid) {
        setDiscount({ code: r.code, amount: r.amount });
        setDiscountFor(s.subtotal);
        setCodeMsg("");
      } else {
        setDiscount(null);
        setCodeMsg(r.message);
      }
    });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "");
    const input = {
      customer: {
        name: get("name"),
        phone: get("phone"),
        email: get("email"),
        address: get("address"),
        city: get("city"),
        postal_code: get("postal_code"),
        notes: get("notes"),
        discount_code: discount?.code ?? "",
      },
      items: s.cart.map((i) => ({
        variant_id: i.variantId,
        quantity: i.quantity,
      })),
    };
    setError("");
    setFields({});
    start(async () => {
      const result = await placeOrder(input);
      if (result.ok) {
        s.clear();
        router.push(`/order/${result.orderId}`);
        return;
      }
      setError(result.message);
      setFields(result.fields ?? {});
      if (result.message.includes("discount code")) setDiscount(null);
      if (result.variantId) {
        s.remove(result.variantId);
        router.refresh();
      }
    });
  }

  if (!s.hydrated)
    return (
      <section className="section page" aria-busy="true">
        Loading your bag…
      </section>
    );

  return (
    <section className="section page">
      {!live && (
        <div className="demo-banner">
          Checkout demo — no orders are placed and no payments are processed.
          Connect Supabase to start taking orders.
        </div>
      )}
      <div className="page-heading">
        <h1>Checkout</h1>
      </div>
      {!s.cart.length ? (
        <Empty
          title="Your bag is empty."
          text="Add a piece to your bag to check out."
        />
      ) : (
        <div className="cart-layout">
          <form className="checkout-fields" onSubmit={submit} noValidate>
            <fieldset disabled={!live || pending}>
              <h2>Contact</h2>
              <Field
                name="name"
                label="Full name"
                autoComplete="name"
                required
                error={fields.name}
              />
              <div className="field-row">
                <Field
                  name="phone"
                  label="Phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0300 1234567"
                  required
                  error={fields.phone}
                />
                <Field
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  optional
                  error={fields.email}
                />
              </div>
              <h2>Delivery address</h2>
              <Field
                name="address"
                label="Address"
                autoComplete="street-address"
                placeholder="House, street, area"
                required
                error={fields.address}
              />
              <div className="field-row">
                <Field
                  name="city"
                  label="City"
                  autoComplete="address-level2"
                  list="pk-cities"
                  required
                  error={fields.city}
                />
                <Field
                  name="postal_code"
                  label="Postal code"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  optional
                  error={fields.postal_code}
                />
              </div>
              <datalist id="pk-cities">
                {CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <label className="field">
                <span>
                  Order notes<em> (optional)</em>
                </span>
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={500}
                  placeholder="Landmark, preferred delivery time"
                />
              </label>
              <h2>Payment</h2>
              <div className="payment-option" role="radiogroup" aria-label="Payment">
                <label>
                  <input type="radio" name="payment" value="cod" defaultChecked />
                  <span>
                    <strong>Cash on delivery</strong>
                    <small>Pay the courier in cash when your order arrives.</small>
                  </span>
                </label>
              </div>
            </fieldset>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button wide"
              type="submit"
              disabled={!live || pending}
            >
              {!live
                ? "Demo — order submission unavailable"
                : pending
                  ? "Placing order…"
                  : "Place order"}
            </button>
            <p className="small">
              We will call to confirm your order before dispatch.
            </p>
            <Link className="text-link" href="/cart">
              Back to bag
            </Link>
          </form>
          <aside className="order-summary">
            <h2>Order summary</h2>
            {s.cart.map((i) => {
              const found = getVariant(i.variantId);
              if (!found) return null;
              const { product: p, variant: v } = found;
              const img = getImages(p, v.color.name)[0];
              return (
                <div className="checkout-line" key={v.id}>
                  <span className="checkout-thumb">
                    <Photo src={img.src} alt="" sizes="64px" />
                    <b>{i.quantity}</b>
                  </span>
                  <span className="checkout-name">
                    {p.name}
                    <small>
                      {v.color.name}
                      {v.sizeSystem === "ONE_SIZE" ? "" : `, size ${v.size}`}
                    </small>
                  </span>
                  <strong>{money(v.price * i.quantity)}</strong>
                </div>
              );
            })}
            {live && (
              <div className="discount-box">
                <label htmlFor="discount-code">Discount code</label>
                <div>
                  <input
                    id="discount-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCode();
                      }
                    }}
                    placeholder="Enter code"
                    autoComplete="off"
                    disabled={Boolean(discount)}
                  />
                  {discount ? (
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => {
                        setDiscount(null);
                        setCode("");
                      }}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button"
                      onClick={applyCode}
                      disabled={checking || !code.trim()}
                    >
                      {checking ? "Checking…" : "Apply"}
                    </button>
                  )}
                </div>
                {codeMsg && <p className="field-error">{codeMsg}</p>}
              </div>
            )}
            <Totals discount={discount} />
          </aside>
        </div>
      )}
    </section>
  );
}
