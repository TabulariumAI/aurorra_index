import { expect, test } from "@playwright/test";

test("metadata explanation row collapses and expands inline", async ({ page }) => {
  await page.goto("/?scenario=metadata");

  const stage = page.locator("#visual-stage");
  const header = page.locator("header").first();
  const row = page.locator("article").first();
  const explanation = row.locator('span:not([aria-hidden="true"])').filter({ hasText: "This explanation is intentionally long" });
  const expandButton = page.getByRole("button", { name: "Expand explanation" });
  const quote = row.locator('span:not([aria-hidden="true"])').filter({ hasText: "full quoted source" });
  const quoteButton = page.getByRole("button", { name: "Expand quote" });
  const reprocessLink = page.getByRole("link", { name: "Reprocess" });
  const refineLink = page.getByRole("link", { name: "Refine or Chat" });

  await expect(header).toHaveCSS("position", "sticky");
  await expect(header).toHaveCSS("top", "0px");
  await expect(row.locator('span:not([aria-hidden="true"])').filter({ hasText: "Explanation:" })).toBeVisible();
  await expect(row.locator('span:not([aria-hidden="true"])').filter({ hasText: "Quote:" })).toBeVisible();
  await expect(page.getByText("Alice")).toBeVisible();
  await expect(row).toHaveCSS("box-shadow", "none");
  await expect(reprocessLink).toBeVisible();
  await expect(reprocessLink).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(reprocessLink).toHaveCSS("box-shadow", "none");
  await expect(reprocessLink).toHaveCSS("text-decoration-line", "underline");
  await expect(refineLink).toBeVisible();
  await expect(refineLink).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(refineLink).toHaveCSS("box-shadow", "none");
  await expect(refineLink).toHaveCSS("text-decoration-line", "underline");
  await expect(explanation).toBeVisible();
  await expect(expandButton).toHaveAttribute("aria-expanded", "false");
  await expect(expandButton).toHaveText("[+]");
  await expect(explanation).toHaveCSS("display", "block");
  await expect(expandButton).toHaveCSS("position", "absolute");
  await expect(expandButton).toHaveCSS("box-shadow", "none");
  await expect(expandButton).toHaveCSS("outline-style", "none");
  await expect(explanation).toHaveCSS("white-space", "nowrap");
  await expect(explanation).toHaveCSS("overflow", "hidden");
  await expect(explanation).toHaveCSS("text-overflow", "ellipsis");

  const sameTextFlow = await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll("strong")).find((element) => element.textContent === "Explanation:");
    return label?.parentElement?.textContent?.includes("inline disclosure control") === true;
  });
  expect(sameTextFlow).toBe(true);
  const quoteTextFlow = await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll("strong")).find((element) => element.textContent === "Quote:");
    return label?.parentElement?.textContent?.includes("full quoted source") === true;
  });
  expect(quoteTextFlow).toBe(true);

  const rowBox = await row.boundingBox();
  const buttonBox = await expandButton.boundingBox();
  expect(rowBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(rowBox!.x + rowBox!.width);
  await expect(quoteButton).toHaveAttribute("aria-expanded", "false");
  await expect(quoteButton).toHaveText("[+]");
  await expect(quoteButton).toHaveCSS("box-shadow", "none");
  await expect(quoteButton).toHaveCSS("outline-style", "none");
  await expect(quote).toHaveCSS("white-space", "nowrap");
  await expect(quote).toHaveCSS("overflow", "hidden");
  await expect(quote).toHaveCSS("text-overflow", "ellipsis");

  await expandButton.click();

  const collapseButton = page.getByRole("button", { name: "Collapse explanation" });
  const expandedRowBox = await row.boundingBox();
  const expandedButtonBox = await collapseButton.boundingBox();

  await expect(collapseButton).toBeVisible();
  await expect(collapseButton).toHaveText("[-]");
  await expect(explanation).toHaveCSS("white-space", "normal");
  await expect(explanation).toHaveCSS("overflow", "visible");
  await expect(explanation).toHaveCSS("text-overflow", "clip");
  expect(expandedRowBox).not.toBeNull();
  expect(expandedButtonBox).not.toBeNull();
  expect(expandedRowBox!.width).toBe(rowBox!.width);
  expect(expandedButtonBox!.x + expandedButtonBox!.width).toBeLessThanOrEqual(expandedRowBox!.x + expandedRowBox!.width);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);

  await quoteButton.click();

  const collapseQuoteButton = page.getByRole("button", { name: "Collapse quote" });
  const expandedQuoteRowBox = await row.boundingBox();
  const expandedQuoteButtonBox = await collapseQuoteButton.boundingBox();

  await expect(collapseQuoteButton).toBeVisible();
  await expect(collapseQuoteButton).toHaveText("[-]");
  await expect(quote).toHaveCSS("white-space", "normal");
  await expect(quote).toHaveCSS("overflow", "visible");
  await expect(quote).toHaveCSS("text-overflow", "clip");
  expect(expandedQuoteRowBox).not.toBeNull();
  expect(expandedQuoteButtonBox).not.toBeNull();
  expect(expandedQuoteRowBox!.width).toBe(rowBox!.width);
  expect(expandedQuoteButtonBox!.x + expandedQuoteButtonBox!.width).toBeLessThanOrEqual(expandedQuoteRowBox!.x + expandedQuoteRowBox!.width);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);

  await collapseButton.click();

  await expect(page.getByRole("button", { name: "Expand explanation" })).toBeVisible();

  const stageBox = await stage.boundingBox();
  const before = await header.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(before).not.toBeNull();
  expect(Math.abs(before!.y - stageBox!.y)).toBeLessThanOrEqual(1);
  await stage.evaluate((element) => {
    element.scrollTop = 500;
  });
  const after = await header.boundingBox();
  expect(after).not.toBeNull();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(after!.y - stageBox!.y)).toBeLessThanOrEqual(1);
});

test("metadata short rows hide disclosure controls when text fits", async ({ page }) => {
  await page.goto("/?scenario=metadata-short");

  const row = page.locator("article").first();
  const explanation = row.locator('span:not([aria-hidden="true"])').filter({ hasText: "Short explanation" });
  const quote = row.locator('span:not([aria-hidden="true"])').filter({ hasText: "Short quote" });

  await expect(row.getByRole("button", { name: "Expand explanation" })).toHaveCount(0);
  await expect(row.getByRole("button", { name: "Expand quote" })).toHaveCount(0);
  await expect(explanation).toBeVisible();
  await expect(quote).toBeVisible();
});
