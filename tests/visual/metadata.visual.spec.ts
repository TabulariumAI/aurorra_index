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
  const accordion = page.getByRole("region", { name: "Metadata accordion" });
  const footer = page.locator("[data-metadata-footer='true']");
  const row = page.locator("article").first();
  const explanation = row.locator('span:not([aria-hidden="true"])').filter({ hasText: "This explanation is intentionally long" });
  const expandButton = page.getByRole("button", { name: "Expand explanation" });
  const quote = row.locator('span:not([aria-hidden="true"])').filter({ hasText: "full quoted source" });
  const quoteButton = page.getByRole("button", { name: "Expand quote" });
  const value = row.getByRole("link");
  const valueButton = row.getByRole("button", { name: "Expand index value" });
  const segmentTrigger = accordion.getByRole("button", { name: /Parties\(Party Clause\)/i });
  const segmentHeader = segmentTrigger.locator("..");
  const reprocessButton = segmentHeader.getByRole("button", { name: "Reprocess" });
  const chatButton = segmentHeader.getByRole("button", { name: "Open AI chat" });
  const segmentCount = segmentHeader.locator(":scope > span");
  const copyButton = row.getByRole("button", { name: /Copy value/ });
  const dropButton = row.locator("button.metadata-row-action").last();
  const detail = row.getByText("Grantor", { exact: true });

  await expect(header).toHaveCSS("position", "static");
  await expect(accordion).toHaveCSS("overflow-y", "auto");
  await expect(footer).toHaveCSS("height", "0px");
  await expect(footer).toHaveCSS("overflow", "hidden");
  await expect(row.locator('span:not([aria-hidden="true"])').filter({ hasText: "Explanation:" })).toBeVisible();
  await expect(row.locator('span:not([aria-hidden="true"])').filter({ hasText: "Quote:" })).toBeVisible();
  await expect(value).toBeVisible();
  await expect(row).toHaveCSS("box-shadow", "none");
  await expect(reprocessButton).toBeVisible();
  await expect(reprocessButton).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(reprocessButton).toHaveCSS("box-shadow", "none");
  await expect(reprocessButton).toHaveCSS("height", "44px");
  await expect(reprocessButton).toHaveText("Reprocess");
  await expect(reprocessButton.locator("svg")).toHaveCount(0);
  await expect(chatButton).toBeVisible();
  await expect(chatButton).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(chatButton).toHaveCSS("box-shadow", "none");
  await expect(chatButton).toHaveCSS("height", "44px");
  await expect(chatButton).toHaveText("AI chat");
  await expect(chatButton.locator("svg")).toHaveCount(0);
  await expect(segmentCount).toHaveCount(1);
  const [segmentTriggerBox, actionGroupBox, segmentCountBox] = await Promise.all([
    segmentTrigger.boundingBox(),
    reprocessButton.locator("..").boundingBox(),
    segmentCount.boundingBox(),
  ]);
  expect(segmentTriggerBox).not.toBeNull();
  expect(actionGroupBox).not.toBeNull();
  expect(segmentCountBox).not.toBeNull();
  expect(Math.abs((segmentTriggerBox!.y + (segmentTriggerBox!.height / 2)) - (actionGroupBox!.y + (actionGroupBox!.height / 2)))).toBeLessThanOrEqual(2);
  expect(Math.abs((actionGroupBox!.y + (actionGroupBox!.height / 2)) - (segmentCountBox!.y + (segmentCountBox!.height / 2)))).toBeLessThanOrEqual(2);
  expect(segmentTriggerBox!.x + segmentTriggerBox!.width).toBeLessThanOrEqual(actionGroupBox!.x);
  expect(actionGroupBox!.x + actionGroupBox!.width).toBeLessThanOrEqual(segmentCountBox!.x);
  await expect(dropButton).toBeVisible();
  await expect(dropButton).toHaveAttribute("aria-label", "Pop the index");
  await expect(copyButton).toHaveCSS("color", "rgb(0, 139, 163)");
  await expect(dropButton).toHaveCSS("color", "rgb(0, 139, 163)");
  await expect(dropButton).toHaveCSS("box-shadow", "none");
  const [detailBox, actionBox] = await Promise.all([detail.boundingBox(), dropButton.boundingBox()]);
  expect(detailBox).not.toBeNull();
  expect(actionBox).not.toBeNull();
  expect(detailBox!.y).toBeLessThan(actionBox!.y + actionBox!.height);
  await dropButton.hover();
  await page.waitForTimeout(350);
  await expect(dropButton).toHaveCSS("color", "rgb(0, 139, 163)");
  await expect(page.getByRole("tooltip", { name: "Pop the index" })).toBeVisible();
  await dropButton.click();
  await expect(dropButton).toHaveAttribute("aria-label", "Pop the index");
  await expect(dropButton).not.toHaveAttribute("data-armed", "true");
  await expect(dropButton.locator("[data-confirm-progress='true']")).toHaveCount(0);
  await expect(dropButton).toHaveCSS("width", "44px");
  await expect(dropButton).toHaveCSS("height", "44px");
  await expect(page.locator("[data-radix-popper-content-wrapper]")).toHaveCount(0);
  await expect(explanation).toBeVisible();
  await expect(expandButton).toHaveAttribute("aria-expanded", "false");
  await expect(expandButton).toHaveText("");
  await expect(expandButton.locator("svg rect")).toBeVisible();
  await expect(expandButton.locator("svg path")).toHaveCount(2);
  await expect(explanation).toHaveCSS("display", "block");
  await expect(expandButton).toHaveCSS("position", "absolute");
  await expect(expandButton).toHaveCSS("box-shadow", "none");
  await expect(expandButton).toHaveCSS("color", "rgb(16, 36, 58)");
  expect((await expandButton.boundingBox())!.width).toBe(44);
  expect((await expandButton.boundingBox())!.height).toBe(44);
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
  await expect(quoteButton).toHaveCSS("color", "rgb(16, 36, 58)");
  await expect(quote).toHaveCSS("white-space", "nowrap");
  await expect(quote).toHaveCSS("overflow", "hidden");
  await expect(quote).toHaveCSS("text-overflow", "ellipsis");
  await expect(quote.locator("..")).toHaveCSS("min-height", "24px");
  expect(await lineOffset(quote, quoteButton)).toBeLessThanOrEqual(1);
  await expect(valueButton).toHaveAttribute("aria-expanded", "false");
  await expect(valueButton).toHaveText("");
  await expect(valueButton.locator("svg rect")).toBeVisible();
  await expect(valueButton.locator("svg path")).toHaveCount(2);
  await expect(valueButton).toHaveCSS("color", "rgb(16, 36, 58)");
  await expect(value).toHaveCSS("white-space", "nowrap");
  await expect(value).toHaveCSS("overflow", "hidden");
  await expect(value).toHaveCSS("text-overflow", "ellipsis");
  await expect(value).toHaveCSS("padding-right", "28px");
  await expect(value).toHaveCSS("min-height", "24px");
  expect(await lineOffset(value, valueButton)).toBeLessThanOrEqual(1);

  await valueButton.hover();
  await expect(valueButton).toHaveCSS("background-color", "rgb(224, 243, 255)");
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
  await page.setViewportSize({ width: 1440, height: 360 });
  await expect.poll(() => accordion.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await accordion.evaluate((element) => {
    element.scrollTop = 500;
  });
  const after = await header.boundingBox();
  expect(after).not.toBeNull();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(after!.y - stageBox!.y)).toBeLessThanOrEqual(1);
  await expect(page).toHaveScreenshot("metadata-fixed-layout-scroll.png", { fullPage: true });
});

