import { expect, test } from "@playwright/test";

for (const { width, height } of [{ width: 375, height: 812 }, { width: 390, height: 844 }, { width: 768, height: 1024 },
  { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  for (const scenario of ["closing", "acreage", "partial", "source"]) {
    test(`source-first reconstruction ${scenario} at ${width}px`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width, height });
      await page.goto(`/?scenario=legal-map&reconstruction=${scenario}`);
      const table = page.getByRole("table", { name: "Boundary Calls" });
      const unconfirmed = scenario === "closing" ? 1 : scenario === "partial" ? 3 : scenario === "acreage" ? 4 : 0;
      await expect(table.getByRole("row")).toHaveCount(5);
      await expect(table.getByRole("button", { name: "Unconfirmed" })).toHaveCount(unconfirmed);
      await expect(page.locator("[data-survey-line]")).toHaveCount(4);
      await expect(page.locator('[data-survey-line][data-unconfirmed="true"]')).toHaveCount(unconfirmed);
      await expect(page.locator("[data-boundary-fill]")).toHaveAttribute("fill-opacity", scenario === "source" ? "0.25" : "0.12");
      const note = page.getByRole("note");
      await expect(note).toContainText(scenario === "source" ? /contradicts.*source measurements/i
        : scenario === "closing" ? /synthetic closing border.*misclosure/i
          : scenario === "partial" ? /three are fabricated/i : /acreage-based illustration/i);
      if (unconfirmed) {
        const status = table.getByRole("button", { name: "Unconfirmed" }).first();
        await status.scrollIntoViewIfNeeded();
        await expect(status).toBeInViewport();
        await status.focus();
        await expect(page.getByRole("tooltip")).toContainText(scenario === "closing" ? /synthetic/i : /area-derived/i);
        await page.keyboard.press("Escape");
      } else {
        await expect(table).toContainText("100 ft");
        await expect(table).not.toContainText("200 ft");
      }
      const divider = page.getByRole("separator", { name: "Resize map and details" });
      await divider.focus();
      await page.keyboard.press("ArrowUp");
      await expect(page.getByRole("img", { name: /schematic/ })).toBeVisible();
      const fitted = await page.locator("[data-survey-line]").evaluateAll(nodes => nodes.every(node => {
        const line = node.getBoundingClientRect();
        const svg = node.closest("svg")!.getBoundingClientRect();
        return [line.x, line.y, line.width, line.height].every(Number.isFinite)
          && line.left >= svg.left - 1 && line.right <= svg.right + 1 && line.top >= svg.top - 1 && line.bottom <= svg.bottom + 1;
      }));
      expect(fitted).toBe(true);
      if (scenario === "source") {
        await page.getByRole("tab", { name: "Acreage" }).click();
        await expect(page.getByText("Calculated area: 0.1148 acres.")).toBeVisible();
        await expect(page.getByText("1 ACRE", { exact: true })).toBeVisible();
      }
      await expect(page.getByRole("alert")).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(errors).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`reconstruction-${scenario}-${width}.png`), fullPage: true });
    });
  }
}

