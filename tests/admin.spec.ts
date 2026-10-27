import { test, expect, type Page } from "@playwright/test";

/** Admin upgrade tests against a live Supabase stack. Needs LIVE=1, ADMIN_* (owner) and STAFF_* accounts. */
test.skip(!process.env.LIVE, "Set LIVE=1 to run against Supabase");
test.describe.configure({ mode: "serial" });

const OWNER = { email: process.env.ADMIN_EMAIL ?? "", password: process.env.ADMIN_PASSWORD ?? "" };
const STAFF = { email: process.env.STAFF_EMAIL ?? "", password: process.env.STAFF_PASSWORD ?? "" };

async function signIn(page: Page, who: { email: string; password: string }) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

test("sidebar shows every section for the owner", async ({ page }) => {
  await signIn(page, OWNER);
  const nav = page.getByRole("navigation", { name: "Admin" });
  for (const l of ["Dashboard", "Orders", "Products", "Inventory", "Categories", "Collections", "Discounts", "Homepage", "Store settings", "Team"])
    await expect(nav.getByRole("link", { name: new RegExp(`^${l}`) })).toBeVisible();
  await expect(page.locator(".side-user")).toContainText(OWNER.email);
  await expect(page.locator(".side-user")).toContainText("Owner");
});

test("products list has tabs, search and category filter", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/admin/products");
  await expect(page.getByRole("link", { name: "Live", exact: true })).toBeVisible();
  await page.getByPlaceholder("Search name or SKU").fill("hamilton");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page.locator(".admin-table tbody tr")).toHaveCount(1);
  await page.goto("/admin/products?category=wallets");
  const rows = page.locator(".admin-table tbody tr td:nth-child(3)");
  await expect(rows.first()).toHaveText("Wallets");
  await page.goto("/admin/products?tab=archived");
  await expect(page.getByText("No products match")).toBeVisible();
});

test("homepage headline edit goes live", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/admin/homepage");
  await expect(page.getByText("Photo 1")).toBeVisible();
  const title = page.getByLabel("Headline", { exact: true });
  const before = await title.inputValue();
  await title.fill("Made by hand in Lahore");
  await page.getByRole("button", { name: "Save homepage" }).click();
  await expect(page.getByText("Homepage saved")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Made by hand in Lahore" })).toBeVisible();
  // Restore.
  await page.goto("/admin/homepage");
  await page.getByLabel("Headline", { exact: true }).fill(before);
  await page.getByRole("button", { name: "Save homepage" }).click();
  await expect(page.getByText("Homepage saved")).toBeVisible();
});

test("store settings update the announcement bar", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/admin/settings");
  const box = page.getByLabel("Announcement bar");
  const before = await box.inputValue();
  await box.fill("Eid delivery cut-off: order by 5 April.");
  await page.getByRole("button", { name: "Save store details" }).click();
  await expect(page.getByText("Store details saved.")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("Eid delivery cut-off: order by 5 April.")).toBeVisible();
  await page.goto("/admin/settings");
  await page.getByLabel("Announcement bar").fill(before);
  await page.getByRole("button", { name: "Save store details" }).click();
  await expect(page.getByText("Store details saved.")).toBeVisible();
});

test("discount code created in admin works at checkout", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/admin/discounts/new");
  await page.getByRole("textbox", { name: /^Code/ }).fill("TEST15");
  await page.getByLabel("Percent off").fill("15");
  await page.getByRole("button", { name: "Save code" }).click();
  await expect(page.getByText("Discount created")).toBeVisible();
  await page.goto("/admin/discounts");
  await expect(page.getByRole("link", { name: "TEST15" })).toBeVisible();

  await page.goto("/products/hamilton");
  await page.getByRole("button", { name: "41", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/checkout");
  await page.getByLabel("Discount code").fill("nope99");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.locator(".discount-box .field-error")).toBeVisible();
  await page.getByLabel("Discount code").fill("test15");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.locator(".discount-line")).toContainText("TEST15");

  // Clean up the code.
  await page.goto("/admin/discounts");
  await page.getByRole("link", { name: "TEST15" }).click();
  await page.getByRole("button", { name: "Delete code" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page).toHaveURL(/\/admin\/discounts$/);
  await expect(page.getByRole("link", { name: "TEST15" })).toHaveCount(0);
});

test("collection editor saves products", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/admin/collections");
  await page.getByRole("link", { name: /The loafer edit/ }).click();
  await expect(page.getByRole("heading", { name: "The loafer edit" })).toBeVisible();
  const chosen = page.locator(".picker-list.chosen li");
  const n = await chosen.count();
  await page.locator(".picker-list:not(.chosen) button").first().click();
  await expect(chosen).toHaveCount(n + 1);
  await page.getByRole("button", { name: "Save collection" }).click();
  await expect(page.getByText("Collection saved.")).toBeVisible();
  await page.reload();
  await expect(chosen).toHaveCount(n + 1);
  await chosen.last().getByRole("button", { name: /Remove/ }).click();
  await page.getByRole("button", { name: "Save collection" }).click();
  await expect(page.getByText("Collection saved.")).toBeVisible();
});

test("category editor adds and removes a group", async ({ page }) => {
  await signIn(page, OWNER);
  await page.goto("/admin/categories");
  await page.getByRole("link", { name: /Dress shoes/i }).click();
  await page.getByPlaceholder("New group").fill("Monk straps");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Save category" }).click();
  await expect(page.getByText("Category saved.")).toBeVisible();
  await page.goto("/admin/categories");
  await expect(page.getByText(/Monk straps/)).toBeVisible();
  await page.getByRole("link", { name: /Dress shoes/i }).click();
  await page.getByRole("button", { name: "Remove Monk straps" }).click();
  await page.getByRole("button", { name: "Save category" }).click();
  await expect(page.getByText("Category saved.")).toBeVisible();
});

test("staff can edit stock but not reach admin-only pages", async ({ page }) => {
  test.skip(!STAFF.email, "Set STAFF_EMAIL / STAFF_PASSWORD");
  await signIn(page, STAFF);
  const nav = page.getByRole("navigation", { name: "Admin" });
  await expect(nav.getByRole("link", { name: "Inventory" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Products" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Discounts" })).toHaveCount(0);
  await page.goto("/admin/discounts");
  await expect(page.getByRole("heading", { name: "Admins only" })).toBeVisible();

  await page.goto("/admin/inventory?q=HAM");
  const input = page.locator(".stock-input input").first();
  const before = await input.inputValue();
  await input.fill("7");
  await input.press("Enter");
  await expect(page.locator(".stock-input small").first()).toHaveText("Saved");
  await page.reload();
  await expect(page.locator(".stock-input input").first()).toHaveValue("7");
  await page.locator(".stock-input input").first().fill(before);
  await page.locator(".stock-input input").first().press("Enter");
  await expect(page.locator(".stock-input small").first()).toHaveText("Saved");
});
