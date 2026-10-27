"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { uploadImage } from "@/lib/admin/upload";

/** One image: upload, replace or remove. Used for categories, collections and the hero. */
export function ImageField({
  value,
  onChange,
  folder,
  label = "Image",
  hint,
  ratio = "4 / 5",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  hint?: string;
  ratio?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadImage(file, folder, 2400));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="image-field">
      <span className="image-field-label">{label}</span>
      <div className="image-field-box" style={{ aspectRatio: ratio }}>
        {value ? (
          <Image src={value} alt="" fill sizes="320px" unoptimized />
        ) : (
          <button type="button" className="image-field-empty" onClick={() => input.current?.click()} disabled={busy}>
            <ImagePlus size={22} strokeWidth={1.4} />
            {busy ? "Uploading…" : "Upload image"}
          </button>
        )}
      </div>
      {value && (
        <div className="image-field-actions">
          <button type="button" className="text-link" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? "Uploading…" : "Replace"}
          </button>
          <button type="button" className="text-link danger" onClick={() => onChange(null)} disabled={busy}>
            <Trash2 size={14} /> Remove
          </button>
        </div>
      )}
      {hint && <small className="muted">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Shared save bar message. */
export function FormMessage({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p className={msg.ok ? "form-ok" : "form-error"} role="status">
      {msg.text}
    </p>
  );
}