test("metadata segment reprocess has a compact labeled tooltip target", async ({ page }) => {
  await page.goto("/?scenario=metadata");

  const accordion = page.getByRole("region", { name: "Metadata accordion" });
  const header = accordion.getByRole("button", { name: /Parties\(Party Clause\)/i }).locator("..");
  const reprocess = header.getByRole("button", { name: "Reprocess" });

  await reprocess.hover();

  await expect(page.getByRole("tooltip", { name: "Reprocess" })).toBeVisible();
});

test("metadata segment count tokens remain consistent across header states", async ({ page }) => {
  await page.goto("/?scenario=metadata");

  const accordion = page.getByRole("region", { name: "Metadata accordion" });
  const pagesCount = accordion.getByRole("button", { name: "Pages" }).locator("..").locator(":scope > span");
  const partiesCount = accordion.getByRole("button", { name: /Parties\(Party Clause\)/i }).locator("..").locator(":scope > span");
  const titlesCount = accordion.getByRole("button", { name: "Titles" }).locator("..").locator(":scope > span");
  const endorsementsHeader = accordion.getByRole("button", { name: "Record Endorsements" }).locator("..");

  await expect(accordion.getByRole("button", { name: "Pages" }).locator("..").locator("button[aria-label]")).toHaveCount(0);
  await expect(accordion.getByRole("button", { name: /Parties\(Party Clause\)/i }).locator("..").locator("button[aria-label]")).toHaveCount(2);
  await expect(endorsementsHeader.locator("button[aria-label]")).toHaveCount(0);

  const countStyle = async (count: Locator) => count.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderTopWidth: style.borderTopWidth,
      color: style.color,
    };
  });
  const [pagesStyle, partiesStyle, titlesStyle] = await Promise.all([
    countStyle(pagesCount),
    countStyle(partiesCount),
    countStyle(titlesCount),
  ]);

  expect(pagesStyle).toEqual(partiesStyle);
  expect(titlesStyle).toEqual(partiesStyle);
  expect(partiesStyle.borderTopWidth).toBe("1px");
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

