import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Returns a Supabase client acting as the signed-in admin.
 * Redirects to the login page when signed out; returns null for signed-in non-admins.
 */
export async function getAdmin() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { supabase, user, isAdmin: false as const };
  return { supabase, user, isAdmin: true as const };
}

/** For server actions: throws instead of rendering. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin?.isAdmin) throw new Error("Not authorised");
  return admin;
}
