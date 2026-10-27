"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, ShoppingBag, Search, Menu } from "lucide-react";
import { useState } from "react";
import { store } from "@/config/store";
import { useCatalog } from "./catalog-provider";
import { useStore } from "./store-provider";
import { Modal, Photo } from "./ui";
import { ThemeToggle } from "./theme-toggle";

export function Wordmark({ footer = false }: { footer?: boolean }) {
  if (store.logo)
    return (
      <Image
        src={store.logo.src}
        alt={store.name}
        width={store.logo.width}
        height={store.logo.height}
        className="logo-image"
        priority={!footer}
      />
    );
  return (
    <span className="brand-lockup">
      <Image
        src="/brand/lion.png"
        alt=""
        width={300}
        height={410}
        className="brand-lion"
        priority={!footer}
      />
      <span className="brand-words">
        <span className="brand-name">{store.name}</span>
        <small>{store.tagline}</small>
      </span>
    </span>
  );
}

export function Header() {
  const s = useStore();
  const path = usePathname();
  const [menu, setMenu] = useState(false),
    [search, setSearch] = useState(false);
  const { getCategories, getProducts } = useCatalog();
  const categories = getCategories();
  const hasSale = getProducts({ sale: "1" }).length > 0;
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="announcement">
        <p>{store.announcement}</p>
      </div>
      <header className="header">
        <div className="header-start">
          <button
            className="icon-button nav-toggle"
            aria-label="Open menu"
            onClick={() => setMenu(true)}
          >
            <Menu size={22} strokeWidth={1.4} />
          </button>
          <Link className="wordmark" href="/" aria-label={`${store.name} home`}>
            <Wordmark />
          </Link>
        </div>
        <nav className="primary-nav" aria-label="Main navigation">
          <ul
            key={path}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a"))
                (document.activeElement as HTMLElement | null)?.blur();
            }}
          >
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/shop?category=${c.slug}`}>{c.name}</Link>
                <div className="mega">
                  <div className="mega-inner">
                    <div className="mega-links">
                      <Link href={`/shop?category=${c.slug}`}>
                        All {c.name.toLowerCase()}
                      </Link>
                      {c.subcategories.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/shop?category=${c.slug}&type=${sub.slug}`}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                    <p className="mega-copy">{c.description}</p>
                    <Link
                      className="mega-feature"
                      href={`/shop?category=${c.slug}`}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <span className="mega-photo">
                        <Photo src={c.image} alt="" sizes="220px" />
                      </span>
                      <span>
                        {getProducts({ category: c.id }).length} pieces
                      </span>
                    </Link>
                  </div>
                </div>
              </li>
            ))}
            {hasSale && (
              <li>
                <Link href="/shop?sale=1" className="nav-sale">
                  Sale
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button search-icon"
            aria-label="Search the collection"
            onClick={() => setSearch(true)}
          >
            <Search size={19} strokeWidth={1.4} />
          </button>
          <ThemeToggle />
          <Link className="icon-button wish-link" href="/wishlist" aria-label="Wishlist">
            <Heart size={19} strokeWidth={1.4} />
          </Link>
          <Link
            className="bag-link"
            href="/cart"
            aria-label={`Shopping bag, ${s.hydrated ? s.count : 0} items`}
          >
            <ShoppingBag size={19} strokeWidth={1.4} aria-hidden="true" />
            <span className="bag-label">Bag</span>
            <span className="bag-count">{s.hydrated ? s.count : 0}</span>
          </Link>
        </div>
      </header>
      <Modal open={menu} onClose={() => setMenu(false)} title="Menu" drawer left>
        <form action="/shop" className="menu-search" onSubmit={() => setMenu(false)}>
          <Search size={17} strokeWidth={1.4} aria-hidden="true" />
          <input name="q" placeholder="Search DUKES" aria-label="Search the collection" autoComplete="off" />
        </form>
        <nav className="menu-links" aria-label="Mobile categories">
          {categories.map((c) => (
            <details key={c.id}>
              <summary>{c.name}</summary>
              <Link
                href={`/shop?category=${c.slug}`}
                onClick={() => setMenu(false)}
              >
                All {c.name.toLowerCase()}
              </Link>
              {c.subcategories.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/shop?category=${c.slug}&type=${sub.slug}`}
                  onClick={() => setMenu(false)}
                >
                  {sub.name}
                </Link>
              ))}
            </details>
          ))}
          {hasSale && (
            <Link
              className="menu-plain menu-sale"
              href="/shop?sale=1"
              onClick={() => setMenu(false)}
            >
              Sale
            </Link>
          )}
          <Link
            className="menu-plain"
            href="/shop?sort=newest"
            onClick={() => setMenu(false)}
          >
            New arrivals
          </Link>
          <Link
            className="menu-plain"
            href="/wishlist"
            onClick={() => setMenu(false)}
          >
            Wishlist
          </Link>
        </nav>
      </Modal>
      <Modal open={search} onClose={() => setSearch(false)} title="Search">
        <form
          action="/shop"
          onSubmit={() => setSearch(false)}
          className="search-form"
        >
          <label htmlFor="global-search">
            Search shoes, chappal, belts and wallets
          </label>
          <div>
            <input
              id="global-search"
              name="q"
              placeholder="Peshawari, loafer, bifold"
              autoComplete="off"
            />
            <button className="button" type="submit">
              Search
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function Footer() {
  const categories = useCatalog().getCategories();
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link href="/" className="footer-logo" aria-label={`${store.name} home`}>
            <Wordmark footer />
          </Link>
          <p>
            Dress shoes, chappal and small leather goods, made by hand in pure
            leather.
          </p>
        </div>
        <div>
          <h2>Shop</h2>
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`}>
              {c.name}
            </Link>
          ))}
          <Link href="/shop?sort=newest">New arrivals</Link>
        </div>
        <div>
          <h2>Client care</h2>
          <p className="footer-note">Pages to follow before launch</p>
          {store.clientCare.map((x) => (
            <span key={x} className="footer-pending">
              {x}
            </span>
          ))}
        </div>
        <div>
          <h2>Visit the atelier</h2>
          <p>{store.contact.address}</p>
          <p>{store.contact.hours}</p>
          <p>{store.contact.whatsapp}</p>
          <p className="approval">{store.approvalLabel}</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {store.name}. Demonstration storefront.
        </span>
        <span>
          {store.legal.map((x) => (
            <span key={x} className="footer-pending">
              {x}
            </span>
          ))}
        </span>
      </div>
    </footer>
  );
}
