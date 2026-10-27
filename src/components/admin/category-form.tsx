"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { deleteCategory, saveCategory } from "@/app/admin/actions";
import { FormMessage, ImageField } from "./image-field";

export type CategoryRecord = {
  id: string;
  name: string;
  description: string;
  image: string | null;
  sort: number;
  subcategories: { slug: string; name: string }[];
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function CategoryForm({ category, notice }: { category: CategoryRecord | null; notice?: string }) {
  const router = useRouter();
  const isNew = !category;
  const [name, setName] = useState(category?.name ?? "");
  const [id, setId] = useState(category?.id ?? "");
  const [idTouched, setIdTouched] = useState(!isNew);
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState<string | null>(category?.image ?? null);
  const [sort, setSort] = useState(String(category?.sort ?? 10));
  const [subs, setSubs] = useState(category?.subcategories ?? []);
  const [newSub, setNewSub] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(notice ? { ok: true, text: notice } : null);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();

  function addSub() {
    const n = newSub.trim();
    const s = slugify(n);
    if (!n || !s || subs.some((x) => x.slug === s)) return;
    setSubs([...subs, { slug: s, name: n }]);
    setNewSub("");
  }
  function moveSub(i: number, d: -1 | 1) {
    const next = [...subs];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setSubs(next);
  }

  function save() {
    setMsg(null);
    start(async () => {
      const r = await saveCategory({ isNew, id, name, description, image, sort: Number(sort) || 0, subcategories: subs });
      if (!r.ok) return setMsg({ ok: false, text: r.message });
      if (isNew) router.replace(`/admin/categories/${r.id}?created=1`);
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
            <span>Name</span>
            <input value={name} maxLength={60} required onChange={(e) => { setName(e.target.value); if (!idTouched) setId(slugify(e.target.value)); }} />
          </label>
          <label className="field">
            <span>Web address</span>
            <input value={id} disabled={!isNew} onChange={(e) => { setIdTouched(true); setId(slugify(e.target.value)); }} />
            <small className="muted">
              /shop?category={id || "…"}
              {!isNew && " — fixed once created, so existing links keep working."}
            </small>
          </label>
          <label className="field">
            <span>Short description</span>
            <textarea rows={3} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="field narrow-field">
            <span>Position in menu</span>
            <input inputMode="numeric" value={sort} onChange={(e) => setSort(e.target.value.replace(/[^\d]/g, ""))} />
            <small className="muted">Lower numbers come first.</small>
          </label>
        </section>
        <section className="panel">
          <ImageField label="Category photo" value={image} onChange={setImage} folder="categories" hint="Shown on the category tiles. Portrait, 4:5." />
        </section>
      </div>

      <section className="panel">
        <h2>Groups inside this category</h2>
        <p className="muted">For example Oxfords, Loafers and Derbies inside Dress shoes. Customers can filter by these.</p>
        <ul className="chip-list">
          {subs.map((s, i) => (
            <li key={s.slug}>
              <input aria-label={`Name for ${s.slug}`} value={s.name} onChange={(e) => setSubs(subs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <small className="muted">{s.slug}</small>
              <button type="button" className="icon-button" aria-label="Move up" disabled={i === 0} onClick={() => moveSub(i, -1)}><ArrowUp size={14} /></button>
              <button type="button" className="icon-button" aria-label="Move down" disabled={i === subs.length - 1} onClick={() => moveSub(i, 1)}><ArrowDown size={14} /></button>
              <button type="button" className="icon-button" aria-label={`Remove ${s.name}`} onClick={() => setSubs(subs.filter((_, j) => j !== i))}><X size={14} /></button>
            </li>
          ))}
        </ul>
        <div className="inline-add">
          <input value={newSub} placeholder="New group, e.g. Monk straps" onChange={(e) => setNewSub(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSub(); } }} />
          <button type="button" className="button outline-button" onClick={addSub}><Plus size={14} /> Add</button>
        </div>
      </section>

      <div className="save-bar">
        {!isNew &&
          (confirm ? (
            <span className="confirm">
              Delete this category?
              <button type="button" className="text-link danger" disabled={pending} onClick={() => start(async () => { const r = await deleteCategory(category.id); if (r && !r.ok) { setMsg({ ok: false, text: r.message }); setConfirm(false); } })}>Yes, delete</button>
              <button type="button" className="text-link" onClick={() => setConfirm(false)}>Cancel</button>
            </span>
          ) : (
            <button type="button" className="text-link danger" onClick={() => setConfirm(true)}>Delete category</button>
          ))}
        <FormMessage msg={msg} />
        <button className="button" disabled={pending || !name || !id}>{pending ? "Saving…" : "Save category"}</button>
      </div>
    </form>
  );
}
