# Validation log, revision 4 (October 27, 2026)

## Code
- `npm run lint`, `npm run typecheck`, `npm run build`: pass.

## Database (Postgres 16, Supabase Auth v2.169, PostgREST v12.2)
`supabase/migrations/0001_init.sql` and `supabase/seed.sql` applied twice without errors (idempotent). Checked as anonymous, customer and admin roles:
- Anonymous users read only live products; cannot read orders or write products or stock.
- `place_order` rejects an empty or missing cart, invalid items, quantities over 10, bad phone numbers, sold-out sizes and draft products; decrements stock; computes subtotal, delivery and total from the database.
- Customers cannot make themselves admin; only admins can upload photos, change orders or save products.
- Cancelling an order returns stock; a cancelled order cannot be reopened.
- `admin_save_product` creates, edits (stock change, size removed, size added) and rejects invalid slugs in one transaction.
- Bug found and fixed during testing: a null item list could create an empty order.

## Browser tests (Playwright, Chromium)
- Demo mode, `tests/storefront.spec.ts`: 9 of 9 pass (shopping flow, sold-out handling, wishlist, storage recovery, filters, search, 404, mega menu, layouts at 390/768/1440px, dialogs).
- Live against the local Supabase stack, `tests/live.spec.ts`: 4 of 4 pass (cash-on-delivery checkout with validation and confirmation page; admin sign-in rejects a wrong password; admin confirms then cancels an order; admin creates a product that appears in the store, then deletes it).

## Not tested here
- Photo upload to Supabase Storage (the Storage service was not available locally; the storage security rules were tested in SQL).
- A real Supabase cloud project and Vercel deployment.
- Safari, Firefox, real phones; screen-reader audit.
