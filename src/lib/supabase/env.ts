/**
 * Supabase settings come from environment variables (see .env.example).
 * Only the public URL and the anon/publishable key are needed: every write the
 * storefront makes goes through database functions protected by row-level security.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey);

export const CATALOG_TAG = "catalog";
export const PRODUCT_IMAGE_BUCKET = "product-images";
