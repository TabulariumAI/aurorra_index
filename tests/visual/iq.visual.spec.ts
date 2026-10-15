import { expect, test } from "@playwright/test";

test("IQ panel renders and clears failed gate", async ({ page }) => {
  await page.goto("/?scenario=iq");

  await expect(page.getByText("Indexing Quality (IQ)")).toBeVisible();
  await expect(page.getByText("90%")).toBeVisible();
  await expect(page.getByText("Indexing Segments (5)")).toBeVisible();
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows).toHaveCount(6);
  await expect(rows.nth(1).getByRole("cell").first()).toHaveText("Sides");
  await expect(rows.nth(2).getByRole("cell").first()).toHaveText("Transaction");
  await expect(rows.nth(3).getByRole("cell").first()).toHaveText("Party");
  await expect(rows.nth(4).getByRole("cell").first()).toHaveText("Legal");
  await expect(rows.nth(5).getByRole("cell").first()).toHaveText("Reference");
  await expect(page.getByRole("cell", { name: "Party" })).toBeVisible();
  await expect(page.getByText("Compliance Gates (2)")).toBeVisible();
  await expect(page.getByText("Missing indexes: Party Address or Legal Description. Cue verification did not confirm the existence of required indexes.")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-gate-code='gate-fail']").getByRole("button", { name: "Clear gate" })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  const clear = page.locator("[data-gate-code='gate-fail']").getByRole("button", { name: "Clear gate" });
  await expect(clear).toHaveText("");
  await expect(clear.locator("svg")).toBeVisible();
  await clear.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Clear gate");
  await clear.focus();
  await page.keyboard.press("Enter");
  const confirm = page.locator("[data-gate-code='gate-fail']").getByRole("button", { name: "Confirm", exact: true });
  await expect(confirm).toBeVisible();
  await expect(confirm.locator("svg")).toBeVisible();
  await expect(confirm.locator("[data-confirm-progress]")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.locator("[data-gate-code='gate-fail']")).toHaveCount(0);
  await expect(page.getByText("Compliance Gates (1)")).toBeVisible();
});
