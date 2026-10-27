import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

export type Role = "customer" | "staff" | "admin" | "owner";

const RANK: Record<Role, number> = { customer: 0, staff: 1, admin: 2, owner: 3 };

/** Staff handle orders and stock; admins run the store; owners also manage the team. */
export const can = (role: Role, min: Role) => RANK[role] >= RANK[min];

export const ROLE_LABEL: Record<Role, string> = {
  customer: "No access",
  staff: "Staff",
  admin: "Admin",
  owner: "Owner",
};

/**
 * The signed-in team member, with a Supabase client acting as them.
 * Redirects to the login page when signed out; null when Supabase is not configured.
 */
export async function getMember() {
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
  const role = ((profile?.role as Role) ?? "customer") satisfies Role;
  return { supabase, user, role };
}

/** For pages: returns the member when they have at least `min`, otherwise null. */
export async function getMemberWith(min: Role) {
  const m = await getMember();
  return m && can(m.role, min) ? m : null;
}

/** Older helper kept for existing pages: admin or owner. */
export async function getAdmin() {
  const m = await getMember();
  if (!m) return null;
  return { ...m, isAdmin: can(m.role, "admin") };
}

/** For server actions: throws instead of rendering. */
export async function requireRole(min: Role) {
  const m = await getMember();
  if (!m || !can(m.role, min)) throw new Error("Not authorised");
  return m;
}
export const requireAdmin = () => requireRole("admin");
export const requireStaff = () => requireRole("staff");
export const requireOwner = () => requireRole("owner");
