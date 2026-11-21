import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
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
    await expect(page.getByText("No gaps found.")).toBeVisible();
    await page.getByLabel("Change type").selectOption("ADD");
    await page.getByRole("tab", { name: "Usage", exact: true }).click();
    const table = page.getByRole("table", { name: "Audit service usage" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("row")).toHaveCount(5);
    for (const name of [
      "Index Extraction 1 credits 54.16 s 3", "IQ Refinement 1 credits 2.00 s 3",
      "User Refinement 1 credits 148.40 s 4", "Model Refinement 1 credits 92.19 s 3",
    ]) await expect(table.getByRole("row", { name, exact: true })).toBeVisible();
    await expect(page.getByText("No gaps found.")).toBeHidden();
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(table.getByRole("row")).toHaveCount(5);
    const positions = await Promise.all((await table.getByRole("row").all()).map(row => row.locator("th, td").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().x))));
    for (const row of positions.slice(1)) for (let column = 0; column < row.length; column++) {
      expect(Math.abs(row[column] - positions[0][column])).toBeLessThan(2);
    }
    await expect.poll(() => table.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/audit-usage-${width}.png`, fullPage: true });
    const usageStyle = await table.locator("thead").evaluate(node => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, color: style.color, fontSize: style.fontSize };
    });
    const frame = page.getByRole("region", { name: "Service usage table", exact: true });
    expect(await frame.evaluate(node => node.getBoundingClientRect().right <= document.documentElement.clientWidth)).toBe(true);
    await page.getByRole("tab", { name: "Choices", exact: true }).click();
    await expect(page.getByText("Jurisdiction", { exact: true })).toBeVisible();
    await expect(page.getByText("Texas, Harris County", { exact: true })).toBeVisible();
    const choices = page.getByRole("table", { name: "Indexing choices", exact: true });
    const jurisdictionHeading = page.getByRole("heading", { name: "Jurisdiction", exact: true });
    const jurisdictionValue = jurisdictionHeading.locator("+ p");
    const choicesHeading = page.getByRole("heading", { name: "Indexing choices", exact: true });
    const typography = (node: HTMLElement | SVGElement) => {
      const style = getComputedStyle(node);
      return { color: style.color, fontSize: style.fontSize, fontWeight: style.fontWeight };
    };
    expect(await jurisdictionHeading.evaluate(typography)).toEqual(await choicesHeading.evaluate(typography));
    await expect(jurisdictionValue).toHaveCSS("color", await choicesHeading.evaluate(node => getComputedStyle(node).color));
    expect(parseFloat(await jurisdictionValue.evaluate(node => getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(
      parseFloat(await jurisdictionHeading.evaluate(node => getComputedStyle(node).fontSize)));
    expect((await jurisdictionValue.boundingBox())!.y).toBeGreaterThanOrEqual(
      (await jurisdictionHeading.boundingBox())!.y + (await jurisdictionHeading.boundingBox())!.height);
    await jurisdictionValue.evaluate(node => { node.textContent = "Texas, ".repeat(30) + "Bexar County"; });
    await expect(jurisdictionValue).toContainText("Bexar County");
    expect(await jurisdictionValue.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await page.getByRole("region", { name: "Audit & Usage body", exact: true }).evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await jurisdictionValue.evaluate(node => { node.textContent = "Texas, Harris County"; });
    expect(await choices.locator("thead").evaluate(node => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, color: style.color, fontSize: style.fontSize };
    })).toEqual(usageStyle);
    await page.screenshot({ path: `artifacts/audit-choices-${width}.png`, fullPage: true });
    await page.reload();
    await expect(page.getByRole("tabpanel", { name: "Choices", exact: true })).toBeVisible();
  });
}
