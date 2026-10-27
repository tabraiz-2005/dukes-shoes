import { store } from "@/config/store";
import type {
  CatalogData,
  CatalogFilters,
  Product,
  ProductImage,
} from "@/types";

/**
 * Pure catalogue queries over a loaded catalogue (Supabase or demo data).
 * Server components build one with createCatalog(await getCatalogData());
 * client components get the same object from useCatalog().
 */
export function createCatalog(data: CatalogData) {
  const { products, categories } = data;
  const unit = 10 ** store.currency.minorUnitDigits;
  const minPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));
  const variantIndex = new Map(
    products.flatMap((product) =>
      product.variants.map((variant) => [variant.id, { product, variant }] as const),
    ),
  );

  function getProducts(f: CatalogFilters = {}) {
    const q = f.q?.trim().toLowerCase();
    const result = products.filter(
      (p) =>
        (!q ||
          `${p.name} ${p.style} ${p.categoryId} ${p.subcategory}`
            .toLowerCase()
            .includes(q)) &&
        (!f.category || p.categoryId === f.category) &&
        (!f.type || p.subcategory === f.type) &&
        p.variants.some(
          (v) =>
            // A size filter only matches sizes that can actually be bought.
            (!f.size || (v.size === f.size && v.stock > 0)) &&
            (!f.color || v.color.name === f.color) &&
            (!f.min || v.price >= Number(f.min) * unit) &&
            (!f.max || v.price <= Number(f.max) * unit),
        ),
    );
    return result.sort((a, b) =>
      f.sort === "price-asc"
        ? minPrice(a) - minPrice(b)
        : f.sort === "price-desc"
          ? minPrice(b) - minPrice(a)
          : b.createdAt.localeCompare(a.createdAt),
    );
  }

  return {
    data,
    getProducts,
    getProductCount: () => products.length,
    getProductBySlug: (slug: string) => products.find((p) => p.slug === slug),
    getProductById: (id: string) => products.find((p) => p.id === id),
    getCategories: () => categories,
    getCategory: (id?: string) => categories.find((c) => c.id === id),
    getRelatedProducts(id: string) {
      const p = products.find((x) => x.id === id);
      return products
        .filter((x) => x.categoryId === p?.categoryId && x.id !== id)
        .slice(0, 4);
    },
    getVariant: (id: string) => variantIndex.get(id),
    getFilterOptions(category?: string) {
      const scope = category
        ? products.filter((p) => p.categoryId === category)
        : products;
      const variants = scope.flatMap((p) => p.variants);
      const sizes = [
        ...new Set(
          variants
            .filter((v) => v.sizeSystem !== "ONE_SIZE")
            .map((v) => v.size),
        ),
      ].sort((a, b) => Number(a) - Number(b));
      const systems = [...new Set(variants.map((v) => v.sizeSystem))].filter(
        (s) => s !== "ONE_SIZE",
      );
      return {
        sizes,
        sizeLabel:
          systems.length === 1
            ? store.sizeSystemLabel[systems[0]]
            : "EU shoe or waist size",
        colors: [
          ...new Map(variants.map((v) => [v.color.name, v.color])).values(),
        ],
      };
    },
  };
}

export type Catalog = ReturnType<typeof createCatalog>;

/** Images for a colour, falling back to the product's first colour. */
export function getImages(p: Product, color?: string): ProductImage[] {
  const fallback: ProductImage[] = [
    { src: "/images/fallback.svg", alt: `${p.name} (image coming soon)` },
  ];
  const first = Object.values(p.images).find((x) => x.length);
  return (color && p.images[color]?.length ? p.images[color] : first) ?? fallback;
}

/** Shipping for a subtotal (minor units), using the store settings. */
export function shippingFor(data: CatalogData, subtotal: number) {
  if (subtotal <= 0) return 0;
  return subtotal >= data.settings.freeShippingThreshold
    ? 0
    : data.settings.shippingFee;
}
