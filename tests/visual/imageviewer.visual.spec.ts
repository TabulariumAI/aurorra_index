import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("image viewer package flow renders toolbar and lens controls", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1880, height: 1334 });
  await page.goto("/?scenario=imageviewer");

  await expect(page.locator("#visual-stage")).toHaveAttribute(
    "data-image-loader",
    '["Generating the image package"]',
  );
  await expect(page.locator("#visual-stage")).toHaveAttribute("data-image-ready", "false");
  await expect(page.getByRole("progressbar", { name: "image viewer progress" })).toHaveCount(0);
  await page.evaluate(() => {
    window.completeDocumentPackage = true;
  });
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toBeVisible();
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toHaveCSS("display", "grid");
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toHaveCSS("padding-top", "8.8px");
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toHaveCSS("padding-bottom", "8.8px");
  await expect(page.locator("[aria-label='Image viewer footer toolbar']")).toBeVisible();
  await expect(page.locator("[aria-label='Image viewer footer toolbar']")).toHaveCSS("padding-top", "8.8px");
  await expect(page.locator("[aria-label='Image viewer footer toolbar']")).toHaveCSS("padding-bottom", "8.8px");
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toHaveCSS("background-color", "rgb(248, 250, 252)");
  await expect(page.locator("[aria-label='Image viewer footer toolbar']")).toHaveCSS("background-color", "rgb(248, 250, 252)");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveCSS("background-color", "rgb(248, 250, 252)");
  await expect(page.locator("[aria-label='Image view controls']")).toBeVisible();
  await expect(page.locator("[aria-label='Scale controls']")).toBeVisible();
  await expect(page.locator("[aria-label='Image text search']")).toBeVisible();
  expect(await page.locator("[aria-label='Image view controls']").evaluate((controls) => {
    const search = document.querySelector("[aria-label='Image text search']");
    return search ? Boolean(controls.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
  })).toBe(true);
  await expect(page.getByText("Page 2 of 4")).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search image text" })).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "Select" })).toBeVisible();
  await expect(page.getByRole("button", { name: "More" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear selections" })).toBeVisible();
  await expect(page.getByRole("button", { name: "First page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Last page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
  await expect(page.getByLabel("Current scale")).toHaveText("100%");
  await expect(page.getByRole("button", { name: "Scale options" })).toBeVisible();
  for (const name of ["Zoom in", "Zoom out", "Scale options", "More", "First page", "Last page"]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveCSS("background-color", "rgb(255, 255, 255)");
  }
  const zoomIn = page.getByRole("button", { name: "Zoom in", exact: true });
  await zoomIn.hover();
  await expect(zoomIn).toHaveCSS("background-color", "rgb(224, 243, 255)");
  await page.mouse.move(0, 0);
  await zoomIn.focus();
  await expect(zoomIn).toHaveCSS("background-color", "rgb(224, 243, 255)");
  await page.getByRole("searchbox", { name: "Search image text" }).focus();
  await expect(zoomIn).toHaveCSS("background-color", "rgb(255, 255, 255)");
  const searchBox = page.getByRole("searchbox", { name: "Search image text" });
  const searchButton = page.getByRole("button", { exact: true, name: "Search" });
  const selectButton = page.getByRole("button", { exact: true, name: "Select" });
  const moreButton = page.getByRole("button", { name: "More" });
  const clearButton = page.getByRole("button", { name: "Clear selections" });
  const controls = await Promise.all([searchBox, searchButton, selectButton, clearButton, moreButton].map((locator) => locator.boundingBox()));
  expect(controls[1]?.x).toBeGreaterThan((controls[0]?.x ?? 0) + (controls[0]?.width ?? 0) - 1);
  const centers = controls.map((box) => box ? box.y + box.height / 2 : null);
  expect(Math.max(...centers.filter((center): center is number => center !== null)) - Math.min(...centers.filter((center): center is number => center !== null))).toBeLessThan(2);
  expect(controls[0]?.x).toBeLessThan(controls[1]?.x ?? 0);
  expect(controls[1]?.x).toBeLessThan(controls[2]?.x ?? 0);
  expect(controls[2]?.x).toBeLessThan(controls[3]?.x ?? 0);
  expect(controls[3]?.x).toBeLessThan(controls[4]?.x ?? 0);
  await expect(page.locator("[data-document-lens-host='true']")).toBeVisible();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-allow-edit", "false");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-decoded-page", "2");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-decoded-page-index", "1");
  const fileSize = await page.locator("[data-document-lens-host='true']").getAttribute("data-file-size");
  expect(Number(fileSize)).toBeGreaterThan(0);
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-file-type", "image/tiff");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-metadata-pages", "5");
  await expect(page.locator("#visual-stage")).toHaveAttribute("data-image-ready", "true");
  await expect(page.locator("#visual-stage")).not.toHaveAttribute("data-image-loader");

  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-zoom", "in");
  await expect(page.getByLabel("Current scale")).toHaveText("120%");
  await page.getByRole("button", { name: "Zoom out" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-zoom", "out");
  await expect(page.getByLabel("Current scale")).toHaveText("100%");

  const scaleOptions = page.getByRole("button", { name: "Scale options" });
  await scaleOptions.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("group", { name: "Scale options" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("group", { name: "Scale options" })).toHaveCount(0);
  await expect(scaleOptions).toBeFocused();
  await scaleOptions.click();
  await expect(page.getByRole("group", { name: "Scale options" })).toBeVisible();
  await page.getByRole("button", { name: "Fit width" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-fit", "width");
  await expect(page.getByLabel("Current scale")).toHaveText("75%");
  await scaleOptions.click();
  await page.getByRole("button", { name: "Fit height" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-fit", "height");
  await expect(page.getByLabel("Current scale")).toHaveText("60%");
  await scaleOptions.click();
  await page.getByRole("button", { name: "Fit page" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-fit", "page");
  await expect(page.getByLabel("Current scale")).toHaveText("50%");
  await scaleOptions.click();
  await page.getByRole("button", { name: "Actual size" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-fit", "actual");
  await expect(page.getByLabel("Current scale")).toHaveText("100%");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-current-page", "3");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-current-page-index", "2");
  await expect(page.getByText("Page 3 of 4")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "image viewer progress" })).toHaveCount(0);

  await page.getByRole("button", { exact: true, name: "Select" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-draw-mode", "true");
  const exitSelectMode = page.getByRole("button", { name: "Exit select mode" });
  await expect(exitSelectMode).toHaveAttribute("aria-pressed", "true");
  await expect(exitSelectMode).toHaveAttribute("data-variant", "secondary");
  await page.mouse.move(0, 0);
  await expect(exitSelectMode).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(exitSelectMode).toHaveCSS("color", "rgb(0, 93, 108)");
  await page.screenshot({ path: testInfo.outputPath("active-select-mode.png") });
  await exitSelectMode.click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-draw-mode", "false");
  await expect(page.getByRole("button", { exact: true, name: "Select" })).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("searchbox", { name: "Search image text" }).fill("Cedar Street");
  await page.getByRole("button", { exact: true, name: "Search" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-search-text", "Cedar Street");
  await page.getByRole("button", { name: "More" }).click();
  await expect(page.getByRole("group", { name: "Selection actions" })).toBeVisible();
  await page.context().grantPermissions(["clipboard-write"]);
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-selection", "copied");
  await page.getByRole("button", { name: "Clear selections" }).click();
  await expect(page.getByRole("searchbox", { name: "Search image text" })).toHaveValue("");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-selection", "clear");

  await page.getByRole("button", { name: "Thumbnails" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-thumbnails", "open");
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toHaveCount(0);
  await expect(page.locator("[aria-label='Image viewer footer toolbar']")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /add|remove|reorder|export|draw/i })).toHaveCount(0);
});

test("image viewer disables metadata actions when the current page has no metadata", async ({ page }) => {
  await page.setViewportSize({ width: 1880, height: 1334 });
  await page.goto("/?scenario=imageviewer&metadata=missing");
  await page.evaluate(() => {
    window.completeDocumentPackage = true;
  });

  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toBeVisible();
  await expect(page.locator("[aria-label='Image text search']")).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "Select" })).toBeDisabled();
  await page.getByRole("searchbox", { name: "Search image text" }).fill("Cedar Street");
  await expect(page.getByRole("button", { exact: true, name: "Search" })).toBeDisabled();
  await expect(page.locator("[data-document-lens-host='true']")).toBeVisible();
});

test("image viewer shows a visible no-match result in Edge", async ({ page }, testInfo) => {
  await page.goto("/?scenario=imageviewer");
  await page.evaluate(() => { window.completeDocumentPackage = true; });
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-decoded-page", "2");
  await page.getByRole("searchbox", { name: "Search image text" }).fill("Cedar Street");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.evaluate(() => window.clearVisualMatches?.());
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("button", { name: "Match", exact: true }).click();
  const result = page.getByRole("status", { name: "Index match result" });
  await expect(result).toBeVisible();
  await expect(result).toHaveText("No matching index found");
  const resultBox = await result.boundingBox();
  const viewerBox = await page.getByRole("region", { name: "Image viewer" }).boundingBox();
  expect(resultBox!.x).toBeGreaterThanOrEqual(viewerBox!.x);
  expect(resultBox!.x + resultBox!.width).toBeLessThanOrEqual(viewerBox!.x + viewerBox!.width);
  await page.screenshot({ path: testInfo.outputPath("no-match-result.png") });
  await page.evaluate(() => window.searchVisualIndex?.("1428 Cedar Street"));
  await expect(result).toHaveCount(0);
});

test("compact image viewer keeps the toolbar grid and image mode", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 440, height: 900 });
  await page.goto("/?scenario=imageviewer&compact");
  await page.evaluate(() => {
    window.completeDocumentPackage = true;
  });

  const toolbar = page.locator("[aria-label='Image viewer top toolbar']");
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveCSS("display", "grid");
  await expect(toolbar).toHaveCSS("padding-top", "8.8px");
  await expect(toolbar).toHaveCSS("padding-bottom", "8.8px");
  await expect(toolbar.getByLabel("Image view controls")).toBeVisible();
  const lens = page.locator("[data-document-lens-host='true']");
  await expect(lens).toHaveAttribute("data-current-page", "2");
  await expect(page.locator("[aria-label='Image viewer footer toolbar']")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("compact-imageviewer-image-mode.png") });
});

test("image viewer keeps fixed controls and hides search below its usable width", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 700, height: 900 });
  await page.goto("/?scenario=imageviewer&compact");
  await page.evaluate(() => { window.completeDocumentPackage = true; });

  const toolbar = page.getByLabel("Image viewer top toolbar");
  const controls = page.getByLabel("Image view controls");
  const search = page.getByLabel("Image text search");
  const input = page.getByRole("searchbox", { name: "Search image text" });
  await expect(search).toBeVisible();
  const wideInputWidth = (await input.boundingBox())?.width ?? 0;
  const viewWidth = (await controls.boundingBox())?.width;
  const scaleSize = await page.getByRole("button", { name: "Scale options" }).boundingBox();
  const moreSize = await page.getByRole("button", { name: "More" }).boundingBox();
  expect(scaleSize).toMatchObject({ width: moreSize?.width, height: moreSize?.height });

  await page.setViewportSize({ width: 500, height: 900 });
  await expect(search).toBeVisible();
  expect((await input.boundingBox())?.width).toBeLessThan(wideInputWidth);
  expect((await input.boundingBox())?.width).toBeGreaterThanOrEqual(112);
  expect((await controls.boundingBox())?.width).toBe(viewWidth);
  const box = await input.locator("..").boundingBox();
  const submit = await page.getByRole("button", { name: "Search", exact: true }).boundingBox();
  expect((submit?.x ?? 0) + (submit?.width ?? 0)).toBeLessThanOrEqual((box?.x ?? 0) + (box?.width ?? 0));
  expect(submit?.y).toBeGreaterThanOrEqual((box?.y ?? 0) + 1);
  expect((submit?.y ?? 0) + (submit?.height ?? 0)).toBeLessThanOrEqual((box?.y ?? 0) + (box?.height ?? 0) - 1);
  await expect(page.getByRole("button", { name: "Search", exact: true })).toHaveCSS("box-shadow", "none");
  await input.fill("Cedar Street");

  await page.setViewportSize({ width: 320, height: 900 });
  await expect(search).toBeHidden();
  await expect(controls).toBeVisible();
  expect((await controls.boundingBox())?.width).toBe(viewWidth);
  expect(await toolbar.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("single-row-320.png") });

  await page.setViewportSize({ width: 500, height: 900 });
  await expect(search).toBeVisible();
  await expect(input).toHaveValue("Cedar Street");
  const controlsBox = await controls.boundingBox();
  const searchBox = await search.boundingBox();
  expect(Math.abs((searchBox?.y ?? 0) - (controlsBox?.y ?? 0))).toBeLessThanOrEqual(1);
  expect((await input.boundingBox())?.width).toBeGreaterThanOrEqual(112);
  expect(await toolbar.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("single-row-500.png") });
});

for (const width of [1440, 440]) {
  test(`index text no-match feedback matches existing status at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?scenario=imageviewer&compact");
    await page.evaluate(() => { window.completeDocumentPackage = true; });
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-image-ready", "true");
    await page.evaluate(() => window.searchVisualIndex?.("Missing text"));
    const result = page.getByRole("status", { name: "Index match result" });
    await expect(result).toHaveText("Cant match the requested text.");
    await expect(result).toBeVisible();
    await expect(result).toHaveCSS("pointer-events", "none");
    const box = await result.boundingBox();
    const viewer = await page.getByRole("region", { name: "Image viewer" }).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(viewer!.x);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewer!.x + viewer!.width);
    await page.screenshot({ path: testInfo.outputPath("index-no-match.png") });
    await page.getByRole("button", { name: "Zoom out" }).click();
    await expect(result).toHaveCount(0);
    await page.evaluate(() => window.searchVisualIndex?.("Missing text"));
    await expect(result).toBeVisible();
    await page.evaluate(() => window.searchVisualIndex?.("1428 Cedar Street"));
    await expect(result).toHaveCount(0);
  });
}


for (const uncached of [false, true]) {
test(`image package sends metadata etag, renders signed downloads, and recovers without etag (uncached=${uncached})`, async ({ page }) => {
  const requests: unknown[] = [];
  await page.route("https://gateway.example.test/**", async route => {
    if (route.request().url().includes("/metadata/")) {
      expect(uncached).toBe(true);
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "completed", data: "https://storage.example.test/metadata.json?sig=fresh", etag: "visual-etag" }) });
      return;
    }
    expect(route.request().url()).toBe("https://gateway.example.test/v1/image/visual-session-001/package");
    expect(route.request().method()).toBe("POST");
    expect(route.request().headers().authorization).toBe("Bearer token");
    requests.push(route.request().postDataJSON());
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ status: "completed", data: { tiff: "https://storage.example.test/image.tiff?sig=fresh", data: "https://storage.example.test/image.json?sig=fresh" } }) });
  });
  await page.route("https://storage.example.test/**", async route => {
    expect(route.request().url()).toContain("?sig=fresh");
    const tiff = route.request().url().includes("image.tiff");
    await route.fulfill({ contentType: tiff ? "image/tiff" : "application/json", body: route.request().url().includes("metadata.json") ? JSON.stringify({ heading: {}, indexes: [], secrets: [], fees: [], funds: [] }) : readFileSync(`src/test/package/image.${tiff ? "tiff" : "json"}`) });
  });
  await page.goto(`/?scenario=imageviewer&api${uncached ? "&uncached" : ""}`);
  await expect(page.getByText(process.env.AURORA_REAL_LENS === "1" ? "Page 2 of 5" : "Page 2 of 4")).toBeVisible();
  expect(requests).toEqual([{ etag: "visual-etag" }]);
  await page.evaluate(() => window.recoverVisualPackage?.());
  await expect(page.getByText(process.env.AURORA_REAL_LENS === "1" ? "Page 2 of 5" : "Page 2 of 4")).toBeVisible();
  expect(requests).toEqual([{ etag: "visual-etag" }, {}]);
  await expect(page.getByRole("button", { name: "Zoom in", exact: true })).toBeEnabled();
  await expect(page.locator("#visual-stage")).not.toHaveAttribute("data-error");
  if (process.env.AURORA_REAL_LENS === "1") {
    await expect(page.locator("canvas").first()).toBeVisible();
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(page.getByText("Page 3 of 5")).toBeVisible();
    await page.getByRole("button", { name: "Previous page", exact: true }).click();
    await expect(page.getByText("Page 2 of 5")).toBeVisible();
  }
  await page.screenshot({ path: `test-results/image-package-edge-${process.env.AURORA_REAL_LENS === "1" ? "real" : "fixture"}-${uncached ? "uncached" : "cached"}.png` });
});
}
