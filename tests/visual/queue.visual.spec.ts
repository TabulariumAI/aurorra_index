import { expect, test, type Route } from "@playwright/test";

test.use({ channel: "msedge" });

const initial = {
  heading: { class: "deed", title: "Warranty Deed" }, fees: [], funds: [], secrets: [],
  pages: { num_of_pages: 1, recordables: [] },
  indexes: ["Alice", "Bob"].map((value, i) => ({ code: `index-${i}`, label: "grantor", aspect: "person", value, segment: "party" })),
};

for (const width of [1440, 390]) {
  test(`deletion queue refreshes once and reuses the SAS URL after reload at ${width}px`, async ({ page }, testInfo) => {
    let metadataReads = 0;
    let blobReads = 0;
    let remote = initial;
    let refresh: Route | undefined;
    const drops: Route[] = [];
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://gateway.example.test/v1/metadata/session/data", async route => {
      metadataReads++;
      if (metadataReads === 1) await route.fulfill({ json: { status: "completed", data: "https://storage.example.test/old.json?sig=test" } });
      else refresh = route;
    });
    await page.route("https://storage.example.test/**", async route => { blobReads++; await route.fulfill({ json: remote }); });
    await page.route("https://gateway.example.test/v1/refine/session/drop/*", route => { drops.push(route); });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/queue.html");
    await expect(page.getByRole("article")).toHaveCount(2);
    for (const value of ["Alice", "Bob"]) {
      const row = page.getByRole("article").filter({ hasText: value });
      await row.getByRole("button", { name: "Delete index", exact: true }).click();
      await row.getByRole("button", { name: "Confirm", exact: true }).click();
    }
    await expect.poll(() => drops.length).toBe(1);
    expect(metadataReads).toBe(1);
    await expect(page.getByRole("article")).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accordion = await page.getByRole("region", { name: "Metadata accordion" }).boundingBox();
    for (const row of await page.getByRole("article").all()) {
      const box = await row.boundingBox();
      expect(box!.y).toBeGreaterThanOrEqual(accordion!.y);
      expect(box!.y + box!.height).toBeLessThanOrEqual(accordion!.y + accordion!.height);
    }
    await page.screenshot({ path: testInfo.outputPath("queue-pending.png"), fullPage: true });
    await drops[0].fulfill({ json: { status: "completed", data: "", version: 1 } });
    await expect.poll(() => drops.length).toBe(2);
    expect(metadataReads).toBe(1);
    await drops[1].fulfill({ json: { status: "completed", data: "", version: 2 } });
    await expect.poll(() => metadataReads).toBe(2);
    await expect(page.getByRole("article")).toHaveCount(2);
    remote = { ...initial, indexes: [] };
    await refresh!.fulfill({ json: { status: "completed", data: "https://storage.example.test/new.json?sig=test" } });
    await expect(page.getByRole("article")).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("queue-completed.png"), fullPage: true });
    await page.reload();
    await expect.poll(() => blobReads).toBe(3);
    expect(metadataReads).toBe(2);
    await expect(page.getByRole("article")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test(`failed deletion retains metadata and supports retry at ${width}px`, async ({ page }, testInfo) => {
    let drops = 0;
    let reads = 0;
    await page.route("https://gateway.example.test/v1/metadata/session/data", async route => {
      reads++;
      await route.fulfill({ json: { status: "completed", data: "https://storage.example.test/metadata.json?sig=test" } });
    });
    await page.route("https://storage.example.test/**", route => route.fulfill({ json: drops > 1 ? { ...initial, indexes: [initial.indexes[1]] } : initial }));
    await page.route("https://gateway.example.test/v1/refine/session/drop/*", route => {
      drops++;
      return route.fulfill({ json: drops === 1 ? { status: "error", data: "Deletion failed", version: 1 } : { status: "completed", data: "", version: 2 } });
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/queue.html");
    const row = page.getByRole("article").filter({ hasText: "Alice" });
    await row.getByRole("button", { name: "Delete index", exact: true }).click();
    await row.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(row.getByRole("button", { name: /Retry/ })).toBeVisible();
    expect(reads).toBe(1);
    await expect(page.getByRole("article")).toHaveCount(2);
    await page.screenshot({ path: testInfo.outputPath("queue-failed.png"), fullPage: true });
    await row.getByRole("button", { name: /Retry/ }).click();
    await expect(page.getByRole("article")).toHaveCount(1);
    expect(drops).toBe(2);
    expect(reads).toBe(2);
  });
}
