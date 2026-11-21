import { devices, expect, test } from "@playwright/test";

test.use({ ...devices["Desktop Edge"], channel: "msedge" });

for (const width of [390, 1440]) {
  for (const secondary of [false, true]) {
    test(`titles and Transaction jurisdiction render and navigate at ${width}px, secondary ${secondary}`, async ({ page, context }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width, height: 1000 });
      const jurisdiction = "Texas, Harris County — jurisdiction identified from the supplied document page";
      await page.goto(`/?scenario=metadata-summary&jurisdiction=${encodeURIComponent(jurisdiction)}${secondary ? "&secondary=1" : ""}`);
      expect(await page.evaluate(() => navigator.userAgent)).toContain("Edg/");
      const rows = page.getByRole("article");
      await expect(rows).toHaveCount(secondary ? 2 : 1);
      const labels = secondary ? ["Primary Title", "Secondary Title"] : ["Primary Title"];
      for (const [index, label] of labels.entries()) await expect(rows.nth(index).getByText(label, { exact: true })).toBeVisible();
      await expect(page.getByText(jurisdiction, { exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Titles", exact: true }).locator("..").locator(":scope > span")).toHaveText(secondary ? "2" : "1");
      const title = page.getByRole("link", { name: "Mortgage Satisfaction", exact: true });
      await title.focus();
      await expect(title).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#visual-stage")).toHaveAttribute("data-title-page", "2");
      if (secondary) {
        await page.getByRole("link", { name: "Release of Lien", exact: true }).click();
        await expect(page.locator("#visual-stage")).toHaveAttribute("data-title-page", "2");
      }
      const first = await rows.first().boundingBox();
      for (const row of await rows.all()) {
        await expect(row).toHaveClass(/metadata-row/);
        await expect(row).toHaveCSS("border-left-width", "0px");
        await expect(row).toHaveCSS("border-right-width", "0px");
        const box = await row.boundingBox();
        expect(box!.x).toBeCloseTo(first!.x, 0);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        expect(await row.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      }
      const label = await rows.first().locator(":scope > a").boundingBox();
      const value = await rows.first().locator(".metadata-row-value").boundingBox();
      if (width === 1440) {
        expect(value!.x).toBeGreaterThan(label!.x + label!.width);
        expect(value!.y).toBeLessThan(label!.y + label!.height);
      } else {
        expect(value!.x).toBeCloseTo(label!.x, 0);
        expect(value!.y).toBeGreaterThan(label!.y);
      }
      await expect(title).toHaveCSS("text-decoration-line", "none");
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await rows.first().hover();
      await rows.first().getByRole("button", { name: "Copy value Mortgage Satisfaction" }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("Mortgage Satisfaction");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`titles-${width}-${secondary}.png`), fullPage: true });
      await page.getByRole("button", { name: "Transactional", exact: true }).click();
      await expect(page.getByText(jurisdiction, { exact: true })).toBeVisible();
      const transaction = page.getByRole("article");
      await expect(transaction).toHaveCount(1);
      await transaction.hover();
      await transaction.getByRole("button", { name: `Copy value ${jurisdiction}` }).click();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(jurisdiction);
      expect(await transaction.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`transaction-${width}-${secondary}.png`), fullPage: true });
      await page.getByRole("button", { name: "Parties(Party Clause)", exact: true }).click();
      const party = page.locator(".metadata-row").first();
      const partyLabel = await party.locator(":scope > a").boundingBox();
      const partyValue = await party.locator(".metadata-row-value").boundingBox();
      expect(value!.x - label!.x).toBeCloseTo(partyValue!.x - partyLabel!.x, 0);
      expect(value!.y - label!.y).toBeCloseTo(partyValue!.y - partyLabel!.y, 0);
      await page.screenshot({ path: testInfo.outputPath(`parties-${width}-${secondary}.png`), fullPage: true });
      expect(errors).toEqual([]);
    });
  }

  test(`absent jurisdiction leaves labeled titles intact at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?scenario=metadata-summary&secondary=1");
    await expect(page.getByText("Primary Title", { exact: true })).toBeVisible();
    await expect(page.getByText("Secondary Title", { exact: true })).toBeVisible();
    await expect(page.getByText("Jurisdiction", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("article")).toHaveCount(2);
  });
}