for (const width of [1440, 390]) {
  test(`condominium detail labels stay unbroken at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/?scenario=legal-map&condominium=true");
    const table = page.getByRole("table", { name: "Details", exact: true });
    const label = table.getByRole("rowheader", { name: "Condominium", exact: true });
    await expect(label).toBeVisible();
    const layout = await label.evaluate(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const value = node.nextElementSibling!;
      return {
        lines: range.getClientRects().length,
        overlaps: range.getBoundingClientRect().right > value.getBoundingClientRect().left,
        valueFits: value.scrollWidth <= value.clientWidth + 1,
      };
    });
    expect(layout).toEqual({ lines: 1, overlaps: false, valueFits: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`condominium-details-${width}.png`), fullPage: true });
  });
}

for (const width of [1440, 390]) {
  test(`matrix boundary retains unassigned measurements beside its synthetic closing border at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/?scenario=legal-map&matrix=true");
    const table = page.getByRole("table", { name: "Boundary Calls" });
    await expect(table.getByRole("row")).toHaveCount(6);
    await expect(table.getByText("Confirmed", { exact: true })).toHaveCount(0);
    await expect(table.getByRole("button", { name: "Unconfirmed" })).toHaveCount(5);
    const status = table.getByRole("button", { name: "Unconfirmed" }).nth(3);
    await expect(page.locator("[data-survey-line]")).toHaveCount(4);
    await expect(page.locator('[data-survey-line][data-unconfirmed="true"]')).toHaveCount(4);
    await expect(page.locator("[data-boundary-fill]")).toHaveCount(1);
    await expect(table.getByRole("row").last()).toContainText("Unassigned");
    await expect(table.getByRole("row").last()).toContainText("400 ft");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await status.hover();
    await expect(page.getByRole("tooltip")).toContainText(/synthetic closing border/i);
    await page.mouse.move(0, 0);
    await status.focus();
    await expect(page.getByRole("tooltip")).toContainText(/synthetic closing border/i);
    await page.keyboard.press("Escape");
    const divider = page.getByRole("separator", { name: "Resize map and details" });
    await divider.focus();
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("img", { name: /schematic/ })).toBeVisible();
    const geometry = await page.locator("[data-survey-line]").evaluateAll(nodes => nodes.map(node => {
      const line = node.getBoundingClientRect();
      const svg = node.closest("svg")!.getBoundingClientRect();
      return Math.hypot(line.width, line.height) > 0 && line.left >= svg.left - 1 && line.right <= svg.right + 1
        && line.top >= svg.top - 1 && line.bottom <= svg.bottom + 1;
    }));
    expect(geometry.every(Boolean)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`matrix-boundary-${width}.png`), fullPage: true });
  });
}

for (const width of [1440, 390]) {
  test(`matrix single-swap recovery closes supplied pairs at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/?scenario=legal-map&matrix=retry");
    const table = page.getByRole("table", { name: "Boundary Calls" });
    await expect(table.getByRole("row")).toHaveCount(4);
    await expect(table.getByText("Confirmed", { exact: true })).toHaveCount(0);
    await expect(table.getByRole("button", { name: "Unconfirmed" })).toHaveCount(3);
    await expect(table.getByRole("row").nth(1)).toContainText("30 ft");
    await expect(table.getByRole("row").nth(2)).toContainText("40 ft");
    await expect(page.locator("[data-survey-line]")).toHaveCount(3);
    await expect(page.locator('[data-survey-line][data-unconfirmed="true"]')).toHaveCount(3);
    await expect(page.locator("[data-boundary-fill]")).toHaveCount(1);
    await expect(page.getByRole("note")).toContainText(/associations inferred/i);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await table.getByRole("button", { name: "Unconfirmed" }).first().hover();
    await expect(page.getByRole("tooltip")).toContainText(/distance association inferred geometrically/i);
    await page.mouse.move(0, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`matrix-rearranged-${width}.png`), fullPage: true });
  });

  test(`invalid source order remains unfilled with trailing curves at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/?scenario=legal-map&matrix=ambiguous");
    const table = page.getByRole("table", { name: "Boundary Calls" });
    await expect(table.getByRole("row")).toHaveCount(8);
    await expect(table.getByText("Confirmed", { exact: true })).toHaveCount(6);
    await expect(table.getByRole("button", { name: "Unconfirmed" })).toHaveCount(1);
    await expect(table.getByRole("row").last()).toContainText("25 ft");
    await expect(page.locator("[data-boundary-fill]")).toHaveCount(0);
    await expect(page.getByRole("note")).toContainText(/curve/i);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`matrix-ambiguous-${width}.png`), fullPage: true });
  });

  for (const scenario of ["gap", "offset"]) {
    test(`matrix ${scenario} preserves measured rows and outline at ${width}px`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.setViewportSize({ width, height: 1100 });
      await page.goto(`/?scenario=legal-map&matrix=${scenario}`);
      const table = page.getByRole("table", { name: "Boundary Calls" });
      await expect(table.getByText("Confirmed", { exact: true })).toHaveCount(scenario === "gap" ? 0 : 4);
      await expect(table.getByRole("button", { name: "Unconfirmed" })).toHaveCount(scenario === "gap" ? 5 : 1);
      await expect(page.locator("[data-survey-line]")).toHaveCount(scenario === "gap" ? 4 : 5);
      await expect(page.locator("[data-boundary-fill]")).toHaveCount(scenario === "gap" ? 1 : 0);
      await expect(page.getByRole("alert")).toHaveCount(0);
      if (scenario === "offset") {
        await expect(page.locator('[data-survey-tie="true"]')).toHaveCount(1);
        await expect(table.getByRole("row").nth(2)).toContainText("N");
        await expect(table.getByRole("row").nth(3)).toContainText("S");
        await expect(table.getByRole("row").last()).toContainText("5 → 6");
      } else {
        await expect(table.getByRole("row").last()).toContainText("50 ft");
        await expect(table.getByRole("row").last()).toContainText("Unassigned");
        await expect(table.getByRole("row").nth(2)).toContainText("S");
      }
      await expect(page.getByRole("img", { name: /schematic/ })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      expect(errors).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`matrix-${scenario}-${width}.png`), fullPage: true });
    });
  }
}

