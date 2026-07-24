import { expect, test } from "@playwright/test";

test("image viewer package flow renders toolbar and lens controls", async ({ page }) => {
  await page.setViewportSize({ width: 1880, height: 1334 });
  await page.goto("/?scenario=imageviewer");

  await expect(page.getByRole("progressbar", { name: "image viewer progress" })).toBeVisible();
  await page.evaluate(() => {
    window.completeDocumentPackage = true;
  });
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toBeVisible();
  await expect(page.locator("[aria-label='Image viewer footer toolbar']")).toBeVisible();
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toHaveCSS("background-color", "rgb(248, 250, 252)");
  await expect(page.locator("[aria-label='Image viewer footer toolbar']")).toHaveCSS("background-color", "rgb(248, 250, 252)");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveCSS("background-color", "rgb(248, 250, 252)");
  await expect(page.locator("[aria-label='Image view controls']")).toBeVisible();
  await expect(page.locator("[aria-label='Image text search']")).toBeVisible();
  expect(await page.locator("[aria-label='Image view controls']").evaluate((controls) => {
    const search = document.querySelector("[aria-label='Image text search']");
    return search ? Boolean(controls.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
  })).toBe(true);
  await expect(page.getByText("Page 2 of 4")).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search image text" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Actual size" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear search" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fit height" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fit page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fit width" })).toBeVisible();
  await expect(page.getByRole("button", { name: "First page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Last page" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
  await expect(page.locator("[data-document-lens-host='true']")).toBeVisible();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-allow-edit", "false");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-decoded-page", "2");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-decoded-page-index", "1");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-file-size", "812422");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-file-type", "image/tiff");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-metadata-pages", "5");
  await expect(page.locator("#visual-stage")).toHaveAttribute("data-job-event", "image.download:completed");

  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-zoom", "in");
  await page.getByRole("button", { name: "Zoom out" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-zoom", "out");

  await page.getByRole("button", { name: "Fit width" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-fit", "width");
  await page.getByRole("button", { name: "Fit height" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-fit", "height");
  await page.getByRole("button", { name: "Fit page" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-fit", "page");
  await page.getByRole("button", { name: "Actual size" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-fit", "actual");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-current-page", "3");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-current-page-index", "2");
  await expect(page.getByText("Page 3 of 4")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "image viewer progress" })).toHaveCount(0);

  await page.getByRole("button", { name: "Select" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-draw-mode", "true");
  const exitSelectMode = page.getByRole("button", { name: "Exit select mode" });
  await expect(exitSelectMode).toHaveAttribute("aria-pressed", "true");
  await expect(exitSelectMode).toHaveAttribute("data-variant", "primary");
  await page.mouse.move(0, 0);
  await expect(exitSelectMode).toHaveCSS("background-color", "rgb(7, 143, 162)");
  await exitSelectMode.click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-draw-mode", "false");
  await expect(page.getByRole("button", { name: "Select" })).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("searchbox", { name: "Search image text" }).fill("Cedar Street");
  await page.getByRole("button", { exact: true, name: "Search" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-search-text", "Cedar Street");
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByRole("searchbox", { name: "Search image text" })).toHaveValue("");
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-selection", "clear");

  await page.getByRole("button", { name: "Thumbnails" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-thumbnails", "open");
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toHaveCount(0);
  await expect(page.locator("[aria-label='Image viewer footer toolbar']")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /add|remove|reorder|export|draw/i })).toHaveCount(0);
});
