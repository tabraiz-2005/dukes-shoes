import Image from "next/image";
import Link from "next/link";
import { getAdmin } from "@/lib/admin/auth";
import { signOut } from "../actions";
import { AdminNav } from "@/components/admin/nav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin?.isAdmin)
    return (
      <main className="admin-setup">
        <h1>This account is not an admin</h1>
        <p>
          Signed in as {admin?.user.email}. Ask the store owner to give this account
          the admin role (see the README, step 4).
        </p>
        <form action={signOut}>
          <button className="button">Sign out</button>
        </form>
      </main>
    );
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link href="/admin" className="admin-brand">
          <Image src="/brand/lion.png" alt="" width={300} height={410} />
          <span>
            DUKES <small>Admin</small>
          </span>
        </Link>
        <AdminNav />
        <form action={signOut} className="admin-signout">
          <span>{admin.user.email}</span>
          <button className="text-link">Sign out</button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
