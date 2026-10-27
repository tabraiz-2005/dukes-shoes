import { test, expect } from "@playwright/test";

const KEY = "dukes-store-v2";

test("shopping flow, variant limits, subtotal and persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("link", { name: "Shop the collection" }).click();
  await page
    .getByRole("navigation", { name: "Categories" })
    .last()
    .getByRole("link", { name: "Dress Shoes", exact: true })
    .click();
  await expect(page).toHaveURL(/category=dress-shoes/);
  await expect(page.locator(".result-count")).toHaveText("6 pieces");
  await page.getByRole("combobox", { name: "Sort by" }).selectOption("price-asc");
  await expect(page).toHaveURL(/sort=price-asc/);
  await page.getByRole("link", { name: "View Hamilton", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "39, sold out", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Add to bag" })).toBeDisabled();
  await page.getByRole("button", { name: "40", exact: true }).click();
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.getByRole("link", { name: "View bag" }).click();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.getByLabel("Quantity", { exact: true })).toHaveText("2");
  await expect(page.locator(".summary-line strong").first()).toContainText("104,000");
  await page.reload();
  await expect(page.getByLabel("Quantity", { exact: true })).toHaveText("2");
  for (let i = 0; i < 2; i++)
    await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(
    page.getByRole("button", { name: "Increase quantity" }),
  ).toBeDisabled();
  await page.goto("/products/hamilton");
  await page.getByRole("button", { name: "Oxblood", exact: true }).click();
  await page.getByRole("button", { name: "41", exact: true }).click();
  await expect(page.locator(".detail-price")).toContainText("55,000");
  await expect(page.locator(".main-product-photo img")).toHaveAttribute(
    "src",
    /brogue-oxblood/,
  );
  await page.getByRole("button", { name: "Add to bag" }).click();
  await page.goto("/cart");
  await expect(page.locator(".cart-item")).toHaveCount(2);
  await expect(page.locator(".summary-line strong").first()).toContainText("263,000");
  await page.getByRole("link", { name: "Checkout", exact: true }).click();
  await expect(page.locator(".demo-banner")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Demo — order submission unavailable" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test("one-size goods and sold-out colours", async ({ page }) => {
  await page.goto("/products/card-holder");
  await expect(page.getByRole("button", { name: "Add to bag" })).toBeEnabled();
  await page
    .getByRole("button", { name: "Oxblood, sold out", exact: true })
    .click();
  await expect(page.locator(".stock-message")).toContainText(
    "Oxblood is sold out",
  );
  await expect(page.getByRole("button", { name: "Add to bag" })).toBeDisabled();
});

test("wishlist save/remove persists", async ({ page }) => {
  await page.goto("/shop");
  await page
    .getByRole("button", { name: "Save Hamilton to wishlist", exact: true })
    .click();
  await page.goto("/wishlist");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Remove Hamilton from wishlist", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Nothing saved yet." }),
  ).toBeVisible();
});

test("corrupt and outdated storage recovers safely", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((k) => localStorage.setItem(k, "broken{"), KEY);
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Your bag is empty." }),
  ).toBeVisible();
  await page.evaluate(
    (k) =>
      localStorage.setItem(
        k,
        JSON.stringify({
          cart: [
            { productId: "unknown", variantId: "no", quantity: 3 },
            { productId: "p1", variantId: "p1-cognac-40", quantity: 999 },
            { productId: "p1", variantId: "p1-cognac-40", quantity: 2 },
            { productId: "p1", variantId: "p1-cognac-39", quantity: 2 },
          ],
          wishlist: ["p1", "missing", "p1"],
        }),
      ),
    KEY,
  );
  await page.reload();
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await expect(page.getByLabel("Quantity", { exact: true })).toHaveText("4");
  await page.goto("/wishlist");
  await expect(page.locator(".product-card")).toHaveCount(1);
});

test("filters, URL recovery, empty results, search and 404", async ({
  page,
}) => {
  await page.goto("/shop?category=belts&size=42&color=Noir");
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page.goto("/shop?category=belts&size=42&color=Noir&min=11000");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.goto("/shop?category=chappal&type=norozi");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.goto("/shop?q=nonexistentshoe");
  await expect(
    page.getByRole("heading", { name: "No pieces match these filters." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator(".product-card")).toHaveCount(20);
  await page.getByRole("button", { name: "Search the collection" }).click();
  await page
    .getByRole("textbox", { name: "Search shoes, chappal, belts and wallets" })
    .fill("Peshawari");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(3);
  const response = await page.goto("/products/unknown");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "We could not find that page." }),
  ).toBeVisible();
});

test("desktop mega menu reaches subcategories", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("link", { name: "Belts", exact: true }).first().hover();
  await page.getByRole("link", { name: "Dress belts", exact: true }).click();
  await expect(page).toHaveURL(/type=dress-belts/);
  await expect(page.locator(".product-card")).toHaveCount(2);
});

for (const width of [390, 768, 1440])
  test(`layout and dialogs at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/shop",
      "/shop?category=wallets",
      "/products/hamilton",
      "/products/peshawari-classic",
      "/cart",
      "/wishlist",
      "/checkout",
    ]) {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        path,
      ).toBe(true);
    }
    await page.goto("/products/hamilton");
    const trigger = page.getByRole("button", { name: "Size guide" });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();

    await page.goto("/shop?category=chappal");
    await page.getByRole("button", { name: /^Filters/ }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Tan", exact: true })
      .click();
    await page.getByRole("button", { name: "Show 1 piece" }).click();
    await expect(page.locator(".product-card")).toHaveCount(1);

    if (width < 1001) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Open menu" }),
      ).toBeFocused();
    }
  });
