"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { deleteCollection, saveCollection } from "@/app/admin/actions";
import { FormMessage, ImageField } from "./image-field";

export type CollectionRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string | null;
  status: "active" | "draft";
  show_on_home: boolean;
  sort: number;
  product_ids: string[];
};
export type PickProduct = { id: string; name: string; status: string; category: string; image: string | null };

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function CollectionForm({
  collection,
  products,
  notice,
}: {
  collection: CollectionRecord | null;
  products: PickProduct[];
  notice?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(collection?.title ?? "");
  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(collection));
  const [description, setDescription] = useState(collection?.description ?? "");
  const [image, setImage] = useState<string | null>(collection?.image ?? null);
  const [status, setStatus] = useState<"active" | "draft">(collection?.status ?? "draft");
  const [home, setHome] = useState(collection?.show_on_home ?? false);
  const [sort, setSort] = useState(String(collection?.sort ?? 10));
  const [ids, setIds] = useState<string[]>(collection?.product_ids ?? []);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(notice ? { ok: true, text: notice } : null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const options = products.filter(
    (p) => !ids.includes(p.id) && (!search || `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())),
  );
  const move = (i: number, d: -1 | 1) => {
    const next = [...ids];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setIds(next);
  };

  function save() {
    setMsg(null);
    start(async () => {
      const r = await saveCollection({
        id: collection?.id,
        slug,
        title,
        description,
        image,
        status,
        show_on_home: home,
        sort: Number(sort) || 0,
        product_ids: ids,
      });
      if (!r.ok) return setMsg({ ok: false, text: r.message });
      if (!collection) router.replace(`/admin/collections/${r.id}?created=1`);
      else {
        setMsg({ ok: true, text: r.message ?? "Saved." });
        router.refresh();
      }
    });
  }

  return (
    <form className="admin-form" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <div className="form-columns">
        <section className="panel">
          <h2>Details</h2>
          <label className="field">
            <span>Title</span>
            <input value={title} maxLength={80} required onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
          </label>
          <label className="field">
            <span>Web address</span>
            <input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} />
            <small className="muted">/collections/{slug || "…"}</small>
          </label>
          <label className="field">
            <span>Short description</span>
            <textarea rows={3} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "draft")}>
                <option value="active">Live</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </label>
            <label className="field">
              <span>Position</span>
              <input inputMode="numeric" value={sort} onChange={(e) => setSort(e.target.value.replace(/[^\d]/g, ""))} />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={home} onChange={(e) => setHome(e.target.checked)} />
            Show on the homepage (needs a photo and Live status)
          </label>
        </section>
        <section className="panel">
          <ImageField label="Cover photo" value={image} onChange={setImage} folder="collections" hint="Large tile on the homepage. Portrait, 4:5." />
        </section>
      </div>

      <section className="panel">
        <h2>Products in this collection ({ids.length})</h2>
        <div className="picker">
          <div>
            <input className="picker-search" placeholder="Search products to add" value={search} onChange={(e) => setSearch(e.target.value)} />
            <ul className="picker-list">
              {options.slice(0, 60).map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => setIds([...ids, p.id])}>
                    <Image src={p.image || "/images/fallback.svg"} alt="" width={36} height={45} unoptimized />
                    <span>{p.name}<small>{p.category}{p.status === "draft" ? " · draft" : ""}</small></span>
                    <b>Add</b>
                  </button>
                </li>
              ))}
              {!options.length && <li className="muted">No more products match.</li>}
            </ul>
          </div>
          <ol className="picker-list chosen">
            {ids.map((id, i) => {
              const p = byId.get(id);
              if (!p) return null;
              return (
                <li key={id}>
                  <span className="picked">
                    <Image src={p.image || "/images/fallback.svg"} alt="" width={36} height={45} unoptimized />
                    <span>{p.name}<small>{p.category}</small></span>
                    <button type="button" className="icon-button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
                    <button type="button" className="icon-button" aria-label="Move down" disabled={i === ids.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
                    <button type="button" className="icon-button" aria-label={`Remove ${p.name}`} onClick={() => setIds(ids.filter((x) => x !== id))}><X size={14} /></button>
                  </span>
                </li>
              );
            })}
            {!ids.length && <li className="muted">Pick products from the list.</li>}
          </ol>
        </div>
      </section>

      <div className="save-bar">
        {collection &&
          (confirm ? (
            <span className="confirm">
              Delete this collection? Products are kept.
              <button type="button" className="text-link danger" disabled={pending} onClick={() => start(async () => { const r = await deleteCollection(collection.id); if (r && !r.ok) setMsg({ ok: false, text: r.message }); })}>Yes, delete</button>
              <button type="button" className="text-link" onClick={() => setConfirm(false)}>Cancel</button>
            </span>
          ) : (
            <button type="button" className="text-link danger" onClick={() => setConfirm(true)}>Delete collection</button>
          ))}
        <FormMessage msg={msg} />
        <button className="button" disabled={pending || !title || !slug}>{pending ? "Saving…" : "Save collection"}</button>
      </div>
    </form>
  );
}
