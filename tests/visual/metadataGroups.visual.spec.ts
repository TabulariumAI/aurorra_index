import { devices, expect, test } from "@playwright/test";

test.use({ ...devices["Desktop Edge"], channel: "msedge" });

for (const width of [390, 1440]) {
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
      ["Parties(Party Clause)", ["Sides", "Parties"], "Party overview."],
      ["Property Info", [], "Legal overview."],
      ["Acknowledgment", [], "Execution overview."],
    ] as const) {
      const trigger = page.getByRole("button", { name: section, exact: true });
      if (await trigger.getAttribute("aria-expanded") !== "true") await trigger.click();
      await expect(page.getByRole("heading", { level: 3 })).toHaveText([...headings]);
      const paragraph = page.locator("p").filter({ hasText: summary });
      const firstRow = page.getByRole("article").first();
      const paragraphBox = await paragraph.boundingBox();
      const firstBox = await firstRow.boundingBox();
      expect(paragraphBox!.y + paragraphBox!.height).toBeLessThan(firstBox!.y);
      for (const property of ["font-family", "font-size", "font-weight", "color"]) {
        await expect(paragraph).toHaveCSS(property, await page.getByRole("region", { name: "Metadata", exact: true }).evaluate((node, property) => getComputedStyle(node).getPropertyValue(property), property));
      }
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
    await rows.first().getByRole("button", { name: "Edit index", exact: true }).click();
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-edit-code", "side-1");
    await page.getByRole("button", { name: "Add Index", exact: true }).click();
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-add-segment", "party");
    expect(errors).toEqual([]);
  });
}
