import { expect, test, type Locator } from "@playwright/test";

test.use({ channel: "msedge" });

for (const width of [375, 940]) {
  test(`metadata segment dividers, badges and inset rows follow disclosure at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?scenario=metadata-short");
    const accordion = page.getByRole("region", { name: "Metadata accordion" });
    const trigger = accordion.getByRole("button", { name: "Parties(Party Clause)" });
    const header = trigger.locator("..");
    const segment = header.locator("..");
    const count = header.locator(":scope > span");
    const row = segment.getByRole("article");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger.locator("svg")).toHaveCSS("transform", "matrix(0, 1, -1, 0, 0, 0)");
    await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(segment).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(segment).toHaveCSS("border-bottom-width", "1px");
    await expect(count).toHaveCSS("background-color", "rgb(241, 245, 249)");
    await expect(count).toHaveText("1");
    const [headerBox, countBox, rowBox, titleBox] = await Promise.all([
      header.boundingBox(), count.boundingBox(), row.boundingBox(), trigger.locator("span").boundingBox(),
    ]);
    expect(rowBox!.x - headerBox!.x).toBeCloseTo(32, 0);
    expect(rowBox!.x).toBeCloseTo(titleBox!.x, 0);
    expect(countBox!.x + countBox!.width).toBeCloseTo(headerBox!.x + headerBox!.width, 0);
    expect(rowBox!.x + rowBox!.width).toBeCloseTo(headerBox!.x + headerBox!.width, 0);
    expect(await row.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await header.getByRole("button", { name: "Add Index" }).click();
    await expect(page.locator("#visual-stage")).toHaveAttribute("data-add-segment", "party");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.mouse.move(0, 0);
    await page.screenshot({ path: testInfo.outputPath("segments-expanded.png") });
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger.locator("svg")).toHaveCSS("transform", "none");
    await expect(row).toHaveCount(0);
    await expect(header.getByRole("button", { name: "Add Index" })).toHaveCount(0);
    await expect(count).toHaveText("1");
    await page.keyboard.press("Space");
    await expect(row).toBeVisible();
    const pages = accordion.getByRole("button", { name: "Pages", exact: true });
    await pages.click();
    await expect(pages).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(pages.locator("svg")).toHaveCSS("transform", "matrix(0, 1, -1, 0, 0, 0)");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("metadata keeps row actions and fixed header scrolling with expanded details", async ({ page }) => {
  await page.goto("/?scenario=metadata");
  const header = page.locator("header").first();
  const accordion = page.getByRole("region", { name: "Metadata accordion" });
  const row = page.locator("article").first();
  const drop = row.getByRole("button", { name: "Delete index" });
  const copy = row.getByRole("button", { name: /Copy value/ });
  await expect(header).toHaveCSS("position", "static");
  await expect(accordion).toHaveCSS("overflow-y", "auto");
  await expect(row).toHaveCSS("box-shadow", "none");
  await expect(copy).toHaveCSS("color", "rgb(0, 139, 163)");
  await expect(drop).toHaveCSS("color", "rgb(0, 139, 163)");
  await expect(drop).toHaveAttribute("title", "Delete index");
  await expect(copy).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(drop).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await drop.click();
  const confirm = row.getByRole("button", { name: "Confirm", exact: true });
  await expect(confirm).toHaveAttribute("data-armed", "true");
  await expect(confirm).toHaveCSS("background-color", "rgb(224, 243, 255)");
  await page.mouse.move(0, 0);
  await accordion.getByRole("button", { name: "Parties(Party Clause)", exact: true }).focus();
  await expect(confirm).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(confirm.locator("[data-confirm-progress='true']")).toHaveCount(1);
  await expect(confirm).toHaveCSS("width", "32px");
  await expect(confirm).toHaveCSS("height", "32px");
  await row.getByRole("button", { name: "Expand details" }).click();
  await expect(row.getByText("Explanation:")).toBeVisible();
  await expect(row.getByText("Quote:")).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 360 });
  const before = await header.boundingBox();
  await expect.poll(() => accordion.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await accordion.evaluate(element => { element.scrollTop = 500; });
  const after = await header.boundingBox();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});

for (const width of [1440, 480]) {
  test(`metadata details toggle together across the full row at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?scenario=metadata");
    const row = page.locator("article").first();
    const edit = row.getByRole("button", { name: "Edit index" });
    const expand = row.getByRole("button", { name: "Expand details" });
    const value = row.getByRole("link");
    await expect(edit).toBeVisible();
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    await expect(row.getByText("Explanation:")).toHaveCount(0);
    await expect(row.getByText("Quote:")).toHaveCount(0);
    const [editBox, toggleBox, collapsedBox] = await Promise.all([edit.boundingBox(), expand.boundingBox(), row.boundingBox()]);
    expect(toggleBox!.x).toBeGreaterThanOrEqual(editBox!.x + editBox!.width);
    expect(Math.abs(toggleBox!.y + toggleBox!.height / 2 - editBox!.y - editBox!.height / 2)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath("details-collapsed.png") });
    await expand.focus();
    await expect(expand).toBeFocused();
    await page.keyboard.press("Enter");
    const collapse = row.getByRole("button", { name: "Collapse details" });
    await expect(collapse).toHaveAttribute("aria-expanded", "true");
    await expect(collapse.locator("svg path")).toHaveCount(1);
    const content = page.locator(`[id="${await collapse.getAttribute("aria-controls")}"]`);
    const explanation = content.getByText(/This explanation is intentionally long/);
    const quote = content.getByText(/full quoted source/);
    await expect(explanation).toBeVisible();
    await expect(quote).toBeVisible();
    await expect(content.getByRole("button")).toHaveCount(0);
    for (const detail of [explanation, quote]) {
      await expect(detail).toHaveCSS("white-space", "normal");
      await expect(detail).toHaveCSS("padding-right", "0px");
      const bounds = await detail.boundingBox();
      const available = await row.evaluate(element => {
        const style = getComputedStyle(element);
        return element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      });
      expect(Math.abs(bounds!.width - available)).toBeLessThanOrEqual(1);
      expect(bounds!.y).toBeGreaterThanOrEqual(editBox!.y + editBox!.height);
    }
    const expandedBox = await row.boundingBox();
    expect(expandedBox!.width).toBe(collapsedBox!.width);
    expect(expandedBox!.height).toBeGreaterThan(collapsedBox!.height);
    await expect(row.getByRole("button", { name: /index value/ })).toHaveCount(0);
    await expect(value).toHaveCSS("white-space", "normal");
    await expect(collapse).toHaveAttribute("aria-expanded", "true");
    await page.screenshot({ path: testInfo.outputPath("details-expanded.png") });
    expect(await row.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await collapse.focus();
    await page.keyboard.press("Space");
    await expect(row.getByText("Explanation:")).toHaveCount(0);
    await expect(row.getByText("Quote:")).toHaveCount(0);
    await expect(value).toBeVisible();
    await edit.click();
    await expect(page.locator("[data-edit-code]")).toHaveAttribute("data-edit-code", "idx-1");
  });
}

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
  await expect(accordion.getByRole("button", { name: /Parties\(Party Clause\)/i }).locator("..").locator("button[aria-label]")).toHaveCount(3);
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
  expect(partiesStyle.borderTopWidth).toBe("0px");
  expect(partiesStyle.backgroundColor).toBe("rgb(241, 245, 249)");
});

