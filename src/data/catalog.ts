import { store } from "@/config/store";
import type { Category, Product, ProductImage, SizeSystem } from "@/types";

/*
 * DEMO DATA. Every product, price, specification and stock figure here is fictional
 * and must be replaced with the real DUKES range (Phase 3 moves this into Supabase).
 * Imagery: see ASSETS.md.
 */

export const categories: Category[] = [
  {
    id: "dress-shoes",
    slug: "dress-shoes",
    name: "Dress Shoes",
    description: "Oxfords, Derbies and loafers, cut and stitched by hand.",
    image: "/images/dukes/pebble-loafer.jpg",
    subcategories: [
      { slug: "oxfords", name: "Oxfords & brogues" },
      { slug: "derbies", name: "Derbies" },
      { slug: "loafers", name: "Loafers" },
    ],
  },
  {
    id: "sandals",
    slug: "sandals",
    name: "Sandals",
    description: "Slides and strap sandals on leather soles.",
    image: "/images/products/sandal-slide-cognac.svg",
    subcategories: [
      { slug: "slides", name: "Slides" },
      { slug: "strap-sandals", name: "Strap sandals" },
    ],
  },
  {
    id: "chappal",
    slug: "chappal",
    name: "Chappal",
    description: "Peshawari and Norozi, made the traditional way.",
    image: "/images/products/chappal-peshawari-cognac.svg",
    subcategories: [
      { slug: "peshawari", name: "Peshawari" },
      { slug: "norozi", name: "Norozi" },
    ],
  },
  {
    id: "belts",
    slug: "belts",
    name: "Belts",
    description: "Full-grain leather with solid brass or steel buckles.",
    image: "/images/products/belt-brass-cognac.svg",
    subcategories: [
      { slug: "dress-belts", name: "Dress belts" },
      { slug: "casual-belts", name: "Casual belts" },
    ],
  },
  {
    id: "wallets",
    slug: "wallets",
    name: "Wallets",
    description: "Bifolds and card holders, edges burnished by hand.",
    image: "/images/products/wallet-bifold-noir.svg",
    subcategories: [
      { slug: "bifolds", name: "Bifolds" },
      { slug: "card-holders", name: "Card holders" },
    ],
  },
];

const HEX: Record<string, string> = {
  Cognac: "#8a4a22",
  Noir: "#211c19",
  Oxblood: "#5a1d1d",
  Tan: "#a8703f",
  Chocolate: "#4a2c1e",
  "Navy & Noir": "#1f2c5c",
};

const SIZES: Record<string, { system: SizeSystem; sizes: string[] }> = {
  shoe: { system: "EU", sizes: ["39", "40", "41", "42", "43", "44", "45"] },
  open: { system: "EU", sizes: ["40", "41", "42", "43", "44", "45"] },
  belt: { system: "WAIST_IN", sizes: ["32", "34", "36", "38", "40", "42"] },
  one: { system: "ONE_SIZE", sizes: ["One size"] },
};

type Def = {
  name: string;
  style: string;
  category: string;
  subcategory: string;
  art: string;
  /** Real DUKES photographs per colour (one image each); overrides the demo art. */
  photos?: Record<string, string>;
  /** Show the detail view first so products sharing a photograph read differently. */
  detailFirst?: boolean;
  colors: string[];
  price: number;
  /** Original price in whole PKR when the piece is on sale. */
  was?: number;
  /** Extra price for a specific colour, in whole PKR. */
  premium?: Record<string, number>;
  sizes: keyof typeof SIZES;
  description: string;
  leather: string;
  construction: string;
  lining: string;
  sole: string;
  /** Colour names that are entirely sold out. */
  soldOut?: string[];
};

const shoeCare =
  "Rest a day between wears with cedar shoe trees. Clean with a soft horsehair brush, feed with a neutral cream every few wears, and polish the toe with wax.";
const goodsCare =
  "Wipe with a dry, soft cloth. Condition two or three times a year. Keep away from direct heat and let it dry naturally if it gets wet.";

