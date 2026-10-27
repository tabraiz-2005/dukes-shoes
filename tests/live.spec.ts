import { test, expect } from "@playwright/test";

/**
 * End-to-end tests against a real Supabase project (or a local Supabase stack).
 * Skipped unless LIVE=1. Needs the app built with NEXT_PUBLIC_SUPABASE_* set,
 * a seeded database, and ADMIN_EMAIL / ADMIN_PASSWORD for an admin account.
 */
test.skip(!process.env.LIVE, "Set LIVE=1 to run against Supabase");
test.describe.configure({ mode: "serial" });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
let orderNumber = "";

test("customer checks out with cash on delivery", async ({ page }) => {
  await page.goto("/products/hamilton");
  await page.getByRole("button", { name: "40", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/checkout");
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page.locator(".field-error").first()).toBeVisible();
  await page.getByLabel("Full name").fill("Ali Khan");
  await page.getByLabel("Phone").fill("0300 1234567");
  await page.getByLabel("Address").fill("House 12, Street 4, Model Town");
  await page.getByLabel("City").fill("Lahore");
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/order\//);
  await expect(page.getByRole("heading", { name: "Thank you, Ali." })).toBeVisible();
  orderNumber = (await page.locator(".order-number").innerText()).replace(/\D/g, "");
  await expect(page.locator(".summary-line.total strong")).toContainText("52,000");
  // The bag is emptied after ordering.
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Your bag is empty." })).toBeVisible();
});

test("admin area requires sign-in", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".form-error")).toContainText("do not match");
});

test("admin confirms and cancels the order", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.getByRole("link", { name: `#${orderNumber}` }).first().click();
  await expect(page.getByRole("heading", { name: `Order #${orderNumber}` })).toBeVisible();
  await page.getByRole("button", { name: "Mark as confirmed" }).click();
  await expect(page.getByRole("button", { name: "Mark as shipped" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel order" }).click();
  await page.getByRole("button", { name: "Cancel order" }).click();
  await expect(page.getByText("This order was cancelled and its stock returned.")).toBeVisible();
});

test("admin creates a product that appears in the store", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Products", exact: true }).click();
  await page.getByRole("link", { name: "Add product" }).click();
  await page.getByLabel("Product name").fill("Test Monk Strap");
  await page.getByLabel("Style line").fill("Double monk strap");
  await page.getByLabel("Category").selectOption("dress-shoes");
  await page.getByLabel("Price for all, Rs", { exact: true }).fill("38500");
  await page.getByRole("button", { name: "Apply" }).first().click();
  await page.getByLabel("Was price for all, Rs").fill("45000");
  await page.getByRole("button", { name: "Apply" }).nth(1).click();
  await page.getByLabel("Stock for all").fill("4");
  await page.getByRole("button", { name: "Apply" }).last().click();
  await page.getByText("Live", { exact: true }).click();
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText("Product saved.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}/);

  await page.goto("/products/test-monk-strap");
  await expect(page.getByRole("heading", { name: "Test Monk Strap" })).toBeVisible();
  await expect(page.locator(".detail-price .price-now")).toContainText("38,500");
  await expect(page.locator(".detail-price .price-was")).toContainText("45,000");

  // Clean up through the admin.
  await page.goBack();
  await page.getByRole("button", { name: "Delete this product" }).click();
  await page.getByRole("button", { name: "Delete product" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  const res = await page.goto("/products/test-monk-strap");
  expect(res?.status()).toBe(404);
});
