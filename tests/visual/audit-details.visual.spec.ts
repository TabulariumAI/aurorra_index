import { expect, test } from "@playwright/test";
import { auditGap, auditPatch } from "../../src/features/audit/test/auditFixture";

test.beforeEach(async ({ page }) => {
  await page.route("https://doc.example.com/v1/model/aspects", route => route.fulfill({ json: { aspects: { transaction: ["recording_number"], party: ["grantor"] } } }));
});

for (const width of [1440, 440]) {
  test(`Audit details survive artifact loading and filtering at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("https://doc.example.com/v1/metadata/session-1/audit", route => route.fulfill({
      json: { status: "completed", data: "https://storage.example.com/audit.json" },
    }));
    await page.route("https://storage.example.com/audit.json", route => route.fulfill({ json: {
      gaps: [{ ...auditGap, patch: { ...auditPatch, ambiguous: "YES" } }, { ...auditGap, solution: "update", timestamp: "2026-10-03T15:29:00Z",
        patch: { ...auditPatch, solution: "update", field: "value", code: "index-1",
          identifier: { value: "2025-999", label: "Old label", aspect: "instrument_number" } } }],
    } }));
    await page.goto("/?scenario=audit&details");
    const card = page.getByRole("article").first();
    for (const text of ["2026-001", "7", "Recorded as 2026-001", "transaction"]) {
      await expect(card.getByText(text, { exact: true })).toBeVisible();
    }
    for (const text of ["Label", "Aspect", "Ambiguous", "Recording number", "recording_number", "YES"]) {
      await expect(card.getByText(text, { exact: true })).toHaveCount(0);
    }
    await expect(card.getByText("Index created by user.", { exact: true })).toBeVisible();
    await expect.poll(() => card.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    const rows = card.locator("dl > div");
    for (const row of await rows.all()) {
      const label = await row.locator("dt").boundingBox();
      const value = await row.locator("dd").boundingBox();
      expect(label).toBeTruthy();
      expect(value).toBeTruthy();
      expect(value!.x).toBeGreaterThan(label!.x);
      expect(Math.abs(value!.y - label!.y)).toBeLessThan(2);
    }
    const segment = page.getByLabel("Segment", { exact: true });
    await expect(segment.getByRole("option", { name: "Transaction (2)", exact: true })).toBeAttached();
    await expect(segment.getByRole("option", { name: "Party (0)", exact: true })).toBeAttached();
    const segmentBox = await card.getByText("transaction", { exact: true }).boundingBox();
    const processBox = await card.getByText("User change", { exact: true }).boundingBox();
    const cardBox = await card.boundingBox();
    expect(segmentBox!.x).toBeGreaterThan(processBox!.x);
    expect(Math.abs(segmentBox!.y - processBox!.y)).toBeLessThan(2);
    expect(cardBox!.x + cardBox!.width - segmentBox!.x - segmentBox!.width).toBeLessThan(30);
    await expect(card.locator("dl").getByText("Segment", { exact: true })).toHaveCount(0);
    await segment.selectOption("party");
    await expect(page.getByText("No gaps found.")).toBeVisible();
    await segment.selectOption("transaction");
    await expect(page.getByRole("article")).toHaveCount(2);
    await segment.selectOption("");
    await expect.poll(() => page.locator("[data-audit-controls]").evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/audit-details-${width}.png`, fullPage: true });
    await page.getByLabel("Change type").selectOption("CORRECTION");
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByText("2025-999", { exact: true })).toBeVisible();
    await expect(page.getByText("Old label", { exact: true })).toBeVisible();
    await expect(page.getByText("instrument_number", { exact: true })).toBeVisible();
    await expect(page.getByText("2026-001 (value)", { exact: true })).toBeVisible();
    await page.getByLabel("Process").selectOption("VERIFICATION");
    await expect(page.getByText("No gaps found.")).toBeVisible();
    await page.getByLabel("Process").selectOption("USER");
    await expect(page.getByText("index-1", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Code", { exact: true })).toHaveCount(0);
  });
}