test("metadata reprocess stays in the segment header", async ({ page }) => {
  await page.goto("/?scenario=metadata-reprocess");

  const accordion = page.getByRole("region", { name: "Metadata accordion" });
  const segmentTrigger = accordion.getByRole("button", { name: /Parties\(Party Clause\)/i });
  const segmentHeader = segmentTrigger.locator("..");
  const progress = segmentHeader.getByRole("status", { name: "Reprocessing party" });
  const spinner = progress.locator(".aurorra-index-progress-spinner");
  const chat = segmentHeader.getByRole("button", { name: "Open AI chat" });
  const segmentCount = segmentHeader.locator(":scope > span");

  await expect(progress).toBeVisible();
  await expect(segmentHeader.getByRole("button", { name: "Reprocess" })).toHaveCount(0);
  await expect(chat).toBeVisible();
  await expect(chat).toHaveText("AI chat");
  await expect(segmentCount).toHaveCount(1);
  await expect(progress).toHaveCSS("height", "44px");
  await expect(progress).toHaveCSS("width", "44px");
  await expect(spinner).toHaveCSS("border-radius", "999px");
  await expect(spinner).toHaveCSS("animation-name", "aurorra-index-spinner");
  const [progressBox, actionBox, chatBox, segmentTriggerBox, segmentCountBox] = await Promise.all([
    spinner.boundingBox(),
    progress.locator("..").boundingBox(),
    chat.boundingBox(),
    segmentTrigger.boundingBox(),
    segmentCount.boundingBox(),
  ]);
  expect(progressBox).not.toBeNull();
  expect(actionBox).not.toBeNull();
  expect(chatBox).not.toBeNull();
  expect(segmentTriggerBox).not.toBeNull();
  expect(segmentCountBox).not.toBeNull();
  expect(Math.abs((progressBox!.y + (progressBox!.height / 2)) - (chatBox!.y + (chatBox!.height / 2)))).toBeLessThanOrEqual(2);
  expect(Math.abs((actionBox!.y + (actionBox!.height / 2)) - (segmentTriggerBox!.y + (segmentTriggerBox!.height / 2)))).toBeLessThanOrEqual(2);
  expect(Math.abs((actionBox!.y + (actionBox!.height / 2)) - (segmentCountBox!.y + (segmentCountBox!.height / 2)))).toBeLessThanOrEqual(2);
  expect(segmentTriggerBox!.x + segmentTriggerBox!.width).toBeLessThanOrEqual(actionBox!.x);
  expect(actionBox!.x + actionBox!.width).toBeLessThanOrEqual(segmentCountBox!.x);
});

test("metadata segment text actions remain within workspace viewports", async ({ page }) => {
  for (const viewport of [
    { height: 812, width: 375 },
    { height: 1024, width: 768 },
    { height: 768, width: 1024 },
    { height: 900, width: 1440 },
    { height: 1080, width: 1920 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/?scenario=metadata");

    const accordion = page.getByRole("region", { name: "Metadata accordion" });
    const trigger = accordion.getByRole("button", { name: /Parties\(Party Clause\)/i });
    const header = trigger.locator("..");
    const actions = header.locator("button[aria-label]");
    const count = header.locator(":scope > span");
    const reprocess = header.getByRole("button", { name: "Reprocess" });
    const chat = header.getByRole("button", { name: "Open AI chat" });

    await expect(reprocess).toBeVisible();
    await expect(chat).toBeVisible();
    await expect(reprocess).toHaveText("Reprocess");
    await expect(chat).toHaveText("AI chat");
    await expect(count).toHaveCount(1);
    await expect(actions).toHaveCount(2);
    const [headerBox, actionBox, countBox] = await Promise.all([
      header.boundingBox(),
      reprocess.locator("..").boundingBox(),
      count.boundingBox(),
    ]);
    expect(headerBox).not.toBeNull();
    expect(actionBox).not.toBeNull();
    expect(countBox).not.toBeNull();
    expect(actionBox!.x + actionBox!.width).toBeLessThanOrEqual(countBox!.x);
    expect(actionBox!.x).toBeGreaterThanOrEqual(headerBox!.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