for (const width of [1440, 900, 390, 320]) {
  test(`street-relative fallback and final failure at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1100 });
    await page.goto("/?scenario=legal-map&street=true");
    const lines = page.locator('[data-survey-line][data-unconfirmed="true"][stroke-dasharray="6 4"]');
    await expect(lines).toHaveCount(4);
    await expect(page.locator("[data-boundary-fill]")).toHaveCount(0);
    await expect(page.locator("[data-survey-point]")).toHaveCount(4);
    await expect(page.getByRole("note")).toContainText(/schematic/i);
    const table = page.getByRole("table", { name: "Boundary Calls" });
    await expect(table.getByRole("row")).toHaveCount(5);
    await expect(table.getByRole("row").last()).toContainText("4 → 1");
    await expect(table.getByText("59 ft 8 in", { exact: true })).toHaveCount(2);
    await expect(table).not.toContainText(/48 ft|3 ft|2 ft 6 in/);
    await expect(page.getByRole("img", { name: /schematic/ })).toBeVisible();
    const geometry = await lines.evaluateAll(nodes => nodes.map(node => {
      const line = node.getBoundingClientRect();
      const svg = node.closest("svg")!.getBoundingClientRect();
      const style = getComputedStyle(node);
      return Number.isFinite(line.x + line.y + line.width + line.height) && Math.hypot(line.width, line.height) > 0
        && style.visibility === "visible" && style.display !== "none"
        && line.left >= svg.left - 1 && line.right <= svg.right + 1
        && line.top >= svg.top - 1 && line.bottom <= svg.bottom + 1;
    }));
    expect(geometry.every(Boolean)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    const status = table.getByRole("button", { name: "Unconfirmed" }).first();
    await status.hover();
    await expect(page.getByRole("tooltip")).toContainText(/schematic/i);
    await page.mouse.move(0, 0);
    await status.focus();
    await expect(status).toBeFocused();
    await expect(page.getByRole("tooltip")).toContainText(/schematic/i);
    await page.keyboard.press("Escape");
    await page.screenshot({ path: testInfo.outputPath(`street-boundary-${width}.png`), fullPage: true });
    await page.goto("/?scenario=legal-map&street=unsupported");
    await expect(page.locator("[data-survey-line]")).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveText("Sorry, this parcel’s boundary couldn’t be drawn from the available details.");
    await expect(page.getByText("16 ft FRONTAGE", { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`street-unsupported-${width}.png`), fullPage: true });
    await page.goto("/?scenario=legal-map&metes=1");
    await page.getByRole("tab", { name: "Metes & Bounds", exact: true }).click();
    await expect(page.locator("[data-survey-line]")).toHaveCount(16);
    await expect(page.locator("[data-boundary-fill]")).toHaveCount(2);
    await expect(page.locator('[data-survey-tie="true"]')).toHaveCount(2);
    await expect(page.getByRole("table", { name: "Boundary Calls" })).toHaveCount(2);
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 900, 390]) {
  for (const scope of ["lot_scope", "part"]) {
    test(`single lot with ${scope} preserves readable labels through divider changes at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1100 });
      await page.goto(`/?scenario=legal-map&scope=${scope}`);
      const grid = page.locator("[data-legal-map-grid]");
      const content = grid.locator(":scope > div");
      const divider = page.getByRole("separator", { name: "Resize map and details" });
      const aspect = page.getByRole("table", { name: "Details" });
      const block = page.locator("[data-legal-map-block]");
      await expect(page.locator("[data-legal-map-fit]")).toHaveCount(0);
      await expect(aspect).toContainText("EASTERLY 40 FEET OF THE WESTERLY 80 FEET");
      await expect(page.getByRole("table", { name: "Details" })).toContainText("SUB NO. 37");
      await divider.focus();
      await page.keyboard.press("Home");
      await expect(divider).toHaveAttribute("aria-valuenow", await divider.getAttribute("aria-valuemin") as string);
      await divider.hover();
      await page.screenshot({ path: testInfo.outputPath(`map-fit-expanded-${scope}-${width}.png`), fullPage: true });
      const expanded = (await block.boundingBox())!;
      const handle = (await divider.boundingBox())!;
      await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(handle.x + handle.width / 2, handle.y - 200, { steps: 10 });
      await page.mouse.up();
      await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(expanded.height, 0);
      const contracted = (await block.boundingBox())!;
      const moved = (await divider.boundingBox())!;
      await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2);
      await page.mouse.down();
      await page.mouse.move(moved.x + moved.width / 2, moved.y + 150, { steps: 10 });
      await page.mouse.up();
      await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(contracted.height, 0);
      await divider.focus();
      await expect(divider).toBeFocused();
      await page.keyboard.press("End");
      await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(contracted.height, 0);
      await page.keyboard.press("Home");
      await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(expanded.height, 0);
      const detailsHeight = Number(await divider.getAttribute("aria-valuenow"));
      await page.keyboard.press("ArrowUp");
      await expect.poll(async () => Number(await divider.getAttribute("aria-valuenow"))).toBeGreaterThan(detailsHeight);
      await page.keyboard.press("ArrowDown");
      await expect(divider).toHaveAttribute("aria-valuenow", String(detailsHeight));
      await page.keyboard.press("ArrowUp");
      await page.setViewportSize({ width, height: 800 });
      await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(expanded.height, 0);
      const layout = await grid.evaluate(node => {
        const bounds = node.getBoundingClientRect();
        const content = node.firstElementChild!.getBoundingClientRect();
        const header = document.querySelector(".legal-map-toolbar")!.getBoundingClientRect();
        const details = document.querySelector("[data-legal-map-info]")!.getBoundingClientRect();
        const divider = document.querySelector(".legal-map-divider")!.getBoundingClientRect();
        return {
          fits: node.scrollHeight <= node.clientHeight + 1 && node.scrollWidth <= node.clientWidth + 1,
          contained: content.x >= bounds.x && content.right <= bounds.right && content.y >= bounds.y && content.bottom <= bounds.bottom,
          headerClear: bounds.y >= header.bottom,
          detailsClear: details.y >= divider.bottom && divider.y >= document.querySelector(".legal-map-column")!.getBoundingClientRect().bottom,
        };
      });
      expect(layout).toEqual({ fits: true, contained: true, headerClear: true, detailsClear: true });
      await expect(aspect).toBeVisible();
      await expect(page.locator("[data-legal-map-lot]")).toHaveText("SUB NO. 37Lot");
      await page.screenshot({ path: testInfo.outputPath(`map-fit-${scope}-${width}.png`), fullPage: true });
      const saved = (await block.boundingBox())!;
      await page.reload();
      await expect(page.locator("[data-legal-map-fit]")).toHaveCount(0);
      await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(saved.height, 0);
    });
  }
}



