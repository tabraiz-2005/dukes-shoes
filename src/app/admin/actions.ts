"use server";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireOwner, requireStaff } from "@/lib/admin/auth";
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
    return "Your account does not have permission for this.";
  if (message.includes("categories_slug_key") || message.includes("categories_pkey"))
    return "Another category already uses this web address.";
  if (message.includes("collections_slug_key"))
    return "Another collection already uses this web address.";
  if (message.includes("discounts_code_key"))
    return "That discount code already exists.";
  if (message.includes("products_category_id_fkey"))
    return "Products still use this category. Move or delete them first.";
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
    const { supabase } = await requireStaff();
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

const uuid = z.string().uuid();
const slug = z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only.");
const done = (paths: string[]) => {
  updateTag(CATALOG_TAG);
  paths.forEach((p) => revalidatePath(p));
};
const fail = (e: unknown): ActionResult => ({ ok: false, message: friendly((e as Error).message) });

// ---------------------------------------------------------------- inventory
export async function setStock(variantId: string, stock: number): Promise<ActionResult> {
  try {
    const { supabase } = await requireStaff();
    if (!uuid.safeParse(variantId).success || !Number.isInteger(stock) || stock < 0 || stock > 100000)
      return { ok: false, message: "Enter a whole number." };
    const { error } = await supabase.rpc("set_stock", { p_variant_id: variantId, p_stock: stock });
    if (error) return { ok: false, message: friendly(error.message) };
    done(["/admin/inventory"]);
    return { ok: true, message: "Saved" };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- categories
const categorySchema = z.object({
  isNew: z.boolean(),
  id: slug,
  name: z.string().trim().min(1, "Enter a name.").max(60),
  description: z.string().trim().max(300).default(""),
  image: z.string().trim().max(1000).nullable(),
  sort: z.number().int().min(0).max(999),
  subcategories: z
    .array(z.object({ slug, name: z.string().trim().min(1).max(60) }))
    .max(30),
});

export async function saveCategory(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
    const c = parsed.data;
    const row = { id: c.id, slug: c.id, name: c.name, description: c.description, image: c.image, sort: c.sort };
    const { error } = c.isNew
      ? await supabase.from("categories").insert(row)
      : await supabase.from("categories").update(row).eq("id", c.id);
    if (error) return { ok: false, message: friendly(error.message) };
    const keep = c.subcategories.map((s) => s.slug);
    const del = supabase.from("subcategories").delete().eq("category_id", c.id);
    const { error: e1 } = keep.length ? await del.not("slug", "in", `(${keep.join(",")})`) : await del;
    if (e1) return { ok: false, message: friendly(e1.message) };
    if (c.subcategories.length) {
      const { error: e2 } = await supabase.from("subcategories").upsert(
        c.subcategories.map((s, i) => ({ category_id: c.id, slug: s.slug, name: s.name, sort: i })),
        { onConflict: "category_id,slug" },
      );
      if (e2) return { ok: false, message: friendly(e2.message) };
    }
    done(["/admin/categories"]);
    return { ok: true, id: c.id, message: "Category saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
    if (count) return { ok: false, message: `${count} product${count === 1 ? "" : "s"} still use this category. Move or delete them first.` };
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return { ok: false, message: friendly(error.message) };
    done(["/admin/categories"]);
  } catch (e) {
    return fail(e);
  }
  redirect("/admin/categories");
}

// ---------------------------------------------------------------- collections
const collectionSchema = z.object({
  id: z.string().optional(),
  slug,
  title: z.string().trim().min(1, "Enter a title.").max(80),
  description: z.string().trim().max(300).default(""),
  image: z.string().trim().max(1000).nullable(),
  status: z.enum(["active", "draft"]),
  show_on_home: z.boolean(),
  sort: z.number().int().min(0).max(999),
  product_ids: z.array(uuid).max(200),
});

export async function saveCollection(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = collectionSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
    const { data, error } = await supabase.rpc("admin_save_collection", { payload: parsed.data });
    if (error) return { ok: false, message: friendly(error.message) };
    done(["/admin/collections", "/"]);
    return { ok: true, id: data as string, message: "Collection saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown collection." };
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) return { ok: false, message: friendly(error.message) };
    done(["/admin/collections", "/"]);
  } catch (e) {
    return fail(e);
  }
  redirect("/admin/collections");
}

