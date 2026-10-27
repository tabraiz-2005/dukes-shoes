"use client";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { store } from "@/config/store";
import { useCatalog } from "./catalog-provider";
import { ProductCard } from "./product-card";
import { Modal } from "./ui";
import type { CatalogFilters } from "@/types";

const LABELS: Record<string, string> = {
  q: "Search",
  type: "Type",
  size: "Size",
  color: "Colour",
  min: "From",
  max: "Up to",
};

export function Shop() {
  const params = useSearchParams(),
    router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    getProducts,
    getCategories,
    getCategory,
    getFilterOptions,
    getProductCount,
  } = useCatalog();
  const f = Object.fromEntries(params.entries()) as CatalogFilters;
  const category = getCategory(f.category);
  const products = getProducts(f);
  const opts = getFilterOptions(f.category);
  const href = (changes: Record<string, string>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const qs = p.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };
  const update = (key: string, value: string) =>
    router.push(href({ [key]: value }), { scroll: false });
  const clear = () =>
    router.push(category ? `/shop?category=${category.slug}` : "/shop", {
      scroll: false,
    });
  const subName = (slug: string) =>
    category?.subcategories.find((s) => s.slug === slug)?.name ?? slug;
  const active = Object.entries(f).filter(
    ([k, v]) => v && k !== "category" && k !== "sort",
  );
  const filterCount = active.filter(([k]) => k !== "q" && k !== "type").length;

  return (
    <div className="shop">
      <header className="shop-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          {category ? (
            <>
              <Link href="/shop">Collection</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{category.name}</span>
            </>
          ) : (
            <span aria-current="page">Collection</span>
          )}
        </nav>
        <h1>{category ? category.name : "All pieces"}</h1>
        <p>
          {category
            ? category.description
            : `${getProductCount()} pieces in pure leather, made by hand.`}
        </p>
      </header>

      <nav className="chip-row" aria-label="Categories">
        <Link
          href="/shop"
          className={!category ? "chip selected" : "chip"}
          aria-current={!category ? "page" : undefined}
        >
          All
        </Link>
        {getCategories().map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.slug}`}
            className={category?.id === c.id ? "chip selected" : "chip"}
            aria-current={category?.id === c.id ? "page" : undefined}
          >
            {c.name}
          </Link>
        ))}
      </nav>
      {category && (
        <nav className="chip-row sub" aria-label={`${category.name} types`}>
          <Link
            href={href({ type: "" })}
            className={!f.type ? "chip selected" : "chip"}
            scroll={false}
          >
            All {category.name.toLowerCase()}
          </Link>
          {category.subcategories.map((s) => (
            <Link
              key={s.slug}
              href={href({ type: s.slug })}
              className={f.type === s.slug ? "chip selected" : "chip"}
              scroll={false}
            >
              {s.name}
            </Link>
          ))}
        </nav>
      )}

      <div className="shop-toolbar">
        <form action="/shop" className="inline-search" role="search">
          {Object.entries(f)
            .filter(([k]) => k !== "q")
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <Search size={17} strokeWidth={1.4} aria-hidden="true" />
          <input
            key={f.q}
            aria-label="Search products"
            name="q"
            defaultValue={f.q}
            placeholder="Search"
          />
          <button type="submit" className="sr-only-focusable">
            Search
          </button>
        </form>
        <span className="result-count" aria-live="polite">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </span>
        <label className="sort-label">
          <span>Sort</span>
          <select
            aria-label="Sort by"
            value={f.sort || "newest"}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
          </select>
        </label>
        <button className="filter-button" onClick={() => setOpen(true)}>
          <SlidersHorizontal size={16} strokeWidth={1.4} aria-hidden="true" />
          Filters{filterCount ? ` (${filterCount})` : ""}
        </button>
      </div>

      {active.length > 0 && (
        <div className="active-filters">
          {active.map(([k, v]) => (
            <button
              key={k}
              onClick={() => update(k, "")}
              aria-label={`Remove filter ${LABELS[k] ?? k}: ${v}`}
            >
              {LABELS[k] ?? k}:{" "}
              {k === "type"
                ? subName(v)
                : k === "min" || k === "max"
                  ? `Rs ${Number(v).toLocaleString("en-PK")}`
                  : v}
              <X size={13} strokeWidth={1.5} aria-hidden="true" />
            </button>
          ))}
          <button className="clear-all" onClick={clear}>
            Clear all
          </button>
        </div>
      )}

      {products.length ? (
        <div className="product-grid shop-grid">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>No pieces match these filters.</h2>
          <p>Remove a filter or search for something broader.</p>
          <button className="button" onClick={() => router.push("/shop")}>
            Reset filters
          </button>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Filters" drawer>
        <div className="filter-fields">
          {opts.sizes.length > 0 && (
            <fieldset>
              <legend>Size, {opts.sizeLabel}</legend>
              <div className="size-options compact">
                {opts.sizes.map((x) => (
                  <button
                    key={x}
                    className={f.size === x ? "selected" : ""}
                    aria-pressed={f.size === x}
                    onClick={() => update("size", f.size === x ? "" : x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend>Colour</legend>
            <div className="colour-filter">
              {opts.colors.map((c) => (
                <button
                  key={c.name}
                  className={f.color === c.name ? "selected" : ""}
                  aria-pressed={f.color === c.name}
                  onClick={() =>
                    update("color", f.color === c.name ? "" : c.name)
                  }
                >
                  <span style={{ background: c.hex }} aria-hidden="true" />
                  {c.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Price, {store.currency.code}</legend>
            <div className="price-fields">
              <label>
                <span>Minimum</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  inputMode="numeric"
                  value={f.min || ""}
                  onChange={(e) => update("min", e.target.value)}
                  placeholder="0"
                />
              </label>
              <label>
                <span>Maximum</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  inputMode="numeric"
                  value={f.max || ""}
                  onChange={(e) => update("max", e.target.value)}
                  placeholder="Any"
                />
              </label>
            </div>
          </fieldset>
        </div>
        <div className="drawer-actions">
          <button className="text-link" onClick={clear}>
            Clear filters
          </button>
          <button className="button" onClick={() => setOpen(false)}>
            Show {products.length} {products.length === 1 ? "piece" : "pieces"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
