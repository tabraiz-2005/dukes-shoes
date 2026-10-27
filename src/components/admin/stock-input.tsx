"use client";
import { useState, useTransition } from "react";
import { setStock } from "@/app/admin/actions";

/** Inline stock editor: saves on Enter or when the field loses focus. */
export function StockInput({ id, stock, label }: { id: string; stock: number; label: string }) {
  const [value, setValue] = useState(String(stock));
  const [saved, setSaved] = useState(stock);
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");
  const [, start] = useTransition();

  function commit() {
    const n = Number(value);
    if (value === "" || !Number.isInteger(n) || n < 0) {
      setValue(String(saved));
      return;
    }
    if (n === saved) return;
    setState("saving");
    start(async () => {
      const r = await setStock(id, n);
      if (r.ok) {
        setSaved(n);
        setState("saved");
        setTimeout(() => setState(""), 1500);
      } else {
        setValue(String(saved));
        setState("error");
      }
    });
  }

  return (
    <span className={`stock-input ${Number(value) === 0 ? "zero" : Number(value) <= 3 ? "low" : ""}`}>
      <input
        aria-label={label}
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === "Escape") setValue(String(saved));
        }}
      />
      <small aria-live="polite">{state === "saving" ? "Saving" : state === "saved" ? "Saved" : state === "error" ? "Failed" : ""}</small>
    </span>
  );
}
