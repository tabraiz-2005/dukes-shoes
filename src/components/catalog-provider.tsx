"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createCatalog, type Catalog } from "@/services/catalog";
import type { CatalogData } from "@/types";

const Context = createContext<Catalog | null>(null);

export function CatalogProvider({
  data,
  children,
}: {
  data: CatalogData;
  children: ReactNode;
}) {
  const catalog = useMemo(() => createCatalog(data), [data]);
  return <Context.Provider value={catalog}>{children}</Context.Provider>;
}

export function useCatalog() {
  const c = useContext(Context);
  if (!c) throw Error("CatalogProvider missing");
  return c;
}
