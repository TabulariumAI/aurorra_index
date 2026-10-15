import { expect, test } from "@playwright/test";

for (const width of [1440, 900]) {
  test(`one parcel retains both block identifiers and one lot at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?scenario=legal-map&parcels=1");
    await expect(page.locator("[data-legal-map-block]")).toHaveCount(1);
    await expect(page.locator("[data-legal-map-lot]")).toHaveCount(1);
    const label = page.locator("[data-legal-map-block-label]");
    await expect(label).toHaveText("1/4482C");
    await expect(page.locator("[data-legal-map-lot]")).toHaveText("32Lot");
    await expect(page.getByText("Phase II", { exact: true })).toBeVisible();
    await expect(page.locator("[data-legal-map-info]")).toContainText("One parcel: Lot 32, Block 1, County Block 4482C");
    await expect(page.getByText("Subdivision", { exact: true })).toBeVisible();
    const layout = await label.evaluate(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const text = range.getBoundingClientRect();
      const block = node.parentElement!.getBoundingClientRect();
      const lot = document.querySelector("[data-legal-map-lot]")!.getBoundingClientRect();
      const grid = document.querySelector("[data-legal-map-grid]")!.getBoundingClientRect();
      const info = document.querySelector("[data-legal-map-info]")!.getBoundingClientRect();
      return {
        textFits: text.x >= block.x && text.right <= block.right && text.y >= block.y && text.bottom <= block.bottom,
        centered: Math.abs(text.x + text.width / 2 - block.x - block.width / 2) < 1,
        lotVisible: lot.x >= grid.x && lot.right <= grid.right && lot.y >= grid.y && lot.bottom <= grid.bottom,
        infoToRight: info.x >= grid.right,
      };
    });
    expect(layout).toEqual({ textFits: true, centered: true, lotVisible: true, infoToRight: true });
    await page.screenshot({ path: `artifacts/legalmap-parcel-${width}.png`, fullPage: true });
    await page.reload();
    await expect(label).toHaveText("1/4482C");
    await page.goto("/?scenario=legal-map&parcels=2");
    await expect(page.locator("[data-legal-map-block-label]")).toHaveText(["1", "4482C"]);
    await expect(page.locator("[data-legal-map-lot]")).toHaveCount(2);
    await page.goto("/?scenario=legal-map&parcels=0");
    await expect(page.locator("[data-legal-map-block-label]")).toHaveText(["1", "4482C"]);
  });
}

test("equal merge weights follow source order and stop at the parcel count", async ({ page }) => {
  await page.goto("/?scenario=legal-map&parcels=2&ties=true");
  await expect(page.locator("[data-legal-map-block-label]")).toHaveText(["1/2", "4482C"]);
  await expect(page.locator("[data-legal-map-lot]")).toHaveCount(2);
});

for (const width of [1440, 900]) {
  test(`merged parcels retain distinct ROW corridors at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?scenario=legal-map&parcels=1&merged-rows=true");
    await expect(page.locator("[data-legal-map-block-label]")).toHaveText("1/4482C");
    await expect(page.locator("[data-legal-map-lot]")).toHaveText("32Lot");
    const bands = page.locator("[data-legal-map-row]");
    await expect(bands).toHaveText(["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"]);
    await expect(page.getByText("Right Of Way", { exact: true })).toBeVisible();
    const geometry = await bands.evaluateAll(nodes => nodes.map(node => {
      const band = node.getBoundingClientRect();
      const parent = node.parentElement!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(node);
      const text = range.getBoundingClientRect();
      return { contained: band.x >= parent.x && band.right <= parent.right && band.y >= parent.y && band.bottom <= parent.bottom,
        textFits: text.x >= band.x && text.right <= band.right && text.y >= band.y && text.bottom <= band.bottom,
        top: band.y, bottom: band.bottom };
    }));
    expect(geometry.every(band => band.contained && band.textFits)).toBe(true);
    expect(geometry[0].bottom).toBeLessThan(geometry[1].top);
    await page.screenshot({ path: `artifacts/legalmap-merged-row-${width}.png`, fullPage: true });
  });
}