test("metadata short rows use the same combined disclosure", async ({ page }) => {
  await page.goto("/?scenario=metadata-short");
  const row = page.locator("article").first();
  await expect(row.getByRole("button", { name: "Expand index value" })).toHaveCount(0);
  await expect(row.getByText("Explanation:")).toHaveCount(0);
  await row.getByRole("button", { name: "Expand details" }).click();
  await expect(row.getByText(/Short explanation/)).toBeVisible();
  await expect(row.getByText(/Short quote/)).toBeVisible();
  await row.getByRole("button", { name: "Collapse details" }).click();
  await expect(row.getByText("Explanation:")).toHaveCount(0);
  await expect(row.getByText("Quote:")).toHaveCount(0);
});

test("metadata reprocess stays in the segment header", async ({ page }) => {
  await page.goto("/?scenario=metadata-reprocess");

  const accordion = page.getByRole("region", { name: "Metadata accordion" });
  const segmentTrigger = accordion.getByRole("button", { name: /Parties\(Party Clause\)/i });
  const segmentHeader = segmentTrigger.locator("..");
  const progress = segmentHeader.getByRole("status", { name: "Reprocessing party" });
  const spinner = progress.locator(".metadata-progress-spinner");
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
  await expect(spinner).toHaveCSS("animation-name", "metadata-spinner");
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
    await expect(actions).toHaveCount(3);
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
