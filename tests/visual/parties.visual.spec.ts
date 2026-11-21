import { devices, expect, test } from "@playwright/test";

test.use({ ...devices["Desktop Edge"], channel: "msedge" });

for (const width of [1440, 390]) {
  test(`renders and refreshes party records without a summary at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    let assignee = "HSBC BANK USA";
    await page.route("https://doc.example.com/v1/metadata/*/data", route => route.fulfill({ json: {
      status: "completed", data: "https://storage.example.com/metadata.json", etag: "metadata-etag",
    } }));
    await page.route("https://storage.example.com/metadata.json", route => route.fulfill({ json: {
      heading: { class: "assignment", title: "Assignment" }, indexes: [], secrets: [], fees: [], funds: [],
      parties: { indexes: [
        { code: "assignor", segment: "party", aspect: "organization, Direct", label: "Assignor", value: "HSBC MTG CORP (USA)", ambiguous: "NO" },
        { code: "assignee", segment: "party", aspect: "organization, Indirect", label: "Assignee", value: assignee, ambiguous: "NO" },
      ] },
    } }));
    await page.route("https://doc.example.com/v1/index/*/choices", route => route.fulfill({ json: {
      status: "completed", data: JSON.stringify({ items: [
        { service: "PartyClauseIndexing", level: 1 }, { service: "PartyEnrichment", level: 1 },
      ], jurisdiction: null }),
    } }));
    await page.route("https://doc.example.com/v1/content/*/pages", route => route.fulfill({ json: {
      status: "completed", data: "https://storage.example.com/pages.json", etag: "pages-etag",
    } }));
    await page.route("https://storage.example.com/pages.json", route => route.fulfill({ json: {
      num_of_pages: 1, recordables: [{ code: "page-1", name: "1", class: "assignment", segments: ["party"] }], nonrecordables: [],
    } }));
    await page.route("https://doc.example.com/v1/metadata/*/audit", route => route.fulfill({ json: {
      status: "completed", data: "https://storage.example.com/audit.json",
    } }));
    await page.route("https://storage.example.com/audit.json", route => route.fulfill({ json: { gaps: [] } }));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?scenario=pages");
    expect(await page.evaluate(() => navigator.userAgent)).toContain("Edg/");
    await expect(page.getByLabel("Metadata state")).toHaveText("success");
    await expect(page.getByRole("button", { name: "Pages error" })).toHaveCount(0);
    const trigger = page.getByRole("button", { name: "Parties(Party Clause)", exact: true });
    await trigger.click();
    await expect(trigger.locator("../..").locator(":scope > div > p")).toHaveCount(0);
    await expect(page.getByRole("article")).toHaveCount(2);
    for (const row of await page.getByRole("article").all()) {
      const bounds = (await row.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    }
    await expect(page.getByRole("button", { name: "Edit index" })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Add Index" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Reprocess" })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`party-records-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "Pages", exact: true }).click();
    await expect(page.getByText("HSBC BANK USA", { exact: true })).toHaveCount(0);
    await trigger.click();
    await expect(page.getByText("HSBC BANK USA", { exact: true })).toBeVisible();
    assignee = "ACME LLC";
    await page.getByRole("button", { name: "Refresh metadata" }).click();
    await expect(page.getByRole("button", { name: "Pages", exact: true })).toHaveAttribute("aria-expanded", "true");
    await trigger.click();
    await expect(page.getByRole("article")).toHaveCount(2);
    await expect(page.getByText("ACME LLC", { exact: true })).toBeVisible();
    await expect(page.getByText("HSBC BANK USA", { exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
