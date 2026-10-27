"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { deleteProduct, saveProduct } from "@/app/admin/actions";
import { getBrowserClient } from "@/lib/supabase/browser";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/supabase/env";
import type { SizeSystem } from "@/types";
import { prepare } from "@/lib/admin/upload";

export type AdminCategory = {
  id: string;
  name: string;
  subcategories: { slug: string; name: string }[];
};

export type ProductRecord = {
  id: string;
  slug: string;
  name: string;
  style: string;
  description: string;
  category_id: string;
  subcategory: string | null;
  leather: string;
  construction: string;
  lining: string;
  sole: string;
  care: string;
  featured: boolean;
  is_new: boolean;
  status: "active" | "draft" | "archived";
  product_images: { id: string; color: string; url: string; alt: string; sort: number }[];
  variants: {
    id: string;
    sku: string;
    size: string;
    size_system: SizeSystem;
    color_name: string;
    color_hex: string;
    stock: number;
    price: number;
    compare_at_price: number | null;
  }[];
};

const PRESETS: Record<SizeSystem, { label: string; sizes: string[] }> = {
  EU: { label: "EU shoe sizes", sizes: ["38", "39", "40", "41", "42", "43", "44", "45", "46", "47"] },
  UK: { label: "UK shoe sizes", sizes: ["5", "6", "7", "8", "9", "10", "11", "12", "13"] },
  US: { label: "US shoe sizes", sizes: ["6", "7", "8", "9", "10", "11", "12", "13", "14"] },
  WAIST_IN: { label: "Waist, inches (belts)", sizes: ["28", "30", "32", "34", "36", "38", "40", "42", "44", "46"] },
  ONE_SIZE: { label: "One size (wallets)", sizes: ["One size"] },
};

const SWATCHES = [
  ["Noir", "#1a1614"],
  ["Cognac", "#8a4a22"],
  ["Oxblood", "#5a1d1d"],
  ["Tan", "#a8703f"],
  ["Chocolate", "#4a2c1e"],
  ["Navy", "#1f2c5c"],
];

type Row = { id?: string; sku: string; price: string; was: string; stock: string };
type Img = { id?: string; color: string; url: string; alt: string };

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const key = (color: string, size: string) => `${color}|${size}`;

