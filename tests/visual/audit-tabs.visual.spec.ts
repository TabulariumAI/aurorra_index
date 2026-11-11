import { expect, test } from "@playwright/test";

for (const width of [1440, 440, 390]) {
  test(`Audit tabs preserve changes and isolate usage at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    let reports = 0;
    let resources = 0;
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.route("https://doc.example.com/v1/model/aspects", route => {
      resources++;
      return route.fulfill({ json: { aspects: { party: ["grantor"] } } });
    });
    await page.route("https://doc.example.com/v1/metadata/session-1/audit", route => {
      reports++;
      return route.fulfill({ json: { status: "completed", data: "https://storage.example.com/audit-tabs.json" } });
    });
    await page.route("https://storage.example.com/audit-tabs.json", route => route.fulfill({ json: {
      gaps: Array.from({ length: 8 }, (_, index) => ({ solution: "ADD", explanation: `Audit change ${index}: ${"Full audit explanation. ".repeat(20)}`,
        page: "1", owner: "verification", timestamp: "2026-01-01T00:00:00Z", segment: "party" })),
      usage: { services: [{ name: "extraction", code: "one", cost: 0.3, time: 88.14, page_num: 3, timestamp: "2026-01-01T00:00:00Z" }] },
    } }));
    await page.goto("/?scenario=audit&details");
    const changes = page.getByRole("tab", { name: "Changes", exact: true });
    const usage = page.getByRole("tab", { name: "Usage", exact: true });
    const choices = page.getByRole("tab", { name: "Choices", exact: true });
    await expect(changes).toHaveAttribute("aria-selected", "true");
    await expect(changes).toHaveCSS("box-shadow", "none");
    await usage.hover();
    await expect(usage).toHaveCSS("box-shadow", "none");
    await expect(usage).toHaveCSS("transform", "none");
    await page.mouse.move(0, 0);
    await expect(page.getByRole("article")).toHaveCount(8);
    await expect(page.getByRole("table")).toHaveCount(0);
    await page.getByLabel("Change type").selectOption("ADD");
    await page.getByLabel("Process").selectOption("VERIFICATION");
    await page.getByLabel("Segment", { exact: true }).selectOption("party");
    await page.getByText("[Show more]", { exact: true }).first().click();
    const tabBounds = await changes.boundingBox();
    const body = page.getByRole("region", { name: "Audit & Usage body" });
    await body.evaluate(node => { node.scrollTop = node.scrollHeight; });
    await expect.poll(() => body.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    expect((await changes.boundingBox())!.y).toBe(tabBounds!.y);
    await body.evaluate(node => { node.scrollTop = 0; });
    const controls = await page.locator("[data-audit-controls]").boundingBox();
    expect(controls!.y).toBeGreaterThanOrEqual(tabBounds!.y + tabBounds!.height);
    expect(Math.round((await usage.boundingBox())!.y)).toBe(Math.round(tabBounds!.y));
    await page.screenshot({ path: testInfo.outputPath(`audit-changes-${width}.png`), fullPage: true });
    await changes.focus();
    await page.keyboard.press("ArrowRight");
    await expect(usage).toBeFocused();
    await expect(page.getByRole("tabpanel", { name: "Usage", exact: true })).toBeVisible();
    await expect(page.getByRole("row", { name: "Index Extraction 1 credits 88.14 s 3" })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await expect(page.getByText("Out of 8")).toBeHidden();
    const table = page.getByRole("table");
    const tableBounds = (await table.boundingBox())!;
    expect(tableBounds.y).toBeGreaterThan(tabBounds!.y + tabBounds!.height);
    const columns = await table.locator("thead th").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().x));
    const cells = await table.locator("tbody tr").first().locator("th, td").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().x));
    expect(cells).toEqual(columns);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await body.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await table.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`audit-usage-${width}.png`), fullPage: true });
    await page.keyboard.press("Home");
    await expect(changes).toBeFocused();
    await expect(page.getByLabel("Change type")).toHaveValue("ADD");
    await expect(page.getByLabel("Process")).toHaveValue("VERIFICATION");
    await expect(page.getByLabel("Segment", { exact: true })).toHaveValue("party");
    await expect(page.getByText("[Show less]", { exact: true })).toBeVisible();
    await page.keyboard.press("End");
    await expect(choices).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(changes).toBeFocused();
    expect(reports).toBe(1);
    expect(resources).toBe(1);
    expect(errors).toEqual([]);
  });
}

test("Legal Map retains independent view and detail keyboard navigation", async ({ page }, testInfo) => {
  await page.goto("/?scenario=legal-map&metes=1");
  const views = page.getByRole("tablist", { name: "Map views" });
  await views.getByRole("tab", { name: "Metes & Bounds", exact: true }).click();
  const details = page.getByRole("tablist", { name: "Map details" });
  const calls = details.getByRole("tab", { name: "Boundary Calls", exact: true });
  await calls.focus();
  await page.keyboard.press("ArrowRight");
  await expect(details.getByRole("tab", { name: "Acreage", exact: true })).toBeFocused();
  await expect(views.getByRole("tab", { name: "Metes & Bounds", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(calls).toBeFocused();
  await expect(page.getByRole("table", { name: "Boundary Calls" }).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("legal-map-tabs.png"), fullPage: true });
});
