import "server-only";
import { createClient } from "@supabase/supabase-js";
import { CATALOG_TAG, supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Anonymous client for public reads (catalogue) and customer RPCs (place_order).
 * Catalogue reads are cached by Next.js and invalidated with the "catalog" tag
 * whenever the admin saves a product.
 */
export function createPublicClient({ cached = true } = {}) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          ...(cached
            ? { next: { tags: [CATALOG_TAG], revalidate: 300 } }
            : { cache: "no-store" }),
        }),
    },
  });
}
