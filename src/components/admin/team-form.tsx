"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setMemberRole } from "@/app/admin/actions";
import { FormMessage } from "./image-field";

type Role = "customer" | "staff" | "admin" | "owner";

export function AddMember() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await setMemberRole(email, role);
          setMsg({ ok: r.ok, text: r.ok ? `${email} added.` : r.message });
          if (r.ok) {
            setEmail("");
            router.refresh();
          }
        });
      }}
    >
      <label className="field">
        <span>Email</span>
        <input type="email" value={email} required onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
      </label>
      <label className="field">
        <span>Access</span>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
      </label>
      <FormMessage msg={msg} />
      <button className="button" disabled={pending || !email}>{pending ? "Adding…" : "Add to team"}</button>
    </form>
  );
}

export function RoleSelect({ email, role }: { email: string; role: Role }) {
  const router = useRouter();
  const [value, setValue] = useState<Role>(role);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <span className="role-select">
      <select
        aria-label={`Access for ${email}`}
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as Role;
          setError("");
          start(async () => {
            const r = await setMemberRole(email, next);
            if (r.ok) {
              setValue(next);
              router.refresh();
            } else setError(r.message);
          });
        }}
      >
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
        <option value="owner">Owner</option>
        <option value="customer">Remove access</option>
      </select>
      {error && <small className="field-error">{error}</small>}
    </span>
  );
}
