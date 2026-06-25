import { expect, test } from "@playwright/test";

test("legal gap separates cards", async ({ page }) => {
  await page.goto("/?scenario=legal-gap");

  const cards = page.locator('article[data-index-segment="legal"]');

  await expect(page.getByText("Lot Block")).toBeVisible();
  await expect(page.getByText("Metes Bounds")).toBeVisible();
  await expect(cards).toHaveCount(2);

  const first = await cards.nth(0).boundingBox();
  const second = await cards.nth(1).boundingBox();

  expect(first).toBeTruthy();
  expect(second).toBeTruthy();

  if (!first || !second) {
    throw new Error("Missing legal card bounds.");
  }

  expect(second.y - (first.y + first.height)).toBeGreaterThan(0);
});
