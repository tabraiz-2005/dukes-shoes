"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Package, ReceiptText, Settings, Store } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
            <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
      <Link href="/" target="_blank">
        <Store size={17} strokeWidth={1.5} aria-hidden="true" />
        View store
      </Link>
    </nav>
  );
}
