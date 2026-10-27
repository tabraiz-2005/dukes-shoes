import type { Metadata } from "next";
import { getMemberWith, ROLE_LABEL, type Role } from "@/lib/admin/auth";
import { AdminOnly } from "@/components/admin/denied";
import { AddMember, RoleSelect } from "@/components/admin/team-form";

export const metadata: Metadata = { title: "Team" };

const ABOUT: [Role, string][] = [
  ["owner", "Everything, including who is on the team."],
  ["admin", "Products, prices, homepage, collections, discounts and settings."],
  ["staff", "Orders and stock only. Cannot change prices or see discount codes."],
];

export default async function Team() {
  const me = await getMemberWith("admin");
  if (!me) return <AdminOnly />;
  const { data } = await me.supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .in("role", ["staff", "admin", "owner"])
    .order("created_at");
  const owner = me.role === "owner";
  return (
    <>
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">Store</p>
          <h1>Team</h1>
          <p className="muted">People who can sign in to this admin.{!owner && " Only the owner can change the team."}</p>
        </div>
      </header>
      <div className="form-columns wide-left">
        <div className="panel flush">
          <table className="admin-table">
            <thead><tr><th>Email</th><th>Access</th></tr></thead>
            <tbody>
              {(data ?? []).map((m) => (
                <tr key={m.id}>
                  <td>{m.email}{m.id === me.user.id && <small className="block muted">You</small>}</td>
                  <td>
                    {owner && m.id !== me.user.id ? (
                      <RoleSelect email={m.email ?? ""} role={m.role as Role} />
                    ) : (
                      <span className={`status ${m.role === "owner" ? "status-active" : ""}`}>{ROLE_LABEL[m.role as Role]}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          {owner && (
            <section className="panel">
              <h2>Add someone</h2>
              <AddMember />
              <p className="muted small-print">
                First create their login in Supabase: Authentication → Users → Add user → Create new user (tick “Auto confirm”). Then add their email here.
              </p>
            </section>
          )}
          <section className="panel">
            <h2>What each role can do</h2>
            <dl className="role-list">
              {ABOUT.map(([r, t]) => (
                <div key={r}><dt>{ROLE_LABEL[r]}</dt><dd>{t}</dd></div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
