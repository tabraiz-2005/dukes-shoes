"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, Minus, Plus } from "lucide-react";
export function Photo({
  src,
  alt,
  priority = false,
  className = "",
  sizes = "(max-width: 600px) 90vw, (max-width: 1000px) 50vw, 33vw",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      src={failed ? "/images/fallback.svg" : src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  drawer = false,
  left = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  drawer?: boolean;
  left?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const d = ref.current;
    if (!d || !open) return;
    const active = document.activeElement as HTMLElement;
    d.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d.close();
      document.body.style.overflow = previous;
      active?.focus();
    };
  }, [open]);
  return (
    <dialog
      aria-label={title}
      ref={ref}
      className={`modal${drawer ? " drawer" : ""}${left ? " drawer-left" : ""}`}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const nodes = [
          ...e.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
          ),
        ].filter((el) => el.getClientRects().length > 0);
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (!first) {
          e.preventDefault();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === e.currentTarget)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
      onClick={(e) => {
        if (e.target === ref.current) closeRef.current();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          aria-label={`Close ${title}`}
          className="icon-button"
          onClick={onClose}
        >
          <X size={20} strokeWidth={1.4} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Quantity({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="quantity">
      <button
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={14} strokeWidth={1.4} />
      </button>
      <output aria-label="Quantity">{value}</output>
      <button
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={14} strokeWidth={1.4} />
      </button>
    </div>
  );
}
