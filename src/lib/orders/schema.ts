import { z } from "zod";

/** Pakistani mobile/landline numbers: 10 to 15 digits once spaces, dashes and + are removed. */
const phone = z
  .string()
  .trim()
  .refine((v) => /^[0-9]{10,15}$/.test(v.replace(/[\s\-+()]/g, "")), {
    message: "Enter a phone number we can call, for example 0300 1234567.",
  });

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, "Enter your full name.").max(120),
    phone,
    email: z
      .union([z.literal(""), z.string().trim().email("Enter a valid email address or leave it empty.")])
      .optional(),
    address: z
      .string()
      .trim()
      .min(6, "Enter your full delivery address.")
      .max(400),
    city: z
      .string()
      .trim()
      .min(2, "Enter your city.")
      .max(80)
      .refine((v) => /[A-Za-z\u0600-\u06FF]/.test(v), "Enter your city name, for example Lahore."),
    postal_code: z.string().trim().max(12).optional(),
    notes: z.string().trim().max(500).optional(),
    discount_code: z.string().trim().max(30).optional(),
  }),
  items: z
    .array(
      z.object({
        variant_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1, "Your bag is empty.")
    .max(30),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
