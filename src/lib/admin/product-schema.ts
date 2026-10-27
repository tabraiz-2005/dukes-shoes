import { z } from "zod";

const sizeSystem = z.enum(["EU", "UK", "US", "WAIST_IN", "ONE_SIZE"]);

export const productSchema = z
  .object({
    id: z.string().uuid().optional().or(z.literal("")),
    name: z.string().trim().min(1, "Enter a product name.").max(120),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only."),
    style: z.string().trim().max(160).default(""),
    description: z.string().trim().max(4000).default(""),
    category_id: z.string().min(1, "Choose a category."),
    subcategory: z.string().default(""),
    leather: z.string().trim().max(200).default(""),
    construction: z.string().trim().max(200).default(""),
    lining: z.string().trim().max(200).default(""),
    sole: z.string().trim().max(200).default(""),
    care: z.string().trim().max(1000).default(""),
    featured: z.boolean().default(false),
    is_new: z.boolean().default(false),
    status: z.enum(["active", "draft", "archived"]),
    images: z
      .array(
        z.object({
          id: z.string().optional(),
          color: z.string().trim().min(1),
          url: z.string().trim().min(1).max(1000),
          alt: z.string().trim().max(300).default(""),
        }),
      )
      .max(60),
    variants: z
      .array(
        z.object({
          id: z.string().optional(),
          sku: z.string().trim().min(1, "Every size needs a SKU.").max(60),
          size: z.string().trim().min(1).max(20),
          size_system: sizeSystem,
          color_name: z.string().trim().min(1).max(40),
          color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
          stock: z.number().int().min(0).max(100000),
          price: z.number().int().min(0).max(100_000_000),
        }),
      )
      .max(400),
  })
  .superRefine((p, ctx) => {
    if (p.status === "active" && p.variants.length === 0)
      ctx.addIssue({ code: "custom", path: ["variants"], message: "Add at least one colour and size before publishing." });
    const combos = new Set<string>();
    const skus = new Set<string>();
    for (const v of p.variants) {
      const combo = `${v.color_name.toLowerCase()}|${v.size}`;
      if (combos.has(combo))
        ctx.addIssue({ code: "custom", path: ["variants"], message: `${v.color_name} size ${v.size} is listed twice.` });
      if (skus.has(v.sku))
        ctx.addIssue({ code: "custom", path: ["variants"], message: `SKU ${v.sku} is used twice.` });
      combos.add(combo);
      skus.add(v.sku);
    }
  });

export type ProductPayload = z.infer<typeof productSchema>;
