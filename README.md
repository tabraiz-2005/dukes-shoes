# DUKES Designer Shoes — online store

Next.js 16 storefront, admin and checkout for DUKES: handmade leather dress shoes, sandals, chappal, belts and wallets. Products, stock and orders live in **Supabase**; the site deploys to **Vercel** from **GitHub**.

| Part | What it does |
| --- | --- |
| Storefront `/` | Home, category pages, product pages, bag, wishlist |
| Checkout `/checkout` | Cash on delivery. The database recalculates prices, delivery and stock, so the browser cannot change a price |
| Order page `/order/…` | Confirmation with order number and summary |
| Admin `/admin` | Sign-in, dashboard, orders (confirm, ship, deliver, cancel with stock returned), products (photos, colours, sizes, prices, stock), delivery settings |

Without Supabase keys the site runs in **demo mode** with sample products; checkout and admin stay disabled.

---

## 1. Run it on your Mac (demo mode)

```bash
cd ~/Desktop/Dukes/dukes
npm ci
npm run dev
```

Open http://localhost:3000. Needs Node.js 20.9 or newer.

## 2. Create the Supabase project

1. Sign in at https://supabase.com and choose **New project**. Pick the region closest to your customers (for Pakistan: Mumbai or Singapore). Save the database password somewhere safe.
2. Open **SQL Editor → New query**, paste the whole of `supabase/migrations/0001_init.sql`, and select **Run**. This creates the tables, security rules, order functions and the `product-images` photo bucket.
3. New query again: paste `supabase/seed.sql` and **Run**. This loads the 5 categories and the 20 starting products (edit, replace or archive them later in the admin).
4. New query again: paste `supabase/migrations/0002_sale_prices.sql` and **Run**. This adds sale ("was") prices.

All three files are safe to run twice. Future updates will add more numbered files in `supabase/migrations/`; run each new one once, in order.

## 3. Connect the site to Supabase

In Supabase open **Project Settings → API** (or **Data API**) and copy the **Project URL** and the **anon / publishable** key. In the project folder:

```bash
cp .env.example .env.local
```

Open `.env.local` and paste the two values, then restart `npm run dev`. The store now reads from Supabase.

The anon key is designed to be public. **Never** put the `service_role` key in this project or in Vercel; the site does not need it.

## 4. Create your admin account

1. Supabase → **Authentication → Users → Add user → Create new user**. Enter your email and a strong password and tick **Auto Confirm User**.
2. SQL Editor, run (with your email):

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

3. Supabase → **Authentication → Sign In / Providers**: turn **off** “Allow new users to sign up”. Only you need an account.
4. Go to http://localhost:3000/admin and sign in.

## 5. Put it on GitHub

The project is already a Git repository with a first commit. Create an **empty** private repository on GitHub (no README), then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/dukes-store.git
git branch -M main
git push -u origin main
```

`.env.local` is ignored by Git, so your keys are not uploaded.

## 6. Deploy on Vercel

1. https://vercel.com → **Add New → Project → Import** your GitHub repository. Vercel detects Next.js; keep the defaults.
2. Under **Environment Variables** add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the same values as `.env.local`.
3. Select **Deploy**. Every later `git push` to `main` redeploys automatically.
4. Back in Supabase → **Authentication → URL Configuration**, set **Site URL** to your Vercel address (and later your own domain).
5. To use your own domain: Vercel → Project → **Settings → Domains**.

## 7. Running the store

- **Add a product**: Admin → Products → **New product**. Fill in the name and category, choose sizes, add colours, set price and stock (use “Price for all” and “Stock for all” to fill quickly), upload photos per colour, choose **Live**, and select **Save product**. It appears in the store within seconds.
- **Photos**: JPEG, PNG or WebP. Large photos are resized to 2000px in your browser before upload. The first photo of the first colour is the main product image.
- **Orders**: Admin → Orders. Call the customer, then **Mark as confirmed → shipped → delivered**. **Cancel order** returns the stock.
- **Delivery charges**: Admin → Settings. Also update the announcement text in `src/config/store.ts`.
- **Hide a product**: set it to Draft or Archived. Deleting keeps past orders intact.

## Themes

The store has a **black** theme (default) and a **white** theme. Visitors switch with the sun/moon button next to the bag; the choice is remembered on their device. The admin always uses the black theme.

## Sale prices

In Admin → Products, fill **Was, Rs** for a size (or use **Was price for all**). The store then shows the price in red with the old price struck through and the percentage off, adds a **Sale** tag, and lists the piece on the **Sale** page (`/shop?sale=1`, linked in the menu whenever something is on sale). Clear the field to end the sale.

## Brand

| Token | Value | Use |
| --- | --- | --- |
| Jet black | `#000000` | Background (black theme), top bar and footer (both themes) |
| White | `#ffffff` | Background (white theme) |
| Gold | `#d4a645`, gradient `#f7dc87` → `#d4a645` → `#a67a22` | Wordmark, buttons, prices, active states |
| Red | `#c8102e` (white theme), `#ff4d5e` (black theme) | Sale prices, Sale tags, Sale link |
| Ivory | `#f4f2ee` | Text |

Colours are CSS variables at the top of `src/app/globals.css`. Fonts: **Geist** for all text (a clean modern grotesk in the style of cicero.pk) and **Montserrat** for the DUKES wordmark, matching the logo. Both are self-hosted (SIL Open Font License). The lion emblem is `public/brand/lion.png`, cut from a small copy of the logo; replace it with a vector export for sharper results.

## Project map

| Path | Contents |
| --- | --- |
| `src/app/(store)/` | Storefront pages, checkout action, order page |
| `src/app/admin/` | Admin pages and server actions |
| `src/components/` | Storefront components; `admin/` for the admin |
| `src/lib/catalog/source.ts` | Loads the catalogue from Supabase (or demo data) |
| `src/lib/supabase/` | Supabase clients |
| `src/proxy.ts` | Keeps the admin session fresh, redirects to sign-in |
| `supabase/migrations/0001_init.sql` | Database schema, security and functions |
| `supabase/seed.sql` | Starting catalogue (regenerate with `npx tsx scripts/generate-seed.ts`) |
| `src/data/catalog.ts` | Demo catalogue used when Supabase is not connected |

## Checks

```bash
npm run lint
npm run typecheck
npm run build
npm test                      # storefront tests in demo mode
LIVE=1 ADMIN_EMAIL=… ADMIN_PASSWORD=… npx playwright test tests/live.spec.ts
```

The live tests place a real order and create and delete a product, so run them only against a test project, never your real store.

## Before launch

- Replace the demo products and photos (several are illustrations) with your real range.
- Confirm delivery charge, free-delivery threshold, exchange policy, contact details and the footer pages.
- Card and wallet payments (JazzCash, Easypaisa, cards) need a merchant account; see ROADMAP.md.