for (const width of [1440, 900, 390]) {
  test(`property map tabs and address fit at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("https://www.google.com/maps**", route => route.fulfill({ contentType: "text/html", body: "<html><body>Google map test response</body></html>" }));
    await page.goto("/?scenario=legal-map&address=true&parcels=1");
    const plat = page.getByRole("tab", { name: "Lot & block" });
    const address = page.getByRole("tab", { name: "Address" });
    await expect(plat).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: "Address" })).toHaveCount(0);
    const layout = await page.locator(".legal-map").evaluate(node => {
      const tabs = node.querySelector("[role=tablist]")!.getBoundingClientRect();
      const map = node.querySelector("[data-legal-map-surface]")!.getBoundingClientRect();
      const label = node.querySelector("[data-legal-map-grid]")!.querySelector("[data-legal-map-subdivision]")!.previousElementSibling!.getBoundingClientRect();
      return {
        fits: node.scrollWidth <= node.clientWidth,
        tabsFit: tabs.right <= map.right && tabs.left >= map.left && tabs.bottom <= map.top,
        titleClear: label.top >= tabs.bottom,
        mapHeight: map.height,
      };
    });
    expect(layout).toMatchObject({ fits: true, tabsFit: true, titleClear: true });
    expect(layout.mapHeight).toBeGreaterThan(200);
    await page.screenshot({ path: testInfo.outputPath(`map-plat-${width}.png`), fullPage: true });
    await plat.focus();
    await page.keyboard.press("ArrowRight");
    await expect(address).toBeFocused();
    await expect(page.getByRole("tabpanel")).toHaveAccessibleName("Address");
    const iframe = page.getByTitle("Address map");
    await expect(iframe).toBeVisible();
    const overlay = await page.getByRole("tablist").boundingBox();
    await expect(iframe).toHaveAttribute("src", /www\.google\.com\/maps\?q=123%20Main.*&z=14$/);
    const bounds = await iframe.boundingBox();
    expect(bounds!.width).toBeGreaterThan(250);
    expect(bounds!.height).toBeGreaterThan(200);
    expect(overlay!.y + overlay!.height).toBeLessThanOrEqual(bounds!.y);
    expect(overlay!.x + overlay!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
    await page.screenshot({ path: testInfo.outputPath(`map-address-${width}.png`), fullPage: true });
    await address.focus();
    await page.keyboard.press("Home");
    await expect(plat).toBeFocused();
    await expect(page.locator("[data-legal-map-lot]")).toHaveCount(1);
    await expect(page.getByTitle("Address map")).toHaveCount(0);
  });
}

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
  await expect(page.getByRole("dialog", { name: "Lot & block" })).toHaveCount(0);
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
  await expect(page.locator("[data-legal-map-footer='true']")).toContainText("Subdivision");
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
    await expect(page.locator("[data-legal-map-info]")).toContainText("Summary");
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

for (const width of [390, 1440]) {
  test(`Metes property illustration remains closed after reload at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?scenario=legal-map&reconstruction=property");
    await expect(page.locator("[data-survey-line]")).toHaveCount(10);
    await expect(page.locator('[data-survey-line][data-unconfirmed="true"]')).toHaveCount(1);
    await expect(page.locator("[data-boundary-fill]")).toHaveCount(1);
    await expect(page.getByRole("table", { name: "Boundary Calls" }).getByText("Confirmed", { exact: true })).toHaveCount(9);
    await page.getByRole("tab", { name: "Acreage" }).click();
    await expect(page.getByText("Calculated area: 30.2099 acres.")).toBeVisible();
    await page.getByRole("tab", { name: "Boundary Calls" }).click();
    const outline = await page.locator("[data-boundary-fill]").getAttribute("d");
    await page.screenshot({ path: testInfo.outputPath(`metes-property-${width}.png`), fullPage: true });
    await page.reload();
    await expect(page.locator("[data-boundary-fill]")).toHaveAttribute("d", outline!);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });

  test(`Metes existing curves retain their geometry at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?scenario=legal-map&curves=true");
    await expect(page.locator("[data-survey-line]")).toHaveCount(27);
    await expect(page.locator("[data-survey-arc]")).toHaveCount(12);
    await expect(page.getByRole("table", { name: "Boundary Calls" }).getByRole("row")).toHaveCount(28);
    await expect(page.getByRole("alert")).toHaveCount(0);
    const divider = page.getByRole("separator", { name: "Resize map and details" });
    await divider.focus();
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("img", { name: /schematic/ })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`metes-curves-${width}.png`), fullPage: true });
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
