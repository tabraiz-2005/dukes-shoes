"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  FolderTree,
  House,
  Layers,
  LayoutGrid,
  Package,
  Percent,
  ReceiptText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

type Role = "customer" | "staff" | "admin" | "owner";
const RANK: Record<Role, number> = { customer: 0, staff: 1, admin: 2, owner: 3 };

const LINKS: { href: string; label: string; icon: LucideIcon; min: Role; badge?: "orders" }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid, min: "staff" },
  { href: "/admin/orders", label: "Orders", icon: ReceiptText, min: "staff", badge: "orders" },
  { href: "/admin/products", label: "Products", icon: Package, min: "admin" },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, min: "staff" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, min: "admin" },
  { href: "/admin/collections", label: "Collections", icon: Layers, min: "admin" },
  { href: "/admin/discounts", label: "Discounts", icon: Percent, min: "admin" },
  { href: "/admin/homepage", label: "Homepage", icon: House, min: "admin" },
  { href: "/admin/settings", label: "Store settings", icon: Settings, min: "admin" },
  { href: "/admin/team", label: "Team", icon: Users, min: "admin" },
];

export function AdminNav({ role, pending }: { role: Role; pending: number }) {
  const path = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin">
      {LINKS.filter((l) => RANK[role] >= RANK[l.min]).map(({ href, label, icon: Icon, badge }) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={active ? "active" : ""}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
            <span>{label}</span>
            {badge === "orders" && pending > 0 && (
              <b className="nav-badge" aria-label={`${pending} pending`}>
                {pending}
              </b>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
