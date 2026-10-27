import type { SizeSystem } from "@/types";

/**
 * Central store settings. Brand COLORS live in src/app/globals.css (:root tokens);
 * fonts are imported in src/app/layout.tsx.
 */
export const store = {
  name: "DUKES",
  tagline: "Designer Shoes",
  /**
   * The header lockup is built from the lion emblem (/public/brand/lion.png, cut from the
   * logo) plus the DUKES wordmark set in Montserrat with the logo's gold gradient.
   * To use a full logo file instead, drop the official file at /public/brand/logo.svg (or .png) and set the path here.
   * While null, the header shows the typographic DUKES wordmark.
   */
  logo: null as null | { src: string; width: number; height: number },
  /** Placeholder offer text — requires business approval before launch. */
  announcement:
    "Complimentary delivery across Pakistan on orders above Rs 15,000. Cash on delivery available.",
  currency: { code: "PKR", locale: "en-PK", decimals: 0, minorUnitDigits: 2 },
  defaultSizeSystem: "EU" as SizeSystem,
  sizeSystemLabel: {
    EU: "EU",
    UK: "UK",
    US: "US",
    WAIST_IN: "Waist, inches",
    ONE_SIZE: "One size",
  } satisfies Record<SizeSystem, string>,
  /** Service promises are placeholders until confirmed by the business. */
  services: [
    {
      title: "Delivery across Pakistan",
      text: "Dispatched from our atelier, tracked to your door.",
    },
    {
      title: "Exchanges on WhatsApp",
      text: "A different size or colour, arranged with a message.",
    },
    {
      title: "Cash on delivery",
      text: "Pay when your order arrives.",
    },
  ],
  contact: {
    address: "Atelier address to be confirmed",
    hours: "Mon to Sat, 11:00 to 20:00 (placeholder)",
    whatsapp: "WhatsApp number to be confirmed",
    email: "care@dukes.example",
  },
  clientCare: ["Delivery", "Exchanges & returns", "Size guide", "Leather care", "Contact"],
  legal: ["Terms of sale", "Privacy policy"],
  approvalLabel: "Placeholder — requires business approval",
};
