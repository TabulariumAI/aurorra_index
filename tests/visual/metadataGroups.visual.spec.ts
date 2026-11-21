import { devices, expect, test } from "@playwright/test";

test.use({ ...devices["Desktop Edge"], channel: "msedge" });

for (const width of [390, 1440]) {
  test(`execution visual verification sorts by aspect across pages at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?scenario=metadata-groups");
    expect(await page.evaluate(() => navigator.userAgent)).toContain("Edg/");
    await page.getByRole("button", { name: "Acknowledgment", exact: true }).click();
    const rows = page.getByRole("article");
    await expect(rows).toHaveCount(5);
    expect(await rows.evaluateAll(items => items.map(row => row.getAttribute("data-index-code")))).toEqual([
      "execution-date", "seal-1", "signature-2", "signature-1", "notary-1",
    ]);
    await expect(page.getByRole("heading", { level: 4 })).toHaveText(["Visual Verification", "Page 2"]);
    const heading = page.getByRole("heading", { name: "Visual Verification", exact: true });
    const headingBox = await heading.boundingBox();
    const rowBox = await rows.first().boundingBox();
    expect(headingBox!.x).toBeCloseTo(rowBox!.x, 0);
    expect(headingBox!.y + headingBox!.height).toBeLessThan(rowBox!.y);
    expect(await heading.evaluate(node => getComputedStyle(node).color)).toBe(
      await page.getByRole("heading", { name: "Page 2", exact: true }).evaluate(node => getComputedStyle(node).color),
    );
    for (const row of await rows.all()) {
      const box = await row.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      for (const button of await row.getByRole("button").all()) await expect(button).toBeVisible();
    }
    const signature = page.locator('[data-index-code="signature-2"]');
    await signature.getByRole("link", { name: "No", exact: true }).click();
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-title-page", "2");
    await signature.getByRole("button", { name: "Edit index", exact: true }).click();
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-edit-code", "signature-2");
    await signature.getByRole("button", { name: "Expand details", exact: true }).click();
    await expect(signature.getByText("Explanation: Blank signature line.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Reprocess", exact: true }).click();
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-reprocess-segment", "acknowledgment");
    await page.getByRole("button", { name: "Add Index", exact: true }).click();
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-add-segment", "acknowledgment");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`visual-verification-${width}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });

  test(`pages, titles and endorsements have no grouping at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?scenario=metadata-groups");
    for (const [section, count] of [["Pages", 2], ["Titles", 1], ["Endorsements", 3]] as const) {
      await page.getByRole("button", { name: section, exact: true }).click();
      await expect(page.getByRole("group")).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 4 })).toHaveCount(0);
      await expect(page.getByRole("article")).toHaveCount(count);
      if (section === "Titles") {
        const summary = await page.getByText("Title overview.", { exact: true }).boundingBox();
        const row = await page.getByRole("article").boundingBox();
        expect(summary!.y + summary!.height).toBeLessThan(row!.y);
      }
      if (section === "Endorsements") {
        expect(await page.getByRole("article").evaluateAll(rows => rows.map(row => row.getAttribute("data-index-code")))).toEqual(["endorsement-1", "endorsement-2", "endorsement-3"]);
        await page.getByRole("article").nth(1).getByRole("button", { name: "Edit index", exact: true }).click();
        await expect(page.locator("#visual-stage")).toHaveAttribute("data-edit-code", "endorsement-2");
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${section}-${width}.png`), fullPage: true });
    }
  });

  test(`metadata segment and page groups stay aligned and usable at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?scenario=metadata-groups");
    expect(await page.evaluate(() => navigator.userAgent)).toContain("Edg/");
    for (const [section, headings, summary] of [
      ["Parties(Party Clause)", [], "Party overview."],
      ["Property Info", [], "Legal overview."],
      ["Acknowledgment", [], "Execution overview."],
    ] as const) {
      const trigger = page.getByRole("button", { name: section, exact: true });
      if (await trigger.getAttribute("aria-expanded") !== "true") await trigger.click();
      await expect(page.getByRole("heading", { level: 3 })).toHaveText([...headings]);
      await expect(page.getByText(summary, { exact: true })).toHaveCount(0);
      const firstBox = await page.getByRole("article").first().boundingBox();
      expect(firstBox!.x).toBeGreaterThanOrEqual(0);
      expect(firstBox!.x + firstBox!.width).toBeLessThanOrEqual(width);
      for (const group of await page.getByRole("group").all()) {
        const row = group.getByRole("article").first();
        const label = group.getByRole("heading", { level: 4 });
        const rowBox = await row.boundingBox();
        expect(rowBox!.x + rowBox!.width).toBeLessThanOrEqual(width);
        const segment = await row.getAttribute("data-index-segment");
        if (segment === "execution" || segment === "legal") {
          await expect(label).toHaveCount(0);
        } else {
          const labelBox = await label.boundingBox();
          expect(rowBox!.x).toBeCloseTo(labelBox!.x, 0);
          expect(labelBox!.y + labelBox!.height).toBeLessThan(rowBox!.y);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${section.replace(/\W/g, "")}-${width}.png`), fullPage: true });
    }
    await page.getByRole("button", { name: "Parties(Party Clause)", exact: true }).click();
    const rows = page.getByRole("article");
    await expect(rows).toHaveCount(4);
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 4 })).toHaveText(["Page 1", "Page not specified", "Page 1", "Page Exhibit-A"]);
    expect(await rows.evaluateAll(items => items.map(row => row.getAttribute("data-index-code")))).toEqual(["side-1", "side-2", "raw-1", "raw-2"]);
    await rows.first().getByRole("button", { name: "Edit index", exact: true }).click();
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-edit-code", "side-1");
    await page.getByRole("button", { name: "Add Index", exact: true }).click();
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-add-segment", "party");
    expect(errors).toEqual([]);
  });
}
