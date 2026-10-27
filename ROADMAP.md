# DUKES roadmap

## 1. Storefront — done
Black, gold and red theme from the DUKES logo; Geist + Montserrat; categories (Dress Shoes, Sandals, Chappal, Belts, Wallets) with types; mega menu; filters; product pages with colour-specific photos; bag and wishlist.

## 2. Admin — done
Supabase Auth sign-in with an admin role; dashboard (pending orders, 30-day sales, low stock); product editor (colours, sizes, price, stock, SKU, photos uploaded to Supabase Storage, Live/Draft/Archived, Our picks, New); orders (confirm, ship, deliver, cancel with stock returned); delivery settings.

## 3. Supabase — done
Schema, row-level security, photo bucket, `place_order` (locks stock, recalculates prices and delivery), `set_order_status`, `admin_save_product` (one transaction). Verified against Postgres 16 with Supabase Auth and PostgREST.

## 4. Commerce — partly done
- [x] Cash on delivery checkout and order confirmation page
- [ ] Order notification to the store (email or WhatsApp) — needs an email provider (e.g. Resend) or WhatsApp Business API
- [ ] Customer SMS/email confirmation
- [ ] Online payments: JazzCash / Easypaisa / card gateway (needs merchant account)
- [ ] Courier integration (TCS, Leopards, PostEx) and tracking numbers
- [ ] Discount codes and sale prices

## 5. Launch — next
- [ ] Deploy to Vercel and connect the domain (README steps 5 and 6)
- [ ] Real product photos and range; remove demo products
- [ ] Policy pages: delivery, exchanges, privacy, terms; contact page
- [ ] SEO: sitemap, product structured data, Open Graph images
- [ ] Analytics (Vercel Analytics or GA4) and Meta pixel
- [ ] Rate limiting on checkout (e.g. Vercel Firewall rule) once traffic grows
