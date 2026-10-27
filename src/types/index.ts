/** Size systems: shoe sizes, belt waist sizes, or one size for small leather goods. */
export type SizeSystem = "EU" | "UK" | "US" | "WAIST_IN" | "ONE_SIZE";

export type Subcategory = { slug: string; name: string };

export type Category = {
  id: string;
  slug: string;
  name: string;
  /** One line shown under the category on tiles and the mega menu. */
  description: string;
  image: string;
  subcategories: Subcategory[];
};

export type ProductImage = { src: string; alt: string };

export type ProductVariant = {
  id: string;
  sku: string;
  /** Stored as a string so shoe sizes ("42"), waist sizes ("34") and "One size" share one type. */
  size: string;
  sizeSystem: SizeSystem;
  color: { name: string; hex: string };
  stock: number;
  /** Integer minor currency units (paisa for PKR). */
  price: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** Short style line, e.g. "Hand-stitched full brogue Oxford". */
  style: string;
  description: string;
  categoryId: string;
  subcategory: string;
  leather: string;
  construction: string;
  lining: string;
  sole: string;
  care: string;
  /** Images per color name. The first color's images act as the default. */
  images: Record<string, ProductImage[]>;
  tags: string[];
  createdAt: string;
  featured: boolean;
  isNew: boolean;
  variants: ProductVariant[];
};

export type CartItem = {
  variantId: string;
  productId: string;
  quantity: number;
};

export type CatalogFilters = {
  q?: string;
  category?: string;
  type?: string;
  size?: string;
  color?: string;
  min?: string;
  max?: string;
  sort?: string;
};

export type StoreSettings = {
  /** Minor units. */
  shippingFee: number;
  /** Minor units. Orders at or above this ship free. */
  freeShippingThreshold: number;
};

export type CatalogData = {
  categories: Category[];
  products: Product[];
  settings: StoreSettings;
  /** "supabase" when live, "demo" when no database is configured. */
  source: "supabase" | "demo";
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";
