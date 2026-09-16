import { expect, test } from "@playwright/test";

test("image viewer package flow renders toolbar and lens controls", async ({ page }) => {
  await page.setViewportSize({ width: 1880, height: 1334 });
  await page.goto("/?scenario=imageviewer");

  await expect(page.locator("#visual-stage")).toHaveAttribute(
    "data-image-loader",
    '["Backend is generating the image package"]',
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
  await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear selections" })).toBeVisible();
  await expect(page.getByRole("button", { name: "First page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Last page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
  await expect(page.getByLabel("Current scale")).toHaveText("100%");
  await expect(page.getByRole("button", { name: "Scale options" })).toBeVisible();
  for (const name of ["Zoom in", "Zoom out", "Scale options", "Export", "First page", "Last page"]) {
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
  const exportButton = page.getByRole("button", { name: "Export" });
  const clearButton = page.getByRole("button", { name: "Clear selections" });
  const controls = await Promise.all([searchBox, searchButton, selectButton, exportButton, clearButton].map((locator) => locator.boundingBox()));
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
  await expect(exitSelectMode).toHaveAttribute("data-variant", "primary");
  await page.mouse.move(0, 0);
  await expect(exitSelectMode).toHaveCSS("background-color", "rgb(0, 139, 163)");
  await exitSelectMode.click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-draw-mode", "false");
  await expect(page.getByRole("button", { exact: true, name: "Select" })).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("searchbox", { name: "Search image text" }).fill("Cedar Street");
  await page.getByRole("button", { exact: true, name: "Search" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-search-text", "Cedar Street");
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
  const primaryRow = toolbar.locator("[data-image-viewer-toolbar-row='primary']");
  await expect(primaryRow).toBeVisible();
  const lens = page.locator("[data-document-lens-host='true']");
  await expect(lens).toHaveAttribute("data-current-page", "2");
  await expect(page.locator("[aria-label='Image viewer footer toolbar']")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("compact-imageviewer-image-mode.png") });
});

test("image viewer toolbar wraps without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 900 });
  await page.goto("/?scenario=imageviewer&compact");
  await page.evaluate(() => {
    window.completeDocumentPackage = true;
  });

  const toolbar = page.locator("[aria-label='Image viewer top toolbar']");
  const controls = page.locator("[aria-label='Image view controls']");
  const search = page.locator("[aria-label='Image text search']");
  await expect(toolbar).toBeVisible();
  await expect(controls).toBeVisible();
  await expect(search).toBeVisible();
  expect(await toolbar.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const controlsBox = await controls.boundingBox();
  const searchBox = await search.boundingBox();
  expect(searchBox?.y).toBeGreaterThan((controlsBox?.y ?? 0));
});
