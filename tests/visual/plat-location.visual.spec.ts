import { expect, test } from "@playwright/test";

for (const width of [1440, 900, 390]) {
  test(`location follows the fitted subdivision at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1100 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/?scenario=legal-map&rows=true&count=1");
    const location = page.locator("[data-legal-map-location]");
    const grid = page.locator("[data-legal-map-grid]");
    const divider = page.getByRole("separator", { name: "Resize map and details" });
    await expect(location).toHaveText("Texas | Bexar County | San Antonio");
    const verify = async () => {
      await location.scrollIntoViewIfNeeded();
      await expect(location).toBeInViewport();
      const box = (await location.boundingBox())!;
      const drawing = (await grid.locator(":scope > div").first().boundingBox())!;
      const footer = (await page.locator("[data-legal-map-footer]").boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(drawing.y + drawing.height - 1);
      expect(box.y - drawing.y - drawing.height).toBeLessThanOrEqual(20);
      expect(box.y + box.height).toBeLessThanOrEqual(footer.y + 1);
      expect(Math.abs(box.x + box.width / 2 - drawing.x - drawing.width / 2)).toBeLessThanOrEqual(1);
      expect(await location.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    };
    await verify();
    await page.screenshot({ path: testInfo.outputPath(`location-below-subdivision-${width}.png`), fullPage: true });
    for (const key of ["End", "Home"]) {
      await divider.focus();
      await page.keyboard.press(key);
      await verify();
    }
    expect(errors).toEqual([]);
  });
}
