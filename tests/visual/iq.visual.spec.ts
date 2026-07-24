import { expect, test } from "@playwright/test";

test("IQ panel renders and clears failed gate", async ({ page }) => {
  await page.goto("/?scenario=iq");

  await expect(page.getByText("Indexing Quality (IQ)")).toBeVisible();
  await expect(page.getByText("90%")).toBeVisible();
  await expect(page.getByText("Indexing Segments (1)")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Party" })).toBeVisible();
  await expect(page.getByText("Compliance Gates (2)")).toBeVisible();
  await expect(page.getByText("Missing indexes: Party Address or Legal Description. Cue verification did not confirm the existence of required indexes.")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-gate-code='gate-fail']").getByRole("button", { name: "Clear gate" })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  const clear = page.locator("[data-gate-code='gate-fail']").getByRole("button", { name: "Clear gate" });
  await clear.click();
  await clear.click();
  await expect(page.locator("[data-gate-code='gate-fail']")).toHaveCount(0);
  await expect(page.getByText("Compliance Gates (1)")).toBeVisible();
});
