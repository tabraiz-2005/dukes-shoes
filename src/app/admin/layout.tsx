import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | DUKES Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured())
    return (
      <main className="admin-setup">
        <h1>Connect Supabase to use the admin</h1>
        <p>
          Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>{" "}
          (or to your Vercel project settings), then restart the server. The
          README explains each step.
        </p>
      </main>
    );
  return <div className="admin-root">{children}</div>;
}
