import { devices, expect, test } from "@playwright/test";

test.use({ ...devices["Desktop Edge"], channel: "msedge" });

const message = "The pages export result could not be decoded: the JSON is incomplete.";

for (const width of [1440, 390]) {
  test(`isolates Pages failures, removes stale rows, and recovers at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    let failing = true;
    let pageNumber = "1";
    const auditSessions: string[] = [];
    await page.route("https://doc.example.com/v1/metadata/*/data", route => route.fulfill({ json: {
      status: "completed", data: "https://storage.example.com/metadata.json", etag: "metadata-etag",
    } }));
    await page.route("https://storage.example.com/metadata.json", route => route.fulfill({ json: {
      heading: { class: "deed", title: "Warranty Deed" }, fees: [], funds: [], secrets: [],
      indexes: [{ code: "party-1", label: "grantor", page_number: "1", segment: "party", value: "Alice" }],
    } }));
    await page.route("https://doc.example.com/v1/content/*/pages", route => {
      const session = route.request().url().split("/").at(-2);
      return session === "first" && failing
        ? route.fulfill({ status: 500, json: { code: "content_result_invalid", message } })
        : route.fulfill({ json: { status: "completed", data: "https://storage.example.com/pages.json", etag: "pages-etag" } });
    });
    await page.route("https://storage.example.com/pages.json", route => route.fulfill({ json: {
      num_of_pages: 1, recordables: [{ code: `page-${pageNumber}`, name: pageNumber, class: "instrument", segments: ["party"] }],
    } }));
    await page.route("https://doc.example.com/v1/metadata/*/audit", route => {
      auditSessions.push(route.request().url().split("/").at(-2)!);
      return route.fulfill({ json: { status: "completed", data: "https://storage.example.com/audit.json" } });
    });
    await page.route("https://storage.example.com/audit.json", route => route.fulfill({ json: { gaps: [] } }));
    await page.goto("/?scenario=pages");
    expect(await page.evaluate(() => navigator.userAgent)).toContain("Edg/");
    const badge = page.getByRole("button", { name: "Pages error" });
    const pages = page.getByRole("button", { name: "Pages", exact: true });
    const count = pages.locator("..").locator(":scope > :last-child");
    await expect(page.getByLabel("Metadata state")).toHaveText("success");
    await expect(badge).toBeVisible();
    await expect(count).toHaveText("");
    await expect(page.getByText("No recordables pages found.")).toHaveCount(0);
    await expect.poll(() => auditSessions).toContain("first");
    await expect(page.locator("body")).not.toHaveAttribute("data-view-error");
    await badge.hover();
    await expect(page.getByRole("tooltip")).toHaveText(message);
    const bounds = await badge.boundingBox();
    const header = await pages.locator("..").boundingBox();
    const titleCount = await page.getByRole("button", { name: "Titles", exact: true }).locator("..").locator(":scope > :last-child").boundingBox();
    expect(bounds!.height).toBe(titleCount!.height);
    expect(bounds!.width).toBe(titleCount!.width);
    expect(await badge.evaluate(node => getComputedStyle(node).boxShadow)).toBe("none");
    const tooltip = await page.locator("[data-radix-popper-content-wrapper]").boundingBox();
    expect(tooltip!.x).toBeGreaterThanOrEqual(4);
    expect(tooltip!.x + tooltip!.width).toBeLessThanOrEqual(width - 4);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width - 15);
    expect(Math.abs(bounds!.y + bounds!.height / 2 - (header!.y + header!.height / 2))).toBeLessThan(2);
    await page.screenshot({ path: `artifacts/pages-error-${width}.png`, fullPage: true });
    await page.mouse.move(0, 0);
    await page.getByRole("button", { name: "Refresh metadata" }).focus();
    for (let step = 0; step < 5; step++) {
      await page.keyboard.press("Tab");
      if (await badge.evaluate(node => node === document.activeElement)) break;
    }
    await expect(badge).toBeFocused();
    expect(await badge.evaluate(node => {
      const style = getComputedStyle(node);
      const bounds = node.getBoundingClientRect();
      const outline = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
      if (style.outlineStyle !== "solid" || parseFloat(style.outlineWidth) < 2) return false;
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        if (getComputedStyle(parent).overflowX === "visible") continue;
        const clip = parent.getBoundingClientRect();
        if (bounds.left - outline < clip.left || bounds.right + outline > clip.right) return false;
      }
      return true;
    })).toBe(true);
    await expect(page.getByRole("tooltip")).toHaveText(message);
    await page.screenshot({ path: `artifacts/pages-focus-${width}.png`, fullPage: true });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await page.getByRole("button", { name: "Parties(Party Clause)", exact: true }).click();
    await expect(page.getByText("Alice", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Reopen metadata" }).click();
    await expect(page.getByLabel("Metadata state")).toHaveText("success");
    await expect(badge).toBeVisible();
    await expect(count).toHaveText("");

    await page.getByRole("button", { name: "Switch session" }).click();
    await expect(badge).toHaveCount(0);
    await expect(page.getByText("1 : Instrument page")).toBeVisible();
    await page.getByRole("button", { name: "Switch session" }).click();
    await expect(badge).toBeVisible();
    await expect(page.getByText("1 : Instrument page")).toHaveCount(0);

    failing = false;
    await page.getByRole("button", { name: "Refresh metadata" }).click();
    await expect(badge).toHaveCount(0);
    await expect(page.getByText("1 : Instrument page")).toBeVisible();
    await expect(count).toHaveText("1");
    failing = true;
    await page.getByRole("button", { name: "Refresh metadata" }).click();
    await expect(badge).toBeVisible();
    await expect(page.getByText("1 : Instrument page")).toHaveCount(0);
    await expect(page.getByLabel("Metadata state")).toHaveText("success");
    failing = false;
    pageNumber = "2";
    await page.getByRole("button", { name: "Refresh metadata" }).click();
    await expect(page.getByText("2 : Instrument page")).toBeVisible();
    await expect(page.getByText("1 : Instrument page")).toHaveCount(0);
    await expect(count).toHaveText("1");
    await expect(badge).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Metadata accordion" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/pages-recovered-${width}.png`, fullPage: true });
  });
}
