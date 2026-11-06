import { devices, expect, test } from "@playwright/test";

test.use({ ...devices["Desktop Edge"], channel: "msedge" });

for (const width of [390, 1440]) {
  test(`shows one index per code with matching counts and usable actions at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?scenario=metadata-duplicates");
    expect(await page.evaluate(() => navigator.userAgent)).toContain("Edg/");
    const rows = page.getByRole("article");
    await expect(rows).toHaveCount(2);
    await expect(page.locator('[data-index-code="owner"]')).toHaveCount(1);
    await expect(rows.first()).toContainText("CORONA OSCAR");
    await expect(page.getByText("Extracted owner", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Duplicate owner", { exact: true })).toHaveCount(0);
    await expect(page.locator("header").getByRole("definition")).toHaveText(["2", "0"]);
    await expect(page.getByRole("button", { name: "Parties(Party Clause)", exact: true }).locator("..")).toContainText("2");
    const summary = await page.getByText("Oscar Corona is the homeowner and owner of record.", { exact: true }).boundingBox();
    const first = await rows.first().boundingBox();
    expect(summary!.y + summary!.height).toBeLessThan(first!.y);
    for (const row of await rows.all()) {
      const box = await row.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await rows.first().getByRole("link", { name: "CORONA OSCAR", exact: true }).click();
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-title-page", "1");
    await rows.first().getByRole("button", { name: "Edit index", exact: true }).click();
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-edit-code", "owner");
    await page.screenshot({ path: testInfo.outputPath(`unique-indexes-${width}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}