const defs: Def[] = [
  {
    name: "Hamilton",
    style: "Full brogue Oxford",
    category: "dress-shoes",
    subcategory: "oxfords",
    art: "brogue",
    colors: ["Cognac", "Noir", "Oxblood"],
    price: 52000,
    premium: { Oxblood: 3000 },
    sizes: "shoe",
    description:
      "A closed-lace Oxford with full wingtip broguing, punched by hand. The cognac is hand-burnished at the toe and heel so each pair develops its own depth of colour.",
    leather: "Full-grain calf, hand-burnished patina",
    construction: "Goodyear welted, hand-lasted",
    lining: "Vegetable-tanned calf",
    sole: "Oak-bark tanned leather sole with stacked heel",
  },
  {
    name: "Regent",
    style: "Perforated cap-toe Derby",
    category: "dress-shoes",
    subcategory: "derbies",
    art: "dukes",
    photos: { Noir: "/images/dukes/captoe-derby.jpg" },
    colors: ["Noir"],
    price: 46500,
    sizes: "shoe",
    description:
      "An open-laced Derby with a perforated toe cap and contrast welt stitching. Smart enough for the office, relaxed enough for the evening.",
    leather: "Full-grain calf",
    construction: "Hand-lasted, stitched welt",
    lining: "Calf leather",
    sole: "Leather sole with rubber heel",
  },
  {
    name: "Ambassador",
    style: "Pebble-grain loafer",
    category: "dress-shoes",
    subcategory: "loafers",
    art: "dukes",
    photos: { Noir: "/images/dukes/pebble-loafer.jpg" },
    colors: ["Noir"],
    price: 44000,
    sizes: "shoe",
    description:
      "A sleek loafer in pebble-grain leather with a patent saddle strap and hand-sewn apron.",
    leather: "Pebble-grain calf with patent strap",
    construction: "Hand-sewn apron",
    lining: "Calf leather",
    sole: "Leather sole",
  },
  {
    name: "Saville",
    style: "Penny loafer",
    category: "dress-shoes",
    subcategory: "loafers",
    art: "loafer",
    colors: ["Cognac", "Noir", "Oxblood"],
    price: 42000,
    sizes: "shoe",
    description:
      "A hand-sewn moccasin construction with a saddle strap cut from a single piece. Sits closely at the heel so it does not slip.",
    leather: "Full-grain calf",
    construction: "Hand-sewn moccasin, Blake stitched",
    lining: "Unlined vamp, calf-lined quarters",
    sole: "Leather sole",
  },
  {
    name: "Monaco",
    style: "Croc-embossed chain loafer",
    category: "dress-shoes",
    subcategory: "loafers",
    art: "dukes",
    photos: { "Navy & Noir": "/images/dukes/croc-chain-loafer.jpg" },
    colors: ["Navy & Noir"],
    price: 49500,
    sizes: "shoe",
    description:
      "Pebble-grain black leather with a navy croc-embossed vamp and a gold-tone chain across the saddle.",
    leather: "Pebble-grain calf, croc-embossed vamp",
    construction: "Hand-lasted",
    lining: "Calf leather",
    sole: "Leather sole",
  },
  {
    name: "Windsor",
    style: "Horsebit loafer",
    category: "dress-shoes",
    subcategory: "loafers",
    art: "dukes",
    photos: {
      Noir: "/images/dukes/horsebit-noir.jpg",
      Cognac: "/images/dukes/horsebit-cognac.jpg",
    },
    colors: ["Noir", "Cognac"],
    price: 45000,
    sizes: "shoe",
    description:
      "A polished loafer with a metal horsebit across the strap. In mirror-shined noir or hand-burnished cognac.",
    leather: "Polished calf",
    construction: "Hand-lasted, stitched welt",
    lining: "Calf leather",
    sole: "Leather sole",
  },
  {
    name: "Clifton",
    style: "Leather slide",
    was: 18500,
    category: "sandals",
    subcategory: "slides",
    art: "sandal-slide",
    colors: ["Cognac", "Noir", "Oxblood"],
    price: 14500,
    sizes: "open",
    description:
      "A single broad strap over a moulded leather footbed. Edges are skived and stitched so nothing rubs.",
    leather: "Full-grain calf strap, vegetable-tanned footbed",
    construction: "Hand-stitched",
    lining: "Calf-lined strap",
    sole: "Leather sole with rubber heel",
  },
  {
    name: "Seaford",
    style: "Cross-strap sandal",
    category: "sandals",
    subcategory: "strap-sandals",
    art: "sandal-cross",
    colors: ["Tan", "Chocolate"],
    price: 16500,
    sizes: "open",
    description:
      "Crossed straps hold the foot without a toe post, with a buckled heel strap for walking further.",
    leather: "Vegetable-tanned leather",
    construction: "Hand-stitched",
    lining: "Unlined",
    sole: "Leather sole with rubber heel",
  },
  {
    name: "Brancaster",
    style: "Lined leather slide",
    category: "sandals",
    subcategory: "slides",
    art: "sandal-slide",
    colors: ["Noir", "Cognac"],
    price: 15500,
    sizes: "open",
    description:
      "The Clifton with a softly padded strap and a cushioned footbed, for wearing through a long day.",
    leather: "Full-grain calf",
    construction: "Hand-stitched",
    lining: "Padded calf lining",
    sole: "Leather sole with rubber heel",
  },
  {
    name: "Peshawari Classic",
    style: "Hand-stitched Peshawari chappal",
    category: "chappal",
    subcategory: "peshawari",
    art: "chappal-peshawari",
    colors: ["Cognac", "Noir", "Chocolate"],
    price: 18500,
    sizes: "open",
    description:
      "The traditional double-flap toe and buckled heel strap, stitched by hand in Peshawar-style patterns.",
    leather: "Full-grain cowhide",
    construction: "Hand-stitched by a single artisan",
    lining: "Vegetable-tanned insole",
    sole: "Stacked leather sole",
  },
  {
    name: "Peshawari Double Sole",
    style: "Peshawari chappal, double sole",
    category: "chappal",
    subcategory: "peshawari",
    art: "chappal-peshawari",
    colors: ["Chocolate", "Noir"],
    price: 21000,
    premium: { Noir: 1500 },
    sizes: "open",
    description:
      "Two stacked leather soles for a heavier, more substantial chappal that holds its shape for years.",
    leather: "Full-grain cowhide",
    construction: "Hand-stitched, double-soled",
    lining: "Vegetable-tanned insole",
    sole: "Double stacked leather sole",
  },
  {
    name: "Charsadda",
    style: "Peshawari chappal, tyre-tread sole",
    category: "chappal",
    subcategory: "peshawari",
    art: "chappal-peshawari",
    colors: ["Cognac", "Chocolate"],
    price: 19500,
    sizes: "open",
    description:
      "The Peshawari upper on a rubber-tread sole, for everyday wear in the rain and the bazaar.",
    leather: "Full-grain cowhide",
    construction: "Hand-stitched",
    lining: "Vegetable-tanned insole",
    sole: "Rubber tread sole",
  },
  {
    name: "Norozi",
    style: "Toe-ring Norozi chappal",
    was: 16500,
    category: "chappal",
    subcategory: "norozi",
    art: "chappal-norozi",
    colors: ["Tan", "Noir"],
    price: 13500,
    sizes: "open",
    description:
      "A light chappal with a single toe ring and a broad vamp strap. Breathable for summer.",
    leather: "Vegetable-tanned leather",
    construction: "Hand-stitched",
    lining: "Unlined",
    sole: "Leather sole",
  },
  {
    name: "Formal Belt, 30mm",
    style: "Dress belt with solid brass buckle",
    category: "belts",
    subcategory: "dress-belts",
    art: "belt-brass",
    colors: ["Noir", "Cognac", "Oxblood"],
    price: 11500,
    sizes: "belt",
    description:
      "A slim belt for tailoring. Edges are bevelled, dyed and burnished by hand; the buckle is solid brass.",
    leather: "Full-grain bridle leather",
    construction: "Hand-stitched keeper, Chicago-screw buckle",
    lining: "Leather backed",
    sole: "Not applicable",
  },
  {
    name: "Heritage Belt, 35mm",
    style: "Casual belt with brass buckle",
    was: 15500,
    category: "belts",
    subcategory: "casual-belts",
    art: "belt-brass",
    colors: ["Cognac", "Noir"],
    price: 12500,
    sizes: "belt",
    description:
      "A wider belt in thick bridle leather that softens and darkens with wear.",
    leather: "Vegetable-tanned bridle leather",
    construction: "Hand-saddle-stitched",
    lining: "Single ply",
    sole: "Not applicable",
  },
  {
    name: "Steel Buckle Belt",
    style: "Dress belt with brushed steel buckle",
    category: "belts",
    subcategory: "dress-belts",
    art: "belt-steel",
    colors: ["Noir", "Chocolate"],
    price: 10500,
    sizes: "belt",
    description:
      "For silver-toned watches and cufflinks. Brushed steel buckle, hand-painted edges.",
    leather: "Full-grain calf",
    construction: "Hand-stitched keeper",
    lining: "Leather backed",
    sole: "Not applicable",
  },
  {
    name: "Bifold Wallet",
    style: "Eight-card bifold",
    category: "wallets",
    subcategory: "bifolds",
    art: "wallet-bifold",
    colors: ["Noir", "Cognac", "Oxblood"],
    price: 12500,
    sizes: "one",
    description:
      "Eight card slots and a full-length note compartment, folded around a single piece of calf.",
    leather: "Full-grain calf",
    construction: "Hand-saddle-stitched",
    lining: "Calf leather",
    sole: "Not applicable",
  },
  {
    name: "Slim Bifold",
    style: "Four-card slim bifold",
    category: "wallets",
    subcategory: "bifolds",
    art: "wallet-bifold",
    colors: ["Oxblood", "Noir"],
    price: 10500,
    sizes: "one",
    description:
      "Four slots and a note compartment, slim enough for a jacket's inside pocket.",
    leather: "Full-grain calf",
    construction: "Hand-saddle-stitched",
    lining: "Unlined",
    sole: "Not applicable",
  },
  {
    name: "Card Holder",
    style: "Three-slot card holder",
    was: 8500,
    category: "wallets",
    subcategory: "card-holders",
    art: "wallet-card",
    colors: ["Noir", "Tan", "Oxblood"],
    price: 6500,
    sizes: "one",
    soldOut: ["Oxblood"],
    description:
      "Three slots on each side and a centre pocket for folded notes.",
    leather: "Full-grain calf",
    construction: "Hand-saddle-stitched",
    lining: "Unlined",
    sole: "Not applicable",
  },
  {
    name: "Pocket Card Case",
    style: "Card case with centre pocket",
    category: "wallets",
    subcategory: "card-holders",
    art: "wallet-card",
    detailFirst: true,
    colors: ["Tan", "Noir"],
    price: 7500,
    sizes: "one",
    description:
      "A deeper centre pocket for receipts and folded notes, edges burnished to a gloss.",
    leather: "Vegetable-tanned leather",
    construction: "Hand-saddle-stitched",
    lining: "Unlined",
    sole: "Not applicable",
  },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function imagesFor(d: Def, color: string): ProductImage[] {
  const photo = d.photos?.[color];
  if (photo)
    return [
      {
        src: photo,
        alt: `${d.name} ${d.style.toLowerCase()} in ${color.toLowerCase()} (DUKES photograph)`,
      },
    ];
  const key = color.toLowerCase();
  const isPhoto = d.art === "brogue" || d.art === "loafer";
  const ext = isPhoto ? "jpg" : "svg";
  const kind = isPhoto ? "photograph" : "illustration";
  const main = {
    src: `/images/products/${d.art}-${key}.${ext}`,
    alt: `${d.name} ${d.style.toLowerCase()} in ${color.toLowerCase()} leather (demo ${kind})`,
  };
  const detail = {
    src: `/images/products/${d.art}-${key}-detail.${ext}`,
    alt: `Close view of the ${d.name} in ${color.toLowerCase()} leather (demo ${kind})`,
  };
  return d.detailFirst ? [detail, main] : [main, detail];
}

export const products: Product[] = defs.map((d, i) => {
  const { system, sizes } = SIZES[d.sizes];
  const id = `p${i + 1}`;
  return {
    id,
    slug: slugify(d.name),
    name: d.name,
    style: d.style,
    description: d.description,
    categoryId: d.category,
    subcategory: d.subcategory,
    leather: d.leather,
    construction: d.construction,
    lining: d.lining,
    sole: d.sole,
    care: d.category === "dress-shoes" ? shoeCare : goodsCare,
    images: Object.fromEntries(d.colors.map((c) => [c, imagesFor(d, c)])),
    tags: [d.category, d.subcategory, "demo"],
    createdAt: new Date(Date.UTC(2026, 9, 27 - i)).toISOString(),
    featured: [0, 3, 9, 13, 16].includes(i),
    isNew: [1, 6, 10, 12, 18].includes(i),
    variants: d.colors.flatMap((color, c) =>
      sizes.map((size, s) => {
        const soldOut =
          d.soldOut?.includes(color) ||
          (c === 0 && s === 0 && sizes.length > 1) ||
          (c === 1 && s === sizes.length - 1 && sizes.length > 1);
        return {
          id: `${id}-${slugify(color)}-${slugify(size)}`,
          sku: `DUK-${String(i + 1).padStart(3, "0")}-${color.slice(0, 3).toUpperCase()}-${slugify(size).toUpperCase()}`,
          size,
          sizeSystem: system,
          color: { name: color, hex: HEX[color] },
          stock: soldOut ? 0 : 3 + ((i + s + c) % 5),
          price:
            (d.price + (d.premium?.[color] ?? 0)) *
            10 ** store.currency.minorUnitDigits,
          compareAtPrice: d.was
            ? (d.was + (d.premium?.[color] ?? 0)) *
              10 ** store.currency.minorUnitDigits
            : null,
        };
      }),
    ),
  };
});
