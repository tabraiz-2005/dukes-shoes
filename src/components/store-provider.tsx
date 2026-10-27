"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";
import type { Catalog } from "@/services/catalog";
import { useCatalog } from "./catalog-provider";

const KEY = "dukes-store-v2";

/** Drops unknown or sold-out variants, merges duplicates and caps quantities at stock. */
function cleanCart(value: unknown, getVariant: Catalog["getVariant"]): CartItem[] {
  if (!Array.isArray(value)) return [];
  const merged = new Map<string, CartItem>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const v = getVariant(item.variantId);
    if (
      !v ||
      v.variant.stock < 1 ||
      item.productId !== v.product.id ||
      !Number.isFinite(item.quantity)
    )
      continue;
    const quantity = Math.min(
      v.variant.stock,
      10,
      Math.max(1, Math.floor(item.quantity)) +
        (merged.get(v.variant.id)?.quantity ?? 0),
    );
    merged.set(v.variant.id, {
      productId: v.product.id,
      variantId: v.variant.id,
      quantity,
    });
  }
  return [...merged.values()];
}

type State = {
  hydrated: boolean;
  cart: CartItem[];
  wishlist: string[];
  add: (id: string, q: number) => void;
  quantity: (id: string, q: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  toggle: (id: string) => void;
  subtotal: number;
  count: number;
};

const Context = createContext<State | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { getVariant, getProductById } = useCatalog();
  const [hydrated, setHydrated] = useState(false),
    [cart, setCart] = useState<CartItem[]>([]),
    [wishlist, setWishlist] = useState<string[]>([]);

  // One-time client hydration: server and first client render stay neutral.
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "{}");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate browser-only storage after matching initial renders
      setCart(cleanCart(data?.cart, getVariant));
      setWishlist(
        Array.isArray(data?.wishlist)
          ? [
              ...new Set<string>(
                data.wishlist.filter(
                  (x: unknown) => typeof x === "string" && getProductById(x),
                ),
              ),
            ]
          : [],
      );
    } catch {
      /* invalid data falls back to an empty state */
    }
    setHydrated(true);
  }, [getVariant, getProductById]);

  useEffect(() => {
    if (hydrated)
      try {
        localStorage.setItem(KEY, JSON.stringify({ cart, wishlist }));
      } catch {
        /* blocked or full storage: the session keeps working */
      }
  }, [cart, wishlist, hydrated]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, i) =>
          sum + (getVariant(i.variantId)?.variant.price ?? 0) * i.quantity,
        0,
      ),
    [cart, getVariant],
  );

  const add = useCallback(
    (id: string, q: number) => {
      const v = getVariant(id);
      if (v && v.variant.stock > 0 && Number.isFinite(q))
        setCart((old) =>
          cleanCart(
            [...old, { productId: v.product.id, variantId: id, quantity: q }],
            getVariant,
          ),
        );
    },
    [getVariant],
  );

  const value: State = {
    hydrated,
    cart,
    wishlist,
    add,
    quantity: (id, q) =>
      setCart((old) =>
        cleanCart(
          old.map((i) => (i.variantId === id ? { ...i, quantity: q } : i)),
          getVariant,
        ),
      ),
    remove: (id) => setCart((old) => old.filter((i) => i.variantId !== id)),
    clear: () => setCart([]),
    toggle: (id) => {
      if (getProductById(id))
        setWishlist((old) =>
          old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
        );
    },
    subtotal,
    count: cart.reduce((n, i) => n + i.quantity, 0),
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useStore() {
  const c = useContext(Context);
  if (!c) throw Error("StoreProvider missing");
  return c;
}
