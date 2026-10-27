import type { Collection, HomeContent, StoreContent } from "@/types";

/** Defaults used in demo mode and whenever a field has not been set in the admin. */
export const defaultHome: HomeContent = {
  eyebrow: "Autumn / Winter 2026",
  title: "The Dress Shoe Edit",
  images: [
    { url: "/images/dukes/croc-chain-loafer.jpg", alt: "Black loafers with navy croc-embossed vamps and a gold chain" },
    { url: "/images/dukes/horsebit-noir.jpg", alt: "Polished black horsebit loafers on red velvet" },
    { url: "/images/dukes/pebble-loafer.jpg", alt: "Black pebble-grain loafers with cedar shoe trees" },
  ],
  primary: { label: "Dress shoes", href: "/shop?category=dress-shoes" },
  secondary: { label: "Chappal", href: "/shop?category=chappal" },
};

export const defaultStore: StoreContent = {
  announcement:
    "Complimentary delivery across Pakistan on orders above Rs 15,000. Cash on delivery available.",
  address: "",
  hours: "",
  whatsapp: "",
  email: "",
  instagram: "https://www.instagram.com/dukes_shoes/",
};

export const demoCollections: Collection[] = [
  {
    id: "demo-loafers",
    slug: "the-loafer-edit",
    title: "The loafer edit",
    description: "Horsebit, chain and penny loafers in polished leather.",
    image: "/images/dukes/horsebit-cognac.jpg",
    showOnHome: true,
    productIds: [],
  },
  {
    id: "demo-derby",
    slug: "the-cap-toe-derby",
    title: "The cap-toe Derby",
    description: "Perforated toe cap, contrast welt, made to be resoled.",
    image: "/images/dukes/captoe-derby.jpg",
    showOnHome: true,
    productIds: [],
  },
];

/** Merge saved content over the defaults so a missing field never breaks the page. */
export function mergeHome(saved: Partial<HomeContent> | null | undefined): HomeContent {
  const images = (saved?.images ?? []).filter((i) => i?.url);
  return {
    ...defaultHome,
    ...saved,
    images: images.length ? images : defaultHome.images,
    primary: { ...defaultHome.primary, ...saved?.primary },
    secondary: { ...defaultHome.secondary, ...saved?.secondary },
  };
}
export function mergeStore(saved: Partial<StoreContent> | null | undefined): StoreContent {
  return { ...defaultStore, ...saved };
}
