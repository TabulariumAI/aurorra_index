import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`Audit distinguishes Correction and Enrichment at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("https://doc.example.com/v1/model/aspects", route => route.fulfill({ json: {
      aspects: { transaction: ["effective_date"] },
    } }));
    await page.route("https://doc.example.com/v1/metadata/session-1/audit", route => route.fulfill({ json: {
      status: "completed", data: "https://storage.example.com/audit.json",
    } }));
    await page.route("https://storage.example.com/audit.json", route => route.fulfill({ json: {
      gaps: ["Correction", "Enrichment"].map(owner => ({
        solution: "remove", explanation: `${owner} removal`, page: "2", owner,
        timestamp: "2026-11-16T05:45:39Z", segment: "transaction",
      })),
    } }));
    await page.goto("/?scenario=audit&details");
    const process = page.getByLabel("Process", { exact: true });
    await expect(process.getByRole("option", { name: "Correction (1)", exact: true })).toHaveAttribute("value", "CORRECTION");
    await expect(process.getByRole("option", { name: "Enrichment (1)", exact: true })).toHaveAttribute("value", "ENRICHMENT");
    for (const owner of ["Correction", "Enrichment"]) {
      const card = page.getByRole("article").filter({ hasText: `${owner} removal` });
      await expect(card.getByText(owner, { exact: true })).toBeVisible();
    }
    await page.getByLabel("Change type").selectOption("REMOVE");
    await page.getByLabel("Segment", { exact: true }).selectOption("transaction");
    await process.selectOption("CORRECTION");
    await expect(page.getByText("Correction removal", { exact: true })).toBeVisible();
    await expect(page.getByText("Enrichment removal", { exact: true })).toBeHidden();
    await expect(page.getByText("Out of 2").locator("..")).toHaveText("1Out of 2");
    const controls = page.getByRole("combobox");
    const boxes = await controls.evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, right: box.right, bottom: box.bottom, height: box.height };
    }));
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
      expect(box.height).toBeGreaterThan(0);
    }
    if (width === 1440) expect(new Set(boxes.map(box => box.y)).size).toBe(1);
    else for (let i = 1; i < boxes.length; i++) expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
    await page.screenshot({ path: `artifacts/audit-correction-${width}.png`, fullPage: true });
    await process.selectOption("ENRICHMENT");
    await expect(page.getByText("Enrichment removal", { exact: true })).toBeVisible();
    await expect(page.getByText("Correction removal", { exact: true })).toBeHidden();
    await process.selectOption("");
    await expect(page.getByRole("article")).toHaveCount(2);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
