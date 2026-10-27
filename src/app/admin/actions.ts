"use server";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { productSchema } from "@/lib/admin/product-schema";
import { CATALOG_TAG } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true; id?: string; message?: string }
  | { ok: false; message: string };

function friendly(message: string) {
  if (message.includes("products_slug_key"))
    return "Another product already uses this web address (slug). Change the slug.";
  if (message.includes("variants_sku_key"))
    return "A SKU is already used by another product. Each SKU must be unique.";
  if (message.includes("variants_product_id_color_name_size_key"))
    return "The same colour and size is listed twice.";
  if (message.includes("FORBIDDEN") || message.includes("Not authorised"))
    return "Your account is not an admin.";
  return message;
}

export async function saveProduct(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = productSchema.safeParse(input);
    if (!parsed.success)
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
    const { data, error } = await supabase.rpc("admin_save_product", {
      payload: parsed.data,
    });
    if (error) return { ok: false, message: friendly(error.message) };
    updateTag(CATALOG_TAG);
    revalidatePath("/admin/products");
    return { ok: true, id: data as string, message: "Product saved." };
  } catch (e) {
    return { ok: false, message: friendly((e as Error).message) };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    if (!z.string().uuid().safeParse(id).success)
      return { ok: false, message: "Unknown product." };
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return { ok: false, message: friendly(error.message) };
    updateTag(CATALOG_TAG);
  } catch (e) {
    return { ok: false, message: friendly((e as Error).message) };
  }
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

const statusSchema = z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]);

export async function setOrderStatus(
  orderId: string,
  status: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const s = statusSchema.safeParse(status);
    if (!s.success || !z.string().uuid().safeParse(orderId).success)
      return { ok: false, message: "Invalid status." };
    const { error } = await supabase.rpc("set_order_status", {
      p_order_id: orderId,
      p_status: s.data,
    });
    if (error)
      return {
        ok: false,
        message: error.message.includes("ORDER_CANCELLED")
          ? "A cancelled order cannot be reopened. Ask the customer to order again."
          : friendly(error.message),
      };
    if (s.data === "cancelled") updateTag(CATALOG_TAG); // stock returned
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { ok: true, message: "Order updated." };
  } catch (e) {
    return { ok: false, message: friendly((e as Error).message) };
  }
}

const settingsSchema = z.object({
  shippingFee: z.number().int().min(0).max(10_000_000),
  freeShippingThreshold: z.number().int().min(0).max(1_000_000_000),
});

export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Enter amounts in rupees." };
    const { error } = await supabase
      .from("store_settings")
      .update({
        shipping_fee: parsed.data.shippingFee,
        free_shipping_threshold: parsed.data.freeShippingThreshold,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) return { ok: false, message: friendly(error.message) };
    updateTag(CATALOG_TAG);
    return { ok: true, message: "Settings saved." };
  } catch (e) {
    return { ok: false, message: friendly((e as Error).message) };
  }
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
