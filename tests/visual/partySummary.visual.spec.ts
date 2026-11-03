import { devices, expect, test } from "@playwright/test";

test.use({ ...devices["Desktop Edge"], channel: "msedge" });

for (const width of [1440, 390]) {
  test(`renders and refreshes the party summary without changing rows at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    const summary = "HSBC Mortgage Corporation assigns the mortgage to HSBC Bank USA; John Merritt Smith, also identified as John M Smith, and Michele L Smith are the mortgagors.";
    let current: string | null = summary;
    await page.route("https://doc.example.com/v1/metadata/*/data", route => route.fulfill({ json: {
      status: "completed", data: "https://storage.example.com/metadata.json", etag: "metadata-etag",
    } }));
    await page.route("https://storage.example.com/metadata.json", route => route.fulfill({ json: {
      heading: { class: "assignment", title: "Assignment" }, indexes: [], secrets: [], fees: [], funds: [],
      parties: { summary: current, indexes: [
        { code: "assignor", segment: "party", aspect: "organization, Direct", label: "Assignor", value: "HSBC MTG CORP (USA)", ambiguous: "NO" },
        { code: "assignee", segment: "party", aspect: "organization, Indirect", label: "Assignee", value: "HSBC BANK USA", ambiguous: "NO" },
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
    const paragraph = page.getByText(summary, { exact: true });
    await expect(paragraph).toBeVisible();
    await expect(paragraph).toHaveCount(1);
    await expect(page.getByRole("article")).toHaveCount(2);
    const bounds = await paragraph.boundingBox();
    const row = await page.getByRole("article").first().boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThan(row!.y);
    expect(Math.abs(bounds!.x - row!.x)).toBeLessThan(1);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await expect(page.getByRole("button", { name: "Edit index" })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Add Index" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Reprocess" })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`party-summary-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "Pages", exact: true }).click();
    await expect(paragraph).toBeHidden();
    await trigger.click();
    await expect(paragraph).toBeVisible();
    for (const next of ["HSBC Bank USA receives the assigned mortgage.", null, ""]) {
      current = next;
      await page.getByRole("button", { name: "Refresh metadata" }).click();
      await expect(page.getByRole("button", { name: "Pages", exact: true })).toHaveAttribute("aria-expanded", "true");
      await trigger.click();
      await expect(paragraph).toHaveCount(0);
      if (next) await expect(page.getByText(next, { exact: true })).toBeVisible();
      else await expect(trigger.locator("../..").locator("p")).toHaveCount(0);
      await expect(page.getByRole("article")).toHaveCount(2);
      await expect(page.getByText("HSBC BANK USA", { exact: true })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
