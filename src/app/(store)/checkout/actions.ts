"use server";
import { updateTag } from "next/cache";
import { checkoutSchema } from "@/lib/orders/schema";
import { CATALOG_TAG, isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

export type CheckoutResult =
  | { ok: true; orderId: string; orderNumber: number }
  | {
      ok: false;
      message: string;
      fields?: Record<string, string>;
      /** Variant that is no longer available, so the bag can flag it. */
      variantId?: string;
    };

const MESSAGES: Record<string, string> = {
  INVALID_NAME: "Enter your full name.",
  INVALID_PHONE: "Enter a phone number we can call, for example 0300 1234567.",
  INVALID_ADDRESS: "Enter your full delivery address.",
  INVALID_CITY: "Enter your city.",
  INVALID_EMAIL: "Enter a valid email address or leave it empty.",
  EMPTY_CART: "Your bag is empty.",
  TOO_MANY_ITEMS: "Too many different items in one order. Split it into two orders.",
  INVALID_QUANTITY: "Each item can be ordered up to 10 at a time.",
  INVALID_ITEM: "Something in your bag is no longer valid. Remove it and try again.",
  INVALID_DISCOUNT: "That discount code can no longer be used. Remove it and place the order again.",
};

export async function placeOrder(input: unknown): Promise<CheckoutResult> {
  if (!isSupabaseConfigured())
    return {
      ok: false,
      message: "Ordering is not connected yet. Connect Supabase to take orders.",
    };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path.at(-1) ?? "form");
      fields[key] ??= issue.message;
    }
    return { ok: false, message: "Check the highlighted details.", fields };
  }

  const { customer, items } = parsed.data;
  const { data, error } = await createPublicClient({ cached: false }).rpc(
    "place_order",
    {
      customer: {
        ...customer,
        email: customer.email || null,
        discount_code: customer.discount_code || null,
      },
      items,
    },
  );

  if (error) {
    const [code, variantId] = (error.message ?? "").split(":");
    if (code === "OUT_OF_STOCK" || code === "UNAVAILABLE")
      return {
        ok: false,
        variantId,
        message:
          code === "OUT_OF_STOCK"
            ? "One of your pieces has just sold out in that size. Your bag has been updated."
            : "One of your pieces is no longer available. Your bag has been updated.",
      };
    return {
      ok: false,
      message: MESSAGES[code] ?? "We could not place your order. Please try again.",
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  // Stock changed: refresh cached catalogue pages.
  updateTag(CATALOG_TAG);
  return { ok: true, orderId: row.order_id, orderNumber: row.order_number };
}

export type DiscountCheck =
  | { valid: true; code: string; amount: number }
  | { valid: false; message: string };

/** Checks a discount code against the current subtotal (minor units). */
export async function checkDiscount(code: string, subtotal: number): Promise<DiscountCheck> {
  if (!isSupabaseConfigured())
    return { valid: false, message: "Discount codes work once the store is connected." };
  const clean = String(code ?? "").trim().toUpperCase().slice(0, 30);
  if (!/^[A-Z0-9_-]{3,30}$/.test(clean)) return { valid: false, message: "Enter a valid code." };
  const { data, error } = await createPublicClient({ cached: false }).rpc("check_discount", {
    p_code: clean,
    p_subtotal: Math.max(0, Math.floor(subtotal)),
  });
  if (error || !data) return { valid: false, message: "We could not check that code. Try again." };
  if (!data.valid) {
    if (data.reason === "min")
      return {
        valid: false,
        message: `This code needs an order of Rs ${(data.min_subtotal / 100).toLocaleString("en-PK")} or more.`,
      };
    return { valid: false, message: "This code is not valid." };
  }
  return { valid: true, code: data.code, amount: data.amount };
}
