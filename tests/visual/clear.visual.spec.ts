import { devices, expect, test, type Route } from "@playwright/test";

test.use({ ...devices["Desktop Edge"], channel: "msedge" });

const initial = {
  heading: { class: "deed", title: "Warranty Deed" }, fees: [], funds: [], secrets: [],
  pages: { num_of_pages: 1, recordables: [] },
  indexes: [
    { code: "party", label: "Grantor", aspect: "person", value: "Alice", segment: "party" },
    { code: "property", label: "Parcel", aspect: "property_id", value: "Parcel 42", segment: "property" },
    { code: "ack", label: "Signatory", aspect: "signatory", value: "Bob", segment: "acknowledgment" },
  ],
  legals: { groups: [{ code: "legal", type: "lot_block", elements: [{ aspect: "lot", value: "7" }] }] },
  execution: { indexes: [{ code: "signature", label: "Signature", aspect: "signatory_signature", value: "Yes", segment: "execution" }] },
};

for (const [width, height] of [[320, 812], [375, 812], [390, 1000], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) {
  for (const [section, segment] of [["Property Info", "property"], ["Acknowledgment", "acknowledgment"]]) {
    test(`bulk clear ${segment} waits for refresh and supports recovery at ${width}px`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      const requests: Route[] = [];
      let refresh: Route | undefined;
      let reads = 0;
      let drops = 0;
      page.on("pageerror", error => errors.push(error.message));
      await page.route("https://gateway.example.test/**", route => route.abort());
      await page.route("https://gateway.example.test/v1/index/session/choices", route => route.fulfill({ json: {
        status: "completed", data: JSON.stringify({ items: ["PartyClauseIndexing", "ExhibitIndexing", "LegalEnrichment", "AcknowledgmentIndexing", "ExecutionEnrichment"].map(service => ({ service, level: 1 })) }),
      } }));
      await page.route("https://gateway.example.test/v1/content/session/pages", route => route.fulfill({ json: {
        status: "completed", data: "https://storage.example.test/pages.json?sig=test", etag: "pages-etag",
      } }));
      await page.route("https://storage.example.test/pages.json?sig=test", route => route.fulfill({ json: {
        ...initial.pages, num_of_records: 0, nonrecordables: [],
      } }));
      await page.route("https://gateway.example.test/v1/metadata/session/data", async route => {
        if (++reads === 1) await route.fulfill({ json: { status: "completed", data: "https://storage.example.test/old.json?sig=test", etag: "old-etag" } });
        else refresh = route;
      });
      await page.route("https://storage.example.test/old.json?sig=test", route => route.fulfill({ json: initial }));
      await page.route("https://storage.example.test/new.json?sig=test", route => route.fulfill({ json: {
        ...initial,
        indexes: initial.indexes.filter(item => item.segment !== segment),
        ...(segment === "property" ? { legals: null } : { execution: { indexes: [] } }),
      } }));
      await page.route("https://gateway.example.test/v1/refine/session/clear/*", route => { requests.push(route); });
      await page.route("https://gateway.example.test/v1/refine/session/drop/*", route => { drops++; return route.abort(); });
      await page.setViewportSize({ width, height });
      await page.goto("/queue.html");
      expect(await page.evaluate(() => navigator.userAgent)).toContain("Edg/");
      await expect(page.getByText("Alice", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: section, exact: true }).click();
      await expect(page.getByRole("article")).toHaveCount(2);
      const scroll = page.getByRole("button", { name: "Scroll section actions right" });
      const overflowing = await page.getByRole("group", { name: "Section actions" }).evaluate(node => node.scrollWidth > node.clientWidth);
      if (overflowing) {
        await expect(scroll).toBeVisible();
        await page.screenshot({ path: testInfo.outputPath(`clear-scroll-${segment}-${width}.png`), fullPage: true });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await expect(scroll).toHaveCount(0);
        await page.setViewportSize({ width, height });
        await expect(scroll).toBeVisible();
        await scroll.click();
        await expect(scroll).toBeDisabled();
        await page.getByRole("group", { name: "Section actions" }).hover();
        await page.mouse.wheel(-400, 0);
        await expect(scroll).toBeEnabled();
        await scroll.focus();
        await page.keyboard.press("Enter");
        await expect(scroll).toBeDisabled();
      } else {
        await expect(scroll).toHaveCount(0);
      }
      await expect(page.getByRole("button", { name: "Clear indexes", exact: true })).toBeVisible();
      await page.mouse.move(0, 0);
      await page.getByRole("button", { name: "Reprocess", exact: true }).blur();
      await expect.poll(async () => {
        const actionStyles = await page.getByRole("group", { name: "Section actions" }).evaluate(group => {
          return ["Reprocess", "Clear indexes"].map(label => {
            const button = group.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
            const style = getComputedStyle(button);
            return [style.fontSize, style.fontWeight, style.color, style.height, style.padding];
          });
        });
        return actionStyles[1].every((value, index) => value === actionStyles[0][index]);
      }).toBe(true);
      expect(await page.getByRole("button", { name: "Clear indexes", exact: true }).evaluate(node => {
        const viewport = node.parentElement!.parentElement!;
        const button = node.getBoundingClientRect();
        const bounds = viewport.getBoundingClientRect();
        return button.left >= bounds.left && button.right <= bounds.right + 1 && node.scrollWidth <= node.clientWidth;
      })).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`clear-ready-${segment}-${width}.png`), fullPage: true });
      await page.getByRole("button", { name: "Clear indexes", exact: true }).click();
      expect(requests).toHaveLength(0);
      await page.getByRole("button", { name: "Confirm", exact: true }).click();
      await expect.poll(() => requests.length).toBe(1);
      await expect(page.getByRole("progressbar", { name: `Clearing ${segment}` })).toBeVisible();
      await expect(page.getByRole("article")).toHaveCount(2);
      expect(await page.getByRole("button", { name: "Clear indexes", exact: true }).evaluate(node => Boolean(node.closest("[inert]")))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`clear-pending-${segment}-${width}.png`), fullPage: true });
      await requests[0].fulfill({ status: 500, json: { error: "Clear failed" } });
      await expect(page.getByRole("button", { name: /Retry/ })).toBeVisible();
      await expect(page.getByRole("article")).toHaveCount(2);
      await page.screenshot({ path: testInfo.outputPath(`clear-failed-${segment}-${width}.png`), fullPage: true });
      expect(await page.getByRole("button", { name: /Retry/ }).evaluate(node => node.closest("[inert]"))).toBeNull();
      expect(await page.getByRole("button", { name: section, exact: true }).evaluate(node => Boolean(node.closest("[inert]")))).toBe(true);
      await page.getByRole("button", { name: /Retry/ }).click();
      await expect.poll(() => requests.length).toBe(2);
      expect(new URL(requests[1].request().url()).pathname).toBe(`/v1/refine/session/clear/${segment}`);
      expect(requests[1].request().postDataJSON()).toEqual({});
      await requests[1].fulfill({ json: { status: "completed", data: "" } });
      await expect.poll(() => reads).toBe(2);
      await expect(page.getByRole("progressbar", { name: `Clearing ${segment}` })).toBeVisible();
      await refresh!.fulfill({ json: { status: "completed", data: "https://storage.example.test/new.json?sig=test", etag: "new-etag" } });
      await expect(page.getByRole("article")).toHaveCount(0);
      await expect(page.getByRole("progressbar")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Clear indexes", exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Reprocess", exact: true })).toBeEnabled();
      await page.screenshot({ path: testInfo.outputPath(`clear-completed-${segment}-${width}.png`), fullPage: true });
      await page.getByRole("button", { name: "Parties(Party Clause)", exact: true }).click();
      await expect(page.getByText("Alice", { exact: true })).toBeVisible();
      expect(drops).toBe(0);
      expect(errors).toEqual([]);
    });
  }
}
