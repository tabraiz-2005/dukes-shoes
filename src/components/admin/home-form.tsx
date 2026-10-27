"use client";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { saveHome } from "@/app/admin/actions";
import type { HomeContent } from "@/types";
import { FormMessage, ImageField } from "./image-field";

const LINKS = [
  ["Shop all", "/shop"],
  ["Dress shoes", "/shop?category=dress-shoes"],
  ["Sandals", "/shop?category=sandals"],
  ["Chappal", "/shop?category=chappal"],
  ["Belts", "/shop?category=belts"],
  ["Wallets", "/shop?category=wallets"],
  ["Sale", "/shop?sale=1"],
  ["New arrivals", "/shop?sort=new"],
];

export function HomeForm({ initial }: { initial: HomeContent }) {
  const [home, setHome] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof HomeContent>(k: K, v: HomeContent[K]) => setHome((h) => ({ ...h, [k]: v }));
  const images = home.images;

  function setImage(i: number, url: string | null) {
    const next = [...images];
    if (url) next[i] = { url, alt: next[i]?.alt ?? "" };
    else next.splice(i, 1);
    set("images", next);
  }
  function move(i: number, dir: -1 | 1) {
    const next = [...images];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set("images", next);
  }

  return (
    <form
      className="admin-form"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await saveHome(home);
          setMsg({ ok: r.ok, text: r.ok ? (r.message ?? "Saved.") : r.message });
        });
      }}
    >
      <section className="panel">
        <h2>Hero images</h2>
        <p className="muted">
          One to three photos, shown side by side on large screens. Portrait photos (4:5) look best. The first photo is shown on phones.
        </p>
        <div className="hero-slots">
          {[0, 1, 2].map((i) =>
            i < images.length || i === images.length ? (
              <div key={i} className="hero-slot">
                {i < images.length ? (
                  <>
                    <ImageField
                      label={`Photo ${i + 1}`}
                      value={images[i].url}
                      onChange={(url) => setImage(i, url)}
                      folder="homepage"
                    />
                    <label className="field">
                      <span>Description (for screen readers)</span>
                      <input
                        value={images[i].alt}
                        maxLength={200}
                        placeholder="Black horsebit loafers on velvet"
                        onChange={(e) => {
                          const next = [...images];
                          next[i] = { ...next[i], alt: e.target.value };
                          set("images", next);
                        }}
                      />
                    </label>
                    <div className="slot-move">
                      <button type="button" className="icon-button" aria-label="Move left" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowLeft size={16} />
                      </button>
                      <button type="button" className="icon-button" aria-label="Move right" disabled={i === images.length - 1} onClick={() => move(i, 1)}>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <ImageField label={`Photo ${i + 1}`} value={null} onChange={(url) => setImage(i, url)} folder="homepage" hint="Optional" />
                )}
              </div>
            ) : (
              <div key={i} className="hero-slot placeholder" aria-hidden="true">
                <Plus size={18} />
              </div>
            ),
          )}
        </div>
      </section>

      <section className="panel">
        <h2>Headline</h2>
        <div className="field-row">
          <label className="field">
            <span>Small line above</span>
            <input value={home.eyebrow} maxLength={80} onChange={(e) => set("eyebrow", e.target.value)} placeholder="Autumn / Winter 2026" />
          </label>
          <label className="field">
            <span>Headline</span>
            <input value={home.title} maxLength={80} onChange={(e) => set("title", e.target.value)} required />
          </label>
        </div>
        <datalist id="store-links">
          {LINKS.map(([l, h]) => (
            <option key={h} value={h}>{l}</option>
          ))}
        </datalist>
        {(["primary", "secondary"] as const).map((k) => (
          <div className="field-row" key={k}>
            <label className="field">
              <span>{k === "primary" ? "Main button text" : "Second button text"}</span>
              <input value={home[k].label} maxLength={40} onChange={(e) => set(k, { ...home[k], label: e.target.value })} placeholder="Leave empty to hide" />
            </label>
            <label className="field">
              <span>Opens</span>
              <input list="store-links" value={home[k].href} maxLength={300} onChange={(e) => set(k, { ...home[k], href: e.target.value })} placeholder="/shop?category=dress-shoes" />
            </label>
          </div>
        ))}
      </section>

      <div className="save-bar">
        <FormMessage msg={msg} />
        <button className="button" disabled={pending}>{pending ? "Saving…" : "Save homepage"}</button>
      </div>
    </form>
  );
}