test("legal map content renders plat grid", async ({ page }) => {
  await page.goto("/?scenario=legal-map");

  await expect(page.locator("[data-legal-map-grid='true']")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Plat" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Close" })).toHaveCount(0);

  const layout = await page.locator("[data-legal-map-grid='true']").evaluate((node) => ({
    height: node.getBoundingClientRect().height,
    width: node.getBoundingClientRect().width,
  }));

  expect(layout.height).toBeGreaterThan(0);
  expect(layout.width).toBeGreaterThan(0);
  const location = page.locator("#plat-location-bottom");
  const legend = page.getByText("Subdivision", { exact: true });
  await expect(legend).toBeVisible();
  await expect(page.locator("[data-legal-map-info='true']")).toContainText("Subdivision");
  expect(await location.evaluate(node => getComputedStyle(node).fontSize)).toBe(
    await page.getByText("MISSION DEL LAGO UNIT 16A", { exact: true }).evaluate(node => getComputedStyle(node).fontSize),
  );
});

for (const width of [1440, 900]) {
  test(`ROW corridors fit their subdivision at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?scenario=legal-map&rows=true");
    const subdivision = page.locator("[data-legal-map-subdivision]");
    const bands = subdivision.locator("[data-legal-map-row]");
    await expect(subdivision).toHaveCount(1);
    await expect(bands).toHaveText(["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"]);
    await expect(page.getByText("Unit 1", { exact: true })).toBeVisible();
    await expect(page.locator("[data-legal-map-block], [data-legal-map-lot]")).toHaveCount(0);
    await expect(page.locator("[data-legal-map-info]")).toContainText("Description");
    await expect(page.getByText("Right Of Way", { exact: true })).toBeVisible();
    const geometry = await bands.evaluateAll(nodes => nodes.map(node => {
      const band = node.getBoundingClientRect();
      const inner = node.parentElement!.getBoundingClientRect();
      const style = getComputedStyle(node);
      const range = document.createRange();
      range.selectNodeContents(node);
      const text = range.getBoundingClientRect();
      return {
        y: band.y, x: band.x, width: band.width, height: band.height, innerY: inner.y, innerX: inner.x,
        innerWidth: inner.width, innerHeight: inner.height,
        radius: style.borderRadius, hatch: style.backgroundImage, transform: style.transform,
        topBorder: style.borderTopWidth, bottomBorder: style.borderBottomWidth,
        textFits: text.x >= band.x && text.right <= band.right && text.y >= band.y && text.bottom <= band.bottom,
        visible: band.y >= 0 && band.bottom <= window.innerHeight,
        rootSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
      };
    }));
    geometry.forEach((band, index) => {
      expect(band.height).toBeCloseTo(3 * band.rootSize, 0);
      expect(band.innerHeight).toBeGreaterThanOrEqual(24 * band.rootSize);
      expect(band.x).toBeCloseTo(band.innerX, 0);
      expect(band.width).toBeCloseTo(band.innerWidth, 0);
      expect(band.y).toBeCloseTo(band.innerY + (index + 1) * band.innerHeight / 3 - band.height / 2, 0);
      expect(band.radius).toBe("0px");
      expect(band.hatch).toContain("repeating-linear-gradient");
      expect(band.topBorder).toBe("1px");
      expect(band.bottomBorder).toBe("1px");
      expect(band.textFits).toBe(true);
      expect(band.visible).toBe(true);
    });
    expect(geometry[0].y + geometry[0].height).toBeLessThan(geometry[1].y);
    const unit = await page.getByText("Unit 1", { exact: true }).boundingBox();
    expect(unit!.y).toBeGreaterThan(geometry[0].y + geometry[0].height);
    expect(unit!.y + unit!.height).toBeLessThan(geometry[1].y);
    await page.screenshot({ path: `artifacts/legalmap-row-${width}.png`, fullPage: true });
    await page.reload();
    await expect(bands).toHaveText(["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"]);
  });
}

test("a single ROW stays centered and ordinary maps keep their existing hierarchy", async ({ page }) => {
  await page.goto("/?scenario=legal-map&rows=true&count=1");
  const band = page.locator("[data-legal-map-row]");
  await expect(band).toHaveCount(1);
  expect(await band.evaluate(node => (node as HTMLElement).style.top)).toBe("50%");
  await page.goto("/?scenario=legal-map");
  await expect(page.locator("[data-legal-map-row]")).toHaveCount(0);
  await expect(page.getByText("Right Of Way", { exact: true })).toHaveCount(0);
  await expect(page.locator("[data-legal-map-subdivision]")).toHaveCount(2);
  await expect(page.locator("[data-legal-map-block]")).toHaveCount(2);
  await expect(page.locator("[data-legal-map-lot]")).toHaveCount(2);
});
