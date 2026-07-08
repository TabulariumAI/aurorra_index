import { expect, test } from "@playwright/test";

test("legal map content renders plat grid", async ({ page }) => {
  await page.goto("/?scenario=legal-map");

  await expect(page.locator("[data-legal-map-grid='true']")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Plat" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Close" })).toHaveCount(0);

  const layout = await page.locator("[data-legal-map-grid='true']").evaluate((node) => ({
    height: node.getBoundingClientRect().height,
    width: node.getBoundingClientRect().width,
  }));

  expect(layout.height).toBeGreaterThan(0);
  expect(layout.width).toBeGreaterThan(0);
});
