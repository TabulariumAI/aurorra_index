import { expect, test, type Locator } from "@playwright/test";

async function lineOffset(text: Locator, button: Locator): Promise<number> {
  const [textBox, iconBox, lineHeight] = await Promise.all([
    text.boundingBox(),
    button.locator("svg").boundingBox(),
    text.evaluate((element) => Number.parseFloat(window.getComputedStyle(element).lineHeight)),
  ]);
  if (!textBox || !iconBox) throw new Error("Disclosure alignment elements are not rendered");
  return Math.abs(iconBox.y + iconBox.height / 2 - (textBox.y + lineHeight / 2));
}

test("metadata explanation row collapses and expands inline", async ({ page }) => {
  await page.goto("/?scenario=metadata");

  const stage = page.locator("#visual-stage");
  const header = page.locator("header").first();
  const row = page.locator("article").first();
  const explanation = row.locator('span:not([aria-hidden="true"])').filter({ hasText: "This explanation is intentionally long" });
  const expandButton = page.getByRole("button", { name: "Expand explanation" });
  const quote = row.locator('span:not([aria-hidden="true"])').filter({ hasText: "full quoted source" });
  const quoteButton = page.getByRole("button", { name: "Expand quote" });
  const value = row.getByRole("link");
  const valueButton = row.getByRole("button", { name: "Expand index value" });
  const reprocessLink = page.getByRole("link", { name: "Reprocess" });
  const refineLink = page.getByRole("link", { name: "Refine or Chat" });
  const copyButton = row.getByRole("button", { name: /Copy value/ });
  const dropButton = row.locator("button.metadata-row-action").last();

  await expect(header).toHaveCSS("position", "sticky");
  await expect(header).toHaveCSS("top", "0px");
  await expect(row.locator('span:not([aria-hidden="true"])').filter({ hasText: "Explanation:" })).toBeVisible();
  await expect(row.locator('span:not([aria-hidden="true"])').filter({ hasText: "Quote:" })).toBeVisible();
  await expect(value).toBeVisible();
  await expect(row).toHaveCSS("box-shadow", "none");
  await expect(reprocessLink).toBeVisible();
  await expect(reprocessLink).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(reprocessLink).toHaveCSS("box-shadow", "none");
  await expect(reprocessLink).toHaveCSS("text-decoration-line", "underline");
  await expect(refineLink).toBeVisible();
  await expect(refineLink).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(refineLink).toHaveCSS("box-shadow", "none");
  await expect(refineLink).toHaveCSS("text-decoration-line", "underline");
  await expect(dropButton).toBeVisible();
  await expect(dropButton).toHaveAttribute("aria-label", "Pop the index");
  await expect(copyButton).toHaveCSS("color", "rgb(0, 139, 163)");
  await expect(dropButton).toHaveCSS("color", "rgb(0, 139, 163)");
  await expect(dropButton).toHaveCSS("box-shadow", "none");
  await dropButton.hover();
  await page.waitForTimeout(350);
  await expect(dropButton).toHaveCSS("color", "rgb(0, 139, 163)");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await dropButton.click();
  await expect(dropButton).toHaveAttribute("data-armed", "true");
  await expect(dropButton).toHaveAttribute("aria-label", "Confirm");
  await expect(dropButton).toHaveAttribute("title", "Confirm");
  await expect(dropButton.locator("[data-confirm-progress='true']")).toBeVisible();
  await expect(dropButton.locator("[data-confirm-progress='true'] > span")).toHaveCSS("transition-duration", "4s");
  await expect(dropButton).toHaveCSS("width", "32px");
  await expect(dropButton).toHaveCSS("height", "32px");
  await expect(page.locator("[data-radix-popper-content-wrapper]")).toHaveCount(0);
  await expect(explanation).toBeVisible();
  await expect(expandButton).toHaveAttribute("aria-expanded", "false");
  await expect(expandButton).toHaveText("");
  await expect(expandButton.locator("svg rect")).toBeVisible();
  await expect(expandButton.locator("svg path")).toHaveCount(2);
  await expect(explanation).toHaveCSS("display", "block");
  await expect(expandButton).toHaveCSS("position", "absolute");
  await expect(expandButton).toHaveCSS("box-shadow", "none");
  await expect(expandButton).toHaveCSS("color", "rgb(32, 37, 45)");
  expect((await expandButton.boundingBox())!.width).toBe(24);
  expect((await expandButton.boundingBox())!.height).toBe(24);
  await expect(explanation.locator("..")).toHaveCSS("min-height", "24px");
  await expect(explanation).toHaveCSS("white-space", "nowrap");
  await expect(explanation).toHaveCSS("overflow", "hidden");
  await expect(explanation).toHaveCSS("text-overflow", "ellipsis");
  await expect(explanation).toHaveCSS("padding-right", "28px");
  expect(await lineOffset(explanation, expandButton)).toBeLessThanOrEqual(1);

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
  await expect(quoteButton).toHaveText("");
  await expect(quoteButton.locator("svg rect")).toBeVisible();
  await expect(quoteButton.locator("svg path")).toHaveCount(2);
  await expect(quoteButton).toHaveCSS("box-shadow", "none");
  await expect(quoteButton).toHaveCSS("color", "rgb(32, 37, 45)");
  await expect(quote).toHaveCSS("white-space", "nowrap");
  await expect(quote).toHaveCSS("overflow", "hidden");
  await expect(quote).toHaveCSS("text-overflow", "ellipsis");
  await expect(quote.locator("..")).toHaveCSS("min-height", "24px");
  expect(await lineOffset(quote, quoteButton)).toBeLessThanOrEqual(1);
  await expect(valueButton).toHaveAttribute("aria-expanded", "false");
  await expect(valueButton).toHaveText("");
  await expect(valueButton.locator("svg rect")).toBeVisible();
  await expect(valueButton.locator("svg path")).toHaveCount(2);
  await expect(valueButton).toHaveCSS("color", "rgb(32, 37, 45)");
  await expect(value).toHaveCSS("white-space", "nowrap");
  await expect(value).toHaveCSS("overflow", "hidden");
  await expect(value).toHaveCSS("text-overflow", "ellipsis");
  await expect(value).toHaveCSS("padding-right", "28px");
  await expect(value).toHaveCSS("min-height", "24px");
  expect(await lineOffset(value, valueButton)).toBeLessThanOrEqual(1);

  await valueButton.hover();
  await expect(valueButton).toHaveCSS("background-color", "rgba(6, 175, 193, 0.1)");
  await expect(valueButton).toHaveCSS("border-color", "rgb(0, 139, 163)");

  await valueButton.click();

  const collapseValueButton = row.getByRole("button", { name: "Collapse index value" });
  await expect(collapseValueButton).toHaveText("");
  await expect(collapseValueButton.locator("svg rect")).toBeVisible();
  await expect(collapseValueButton.locator("svg path")).toHaveCount(1);
  await expect(value).toHaveCSS("white-space", "normal");
  await expect(value).toHaveCSS("overflow", "visible");
  await expect(value).toHaveCSS("text-overflow", "clip");
  expect(await lineOffset(value, collapseValueButton)).toBeLessThanOrEqual(1);
  await collapseValueButton.click();

  await expandButton.focus();
  await expect(expandButton).toHaveCSS("outline-color", "rgb(0, 139, 163)");
  await expect(expandButton).toHaveCSS("outline-style", "solid");
  await expect(expandButton).toHaveCSS("outline-width", "2px");
  await page.keyboard.press("Enter");

  const collapseButton = page.getByRole("button", { name: "Collapse explanation" });
  const expandedRowBox = await row.boundingBox();
  const expandedButtonBox = await collapseButton.boundingBox();

  await expect(collapseButton).toBeVisible();
  await expect(collapseButton).toHaveText("");
  await expect(collapseButton.locator("svg rect")).toBeVisible();
  await expect(collapseButton.locator("svg path")).toHaveCount(1);
  await expect(explanation).toHaveCSS("white-space", "normal");
  await expect(explanation).toHaveCSS("overflow", "visible");
  await expect(explanation).toHaveCSS("text-overflow", "clip");
  expect(await lineOffset(explanation, collapseButton)).toBeLessThanOrEqual(1);
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
  await expect(collapseQuoteButton).toHaveText("");
  await expect(collapseQuoteButton.locator("svg rect")).toBeVisible();
  await expect(collapseQuoteButton.locator("svg path")).toHaveCount(1);
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
  await expect(row.getByRole("button", { name: "Expand index value" })).toHaveCount(0);
  await expect(explanation).toBeVisible();
  await expect(quote).toBeVisible();
  await expect(explanation.locator("..")).toHaveCSS("min-height", "auto");
  await expect(quote.locator("..")).toHaveCSS("min-height", "auto");
  const [explanationBox, explanationLineBox, quoteBox, quoteLineBox] = await Promise.all([
    explanation.boundingBox(),
    explanation.locator("..").boundingBox(),
    quote.boundingBox(),
    quote.locator("..").boundingBox(),
  ]);
  expect(explanationLineBox!.height - explanationBox!.height).toBeLessThanOrEqual(0.5);
  expect(quoteLineBox!.height - quoteBox!.height).toBeLessThanOrEqual(0.5);
});