export function ProductForm({
  categories,
  product,
  notice,
}: {
  categories: AdminCategory[];
  product: ProductRecord | null;
  notice?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    notice ? { ok: true, text: notice } : null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [subcategory, setSubcategory] = useState(product?.subcategory ?? "");
  const [text, setText] = useState({
    style: product?.style ?? "",
    description: product?.description ?? "",
    leather: product?.leather ?? "",
    construction: product?.construction ?? "",
    lining: product?.lining ?? "",
    sole: product?.sole ?? "",
    care: product?.care ?? "",
  });
  const [status, setStatus] = useState<ProductRecord["status"]>(product?.status ?? "draft");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [isNew, setIsNew] = useState(product?.is_new ?? true);

  const initialSystem: SizeSystem = product?.variants[0]?.size_system ?? "EU";
  const [system, setSystem] = useState<SizeSystem>(initialSystem);
  const [sizes, setSizes] = useState<string[]>(() =>
    product?.variants.length
      ? [...new Set(product.variants.map((v) => v.size))]
      : initialSystem === "ONE_SIZE"
        ? ["One size"]
        : ["40", "41", "42", "43", "44"],
  );
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(() =>
    product?.variants.length
      ? [...new Map(product.variants.map((v) => [v.color_name, { name: v.color_name, hex: v.color_hex }])).values()]
      : [{ name: "Noir", hex: "#1a1614" }],
  );
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      (product?.variants ?? []).map((v) => [
        key(v.color_name, v.size),
        {
          id: v.id,
          sku: v.sku,
          price: String(v.price / 100),
          was: v.compare_at_price ? String(v.compare_at_price / 100) : "",
          stock: String(v.stock),
        },
      ]),
    ),
  );
  const [images, setImages] = useState<Img[]>(
    () => product?.product_images.toSorted((a, b) => a.sort - b.sort).map(({ id, color, url, alt }) => ({ id, color, url, alt })) ?? [],
  );
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [bulkWas, setBulkWas] = useState("");
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const category = categories.find((c) => c.id === categoryId);
  const skuPrefix = (slug || "dk").replace(/-/g, "").slice(0, 8).toUpperCase();
  const rowFor = (color: string, size: string): Row =>
    rows[key(color, size)] ?? {
      sku: `${skuPrefix}-${color.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase()}-${size.replace(/\s/g, "").toUpperCase()}`,
      price: "",
      was: "",
      stock: "0",
    };
  const setRow = (color: string, size: string, patch: Partial<Row>) =>
    setRows((r) => ({ ...r, [key(color, size)]: { ...rowFor(color, size), ...patch } }));

  const sizeOptions = useMemo(
    () => [...new Set([...PRESETS[system].sizes, ...sizes])].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)),
    [system, sizes],
  );
  const variantCount = colors.length * sizes.length;
  const removedVariants = (product?.variants ?? []).filter(
    (v) => !colors.some((c) => c.name === v.color_name) || !sizes.includes(v.size),
  ).length;

  function changeSystem(next: SizeSystem) {
    setSystem(next);
    setSizes(next === "ONE_SIZE" ? ["One size"] : PRESETS[next].sizes.slice(2, 7));
  }

  async function upload(color: string, files: FileList | null) {
    if (!files?.length) return;
    setUploading(color);
    setMessage(null);
    const supabase = getBrowserClient();
    const added: Img[] = [];
    for (const file of Array.from(files)) {
      const blob = await prepare(file);
      const ext = blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `products/${slug || "product"}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, blob, { contentType: blob.type || file.type, cacheControl: "31536000", upsert: false });
      if (error) {
        setMessage({ ok: false, text: `Upload failed: ${error.message}` });
        break;
      }
      const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
      added.push({ color, url: data.publicUrl, alt: `${name || "DUKES product"} in ${color.toLowerCase()}` });
    }
    setImages((i) => [...i, ...added]);
    setUploading(null);
  }

  function moveImage(img: Img, dir: -1 | 1) {
    setImages((list) => {
      const same = list.filter((x) => x.color === img.color);
      const idx = same.indexOf(img);
      const swap = same[idx + dir];
      if (!swap) return list;
      const a = list.indexOf(img), b = list.indexOf(swap);
      const next = [...list];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  function save() {
    setMessage(null);
    const variants = colors.flatMap((c) =>
      sizes.map((size) => {
        const r = rowFor(c.name, size);
        return {
          id: r.id,
          sku: r.sku.trim(),
          size,
          size_system: system,
          color_name: c.name.trim(),
          color_hex: c.hex,
          stock: Math.max(0, Math.floor(Number(r.stock) || 0)),
          price: Math.round((Number(r.price) || 0) * 100),
          compare_at_price: Number(r.was) > 0 ? Math.round(Number(r.was) * 100) : null,
        };
      }),
    );
    const missingPrice = variants.find((v) => v.price <= 0);
    if (status === "active" && missingPrice) {
      setMessage({ ok: false, text: `Enter a price for ${missingPrice.color_name}, size ${missingPrice.size} before publishing.` });
      return;
    }
    const payload = {
      id: product?.id ?? "",
      name,
      slug,
      category_id: categoryId,
      subcategory,
      ...text,
      featured,
      is_new: isNew,
      status,
      images: images.filter((i) => colors.some((c) => c.name === i.color)),
      variants,
    };
    start(async () => {
      const r = await saveProduct(payload);
      if (!r.ok) {
        setMessage({ ok: false, text: r.message });
        return;
      }
      setMessage({ ok: true, text: r.message ?? "Saved." });
      if (!product && r.id) router.replace(`/admin/products/${r.id}?created=1`);
      else router.refresh();
    });
  }

  return (
    <div className="product-editor">
      <header className="admin-head sticky">
        <div>
          <Link href="/admin/products" className="back-link">Products</Link>
          <h1>{product ? product.name : "New product"}</h1>
        </div>
        <div className="head-actions">
          {product && status === "active" && (
            <Link href={`/products/${product.slug}`} target="_blank" className="text-link">View in store</Link>
          )}
          <button className="button" onClick={save} disabled={pending || Boolean(uploading)}>
            {pending ? "Saving…" : "Save product"}
          </button>
        </div>
      </header>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={message.ok ? "form-ok" : "form-error"}>
          {message.text}
        </p>
      )}

      <div className="admin-grid wide-left">
        <div className="admin-stack">
          <section className="panel">
            <h2>Basics</h2>
            <label className="field">
              <span>Product name</span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="Windsor"
              />
            </label>
            <label className="field">
              <span>Style line</span>
              <input value={text.style} onChange={(e) => setText({ ...text, style: e.target.value })} placeholder="Horsebit loafer" />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Category</span>
                <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setSubcategory(""); }}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Type</span>
                <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                  <option value="">None</option>
                  {category?.subcategories.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Description</span>
              <textarea rows={4} value={text.description} onChange={(e) => setText({ ...text, description: e.target.value })} />
            </label>
            <label className="field">
              <span>Web address</span>
              <span className="slug-input">
                <em>/products/</em>
                <input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} />
              </span>
            </label>
          </section>

          <section className="panel">
            <h2>Colours, sizes, prices and stock</h2>
            <div className="field-row">
              <label className="field">
                <span>Size type</span>
                <select value={system} onChange={(e) => changeSystem(e.target.value as SizeSystem)}>
                  {(Object.keys(PRESETS) as SizeSystem[]).map((s) => <option key={s} value={s}>{PRESETS[s].label}</option>)}
                </select>
              </label>
            </div>
            {system !== "ONE_SIZE" && (
              <fieldset className="size-picker">
                <legend>Sizes offered</legend>
                <div className="size-options compact">
                  {sizeOptions.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={sizes.includes(s) ? "selected" : ""}
                      aria-pressed={sizes.includes(s)}
                      onClick={() =>
                        setSizes((list) =>
                          list.includes(s) ? list.filter((x) => x !== s) : [...list, s].sort((a, b) => Number(a) - Number(b)),
                        )
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="bulk-row">
              <label>
                <span>Price for all, Rs</span>
                <input inputMode="numeric" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value.replace(/[^\d]/g, ""))} />
              </label>
              <button type="button" className="text-link" onClick={() => {
                if (!bulkPrice) return;
                setRows((r) => {
                  const next = { ...r };
                  for (const c of colors) for (const s of sizes) next[key(c.name, s)] = { ...rowFor(c.name, s), price: bulkPrice };
                  return next;
                });
              }}>Apply</button>
              <label>
                <span>Was price for all, Rs</span>
                <input inputMode="numeric" value={bulkWas} placeholder="Sale only" onChange={(e) => setBulkWas(e.target.value.replace(/[^\d]/g, ""))} />
              </label>
              <button type="button" className="text-link" onClick={() => {
                setRows((r) => {
                  const next = { ...r };
                  for (const c of colors) for (const s of sizes) next[key(c.name, s)] = { ...rowFor(c.name, s), was: bulkWas };
                  return next;
                });
              }}>{bulkWas ? "Apply" : "Clear sale"}</button>
              <label>
                <span>Stock for all</span>
                <input inputMode="numeric" value={bulkStock} onChange={(e) => setBulkStock(e.target.value.replace(/[^\d]/g, ""))} />
              </label>
              <button type="button" className="text-link" onClick={() => {
                if (!bulkStock) return;
                setRows((r) => {
                  const next = { ...r };
                  for (const c of colors) for (const s of sizes) next[key(c.name, s)] = { ...rowFor(c.name, s), stock: bulkStock };
                  return next;
                });
              }}>Apply</button>
            </div>

            {colors.map((c, ci) => (
              <div className="colour-block" key={ci}>
                <div className="colour-head">
                  <input
                    type="color"
                    value={c.hex}
                    aria-label={`Swatch colour for ${c.name || "colour"}`}
                    onChange={(e) => setColors((l) => l.map((x, i) => (i === ci ? { ...x, hex: e.target.value } : x)))}
                  />
                  <input
                    className="colour-name"
                    value={c.name}
                    aria-label="Colour name"
                    onChange={(e) => {
                      const nameNext = e.target.value;
                      const old = c.name;
                      setColors((l) => l.map((x, i) => (i === ci ? { ...x, name: nameNext } : x)));
                      setRows((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.startsWith(`${old}|`) ? `${nameNext}|${k.split("|")[1]}` : k, v])));
                      setImages((l) => l.map((img) => (img.color === old ? { ...img, color: nameNext } : img)));
                    }}
                  />
                  {colors.length > 1 && (
                    <button type="button" className="icon-button" aria-label={`Remove ${c.name}`} onClick={() => setColors((l) => l.filter((_, i) => i !== ci))}>
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
                <table className="admin-table variant-table">
                  <thead>
                    <tr><th>Size</th><th>Price, Rs</th><th>Was, Rs</th><th>Stock</th><th>SKU</th></tr>
                  </thead>
                  <tbody>
                    {sizes.map((s) => {
                      const r = rowFor(c.name, s);
                      return (
                        <tr key={s}>
                          <td>{s}</td>
                          <td><input inputMode="numeric" value={r.price} aria-label={`Price for ${c.name} ${s}`} onChange={(e) => setRow(c.name, s, { price: e.target.value.replace(/[^\d]/g, "") })} /></td>
                          <td><input inputMode="numeric" value={r.was} placeholder="—" aria-label={`Was price for ${c.name} ${s}`} onChange={(e) => setRow(c.name, s, { was: e.target.value.replace(/[^\d]/g, "") })} /></td>
                          <td><input inputMode="numeric" value={r.stock} aria-label={`Stock for ${c.name} ${s}`} onChange={(e) => setRow(c.name, s, { stock: e.target.value.replace(/[^\d]/g, "") })} /></td>
                          <td><input value={r.sku} aria-label={`SKU for ${c.name} ${s}`} onChange={(e) => setRow(c.name, s, { sku: e.target.value.toUpperCase() })} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="photo-strip">
                  {images.filter((i) => i.color === c.name).map((img, k, arr) => (
                    <figure key={img.url + k}>
                      <Image src={img.url} alt={img.alt} width={120} height={150} unoptimized />
                      <figcaption>
                        <button type="button" aria-label="Move earlier" disabled={k === 0} onClick={() => moveImage(img, -1)}><ArrowLeft size={14} /></button>
                        <button type="button" aria-label="Remove photo" onClick={() => setImages((l) => l.filter((x) => x !== img))}><X size={14} /></button>
                        <button type="button" aria-label="Move later" disabled={k === arr.length - 1} onClick={() => moveImage(img, 1)}><ArrowRight size={14} /></button>
                      </figcaption>
                    </figure>
                  ))}
                  <button type="button" className="add-photo" disabled={uploading === c.name || !c.name} onClick={() => fileInputs.current[c.name]?.click()}>
                    <ImagePlus size={20} strokeWidth={1.4} />
                    {uploading === c.name ? "Uploading…" : `Add ${c.name || ""} photos`}
                  </button>
                  <input
                    ref={(el) => { fileInputs.current[c.name] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={(e) => { upload(c.name, e.target.files); e.target.value = ""; }}
                  />
                </div>
              </div>
            ))}
            <div className="add-colour">
              <span>Add a colour:</span>
              {SWATCHES.filter(([n]) => !colors.some((c) => c.name === n)).map(([n, hex]) => (
                <button type="button" key={n} className="chip" onClick={() => setColors((l) => [...l, { name: n, hex }])}>
                  <i style={{ background: hex }} /> {n}
                </button>
              ))}
              <button type="button" className="chip" onClick={() => setColors((l) => [...l, { name: `Colour ${l.length + 1}`, hex: "#555555" }])}>
                <Plus size={14} /> Custom
              </button>
            </div>
            <p className="muted">
              {variantCount} size and colour combinations.
              {removedVariants > 0 && ` Saving removes ${removedVariants} existing combination${removedVariants === 1 ? "" : "s"}; past orders are kept.`}
            </p>
          </section>

          <section className="panel">
            <h2>Materials and care</h2>
            <div className="field-row">
              {(["leather", "construction", "lining", "sole"] as const).map((f) => (
                <label className="field" key={f}>
                  <span>{f[0].toUpperCase() + f.slice(1)}</span>
                  <input value={text[f]} onChange={(e) => setText({ ...text, [f]: e.target.value })} />
                </label>
              ))}
            </div>
            <label className="field">
              <span>Care</span>
              <textarea rows={3} value={text.care} onChange={(e) => setText({ ...text, care: e.target.value })} />
            </label>
          </section>
        </div>

        <div className="admin-stack">
          <section className="panel">
            <h2>Publishing</h2>
            <fieldset className="radio-list">
              <legend className="sr-only">Status</legend>
              {([
                ["active", "Live", "Visible in the store and can be ordered."],
                ["draft", "Draft", "Hidden while you prepare it."],
                ["archived", "Archived", "Hidden; kept for past orders."],
              ] as const).map(([v, l, d]) => (
                <label key={v}>
                  <input type="radio" name="status" checked={status === v} onChange={() => setStatus(v)} />
                  <span><strong>{l}</strong><small>{d}</small></span>
                </label>
              ))}
            </fieldset>
            <label className="check">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Show in Our picks on the homepage
            </label>
            <label className="check">
              <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
              Mark as new arrival
            </label>
          </section>
          {product && (
            <section className="panel">
              <h2>Delete</h2>
              {confirmDelete ? (
                <div className="confirm-row">
                  <span>Delete {product.name} permanently? Past orders keep their details. To hide it instead, set it to Archived.</span>
                  <button className="button danger" disabled={pending} onClick={() => start(async () => {
                    const r = await deleteProduct(product.id);
                    if (r && !r.ok) setMessage({ ok: false, text: r.message });
                  })}>Delete product</button>
                  <button className="text-link" onClick={() => setConfirmDelete(false)}>Keep product</button>
                </div>
              ) : (
                <button className="text-link danger-link" onClick={() => setConfirmDelete(true)}>Delete this product</button>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