// ---------------------------------------------------------------- discounts
const discountSchema = z
  .object({
    id: z.string().optional(),
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Use 3 to 30 letters, numbers, dashes or underscores."),
    description: z.string().trim().max(200).default(""),
    kind: z.enum(["percent", "fixed"]),
    value: z.number().int().positive("Enter the discount amount."),
    min_subtotal: z.number().int().min(0),
    starts_at: z.string().nullable(),
    ends_at: z.string().nullable(),
    usage_limit: z.number().int().positive().nullable(),
    active: z.boolean(),
  })
  .refine((d) => d.kind !== "percent" || d.value <= 90, "A percentage discount can be at most 90%.");

export async function saveDiscount(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = discountSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
    const { id, ...row } = parsed.data;
    const { data, error } = id
      ? await supabase.from("discounts").update(row).eq("id", id).select("id").single()
      : await supabase.from("discounts").insert(row).select("id").single();
    if (error) return { ok: false, message: friendly(error.message) };
    revalidatePath("/admin/discounts");
    return { ok: true, id: data.id, message: "Discount saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteDiscount(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    if (!uuid.safeParse(id).success) return { ok: false, message: "Unknown discount." };
    const { error } = await supabase.from("discounts").delete().eq("id", id);
    if (error) return { ok: false, message: friendly(error.message) };
    revalidatePath("/admin/discounts");
  } catch (e) {
    return fail(e);
  }
  redirect("/admin/discounts");
}

// ---------------------------------------------------------------- homepage and store details
const link = z.object({ label: z.string().trim().max(40), href: z.string().trim().max(300) });
const homeSchema = z.object({
  eyebrow: z.string().trim().max(80),
  title: z.string().trim().min(1, "Enter a headline.").max(80),
  images: z
    .array(z.object({ url: z.string().trim().min(1).max(1000), alt: z.string().trim().max(200) }))
    .min(1, "Add at least one hero image.")
    .max(3),
  primary: link,
  secondary: link,
});

export async function saveHome(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = homeSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "home", value: parsed.data, updated_at: new Date().toISOString() });
    if (error) return { ok: false, message: friendly(error.message) };
    done(["/"]);
    return { ok: true, message: "Homepage saved. It is live now." };
  } catch (e) {
    return fail(e);
  }
}

const storeSchema = z.object({
  announcement: z.string().trim().max(200),
  address: z.string().trim().max(200),
  hours: z.string().trim().max(120),
  whatsapp: z.string().trim().max(30),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email address.")]),
  instagram: z.union([z.literal(""), z.string().trim().url("Enter the full Instagram link.")]),
});

export async function saveStoreContent(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdmin();
    const parsed = storeSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form." };
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: "store", value: parsed.data, updated_at: new Date().toISOString() });
    if (error) return { ok: false, message: friendly(error.message) };
    done(["/"]);
    return { ok: true, message: "Store details saved." };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- team
export async function setMemberRole(email: string, role: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireOwner();
    const r = z.enum(["customer", "staff", "admin", "owner"]).safeParse(role);
    const e = z.string().trim().email().safeParse(email);
    if (!r.success || !e.success) return { ok: false, message: "Enter a valid email address." };
    const { error } = await supabase.rpc("set_member_role", { p_email: e.data, p_role: r.data });
    if (error) {
      const m = error.message;
      return {
        ok: false,
        message: m.includes("NO_ACCOUNT")
          ? "No account uses that email yet. Create it first in Supabase, Authentication, Users, then add it here."
          : m.includes("LAST_OWNER")
            ? "The store needs at least one owner. Make someone else owner first."
            : friendly(m),
      };
    }
    revalidatePath("/admin/team");
    return { ok: true, message: r.data === "customer" ? "Access removed." : "Team updated." };
  } catch (e) {
    return fail(e);
  }
}
