import { expect, test } from "@playwright/test";

for (const width of [1440, 440]) {
  test(`Audit totals downloaded service history per session at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("https://doc.example.com/v1/model/aspects", route => route.fulfill({ json: {
      aspects: { transaction: ["recording_number"] },
    } }));
    await page.route("https://doc.example.com/v1/metadata/session-1/audit", route => route.fulfill({ json: {
      status: "completed", data: "https://storage.example.com/usage.json",
    } }));
    await page.route("https://storage.example.com/usage.json", route => route.fulfill({ json: {
      gaps: [], usage: { services: [
        { name: "extraction", cost: 0.30207683, time: 54.1640922, page_num: 3, code: "extraction", timestamp: "2025-01-01T00:00:00Z" },
        { name: "iq_refinement", cost: 0.0112, time: 2, page_num: 3, code: "iq", timestamp: "2026-10-20T00:00:00Z" },
        { name: "refinement", cost: 0.0019833, time: 1.9873429, page_num: 1, code: "refine-one", timestamp: "2026-10-20T00:00:00Z" },
        { name: "refinement", cost: 0.03727295, time: 137.2091528, page_num: 2, code: "refine-two", timestamp: "2026-10-20T00:00:00Z" },
        { name: "refinement", cost: 0.0645425, time: 9.1991207, page_num: 1, code: "refine-three", timestamp: "2026-10-24T00:00:00Z" },
        { name: "refinement", cost: 0, time: 0, page_num: 0, code: "refine-zero", timestamp: "2026-10-24T00:00:00Z" },
        { name: "model_generation", cost: 0.106634, time: 57.8153172, page_num: 2, code: "model-one", timestamp: "2026-10-24T00:00:00Z" },
        { name: "model_generation", cost: 0.1201695, time: 34.3789918, page_num: 1, code: "model-two", timestamp: "2026-10-24T00:00:00Z" },
      ] },
    } }));
    await page.goto("/?scenario=audit&details");
    const table = page.getByRole("table", { name: "Audit service usage" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("row")).toHaveCount(5);
    for (const name of [
      "Index Extraction $0.3021 54.16 s 3", "IQ Refinement $0.0112 2.00 s 3",
      "User Refinement $0.1038 148.40 s 4", "Model Generation $0.2268 92.19 s 3",
    ]) await expect(table.getByRole("row", { name, exact: true })).toBeVisible();
    await expect(page.getByText("No gaps found.")).toBeVisible();
    await page.getByLabel("Change type").selectOption("ADD");
    await expect(table.getByRole("row")).toHaveCount(5);
    const positions = await Promise.all((await table.getByRole("row").all()).map(row => row.locator("th, td").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().x))));
    for (const row of positions.slice(1)) for (let column = 0; column < row.length; column++) {
      expect(Math.abs(row[column] - positions[0][column])).toBeLessThan(2);
    }
    await expect.poll(() => table.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/audit-usage-${width}.png`, fullPage: true });
  });
}
