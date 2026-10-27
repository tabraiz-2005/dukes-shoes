import Image from "next/image";
import Link from "next/link";
import { ExternalLink, LogOut, UserRound } from "lucide-react";
import { can, getMember, ROLE_LABEL } from "@/lib/admin/auth";
import { signOut } from "../actions";
import { AdminNav } from "@/components/admin/nav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const member = await getMember();
  if (!member || !can(member.role, "staff"))
    return (
      <main className="admin-setup">
        <h1>This account has no admin access</h1>
        <p>
          Signed in as {member?.user.email}. Ask the store owner to add this
          email in Admin, Team.
        </p>
        <form action={signOut}>
          <button className="button">Sign out</button>
        </form>
      </main>
    );
  const { count: pending } = await member.supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/admin" className="admin-brand">
          <Image src="/brand/lion-gold.png" alt="" width={600} height={820} />
          <span>
            DUKES <small>Admin</small>
          </span>
        </Link>
        <AdminNav role={member.role} pending={pending ?? 0} />
        <div className="admin-side-foot">
          <Link href="/" target="_blank" className="side-link">
            <ExternalLink size={16} strokeWidth={1.5} aria-hidden="true" />
            View store
          </Link>
          <div className="side-user">
            <UserRound size={16} strokeWidth={1.5} aria-hidden="true" />
            <span>
              {member.user.email}
              <small>{ROLE_LABEL[member.role]}</small>
            </span>
          </div>
          <form action={signOut}>
            <button className="side-link">
              <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
