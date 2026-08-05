import { expect, test } from "@playwright/test";

test("Audit panel renders report, filters, sorting, and message expansion", async ({ page }) => {
  await page.goto("/?scenario=audit");

  await expect(page.getByText("Audit report")).toHaveCount(0);
  await expect(page.getByText("Out of 3")).toBeVisible();
  await expect(page.getByText("Change type", { exact: true })).toBeVisible();
  await expect(page.getByText("Process", { exact: true })).toBeVisible();
  await expect(page.getByText("Newest addition message")).toBeVisible();
  await expect(page.getByText("Old remove message")).toBeVisible();

  const changeType = page.getByLabel("Change type");
  const process = page.getByLabel("Process");
  const badgeLabel = page.getByText("Out of 3");
  const costs = page.getByText("$1.6641 $0.0190");

  const changeTypeBox = await changeType.boundingBox();
  const processBox = await process.boundingBox();
  const badgeBox = await badgeLabel.boundingBox();
  const costsBox = await costs.boundingBox();

  expect(changeTypeBox).toBeTruthy();
  expect(processBox).toBeTruthy();
  expect(badgeBox).toBeTruthy();
  expect(costsBox).toBeTruthy();
  if (!changeTypeBox || !processBox || !badgeBox || !costsBox) throw new Error("Expected audit header layout in view.");

  expect(badgeBox.y).toBeGreaterThan(changeTypeBox.y);
  expect(costsBox.y).toBeGreaterThan(badgeBox.y);
  await expect(costs).toHaveCSS("color", "rgb(255, 255, 255)");

  const addMessage = await page.getByText("Newest addition message").boundingBox();
  const correction = await page.getByText("This is a long correction message").boundingBox();
  const removeMessage = await page.getByText("Old remove message").boundingBox();
  expect(addMessage).toBeTruthy();
  expect(correction).toBeTruthy();
  expect(removeMessage).toBeTruthy();
  if (!addMessage || !correction || !removeMessage) throw new Error("Expected messages in view.");

  expect(addMessage.y).toBeLessThan(correction.y);
  expect(correction.y).toBeLessThan(removeMessage.y);

  await expect(page.getByText("[Show more]")).toBeVisible();
  await page.getByText("[Show more]").first().click();
  await expect(page.getByText("[Show less]")).toBeVisible();
  await page.getByText("[Show less]").first().click();
  await expect(page.getByText("[Show more]")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Audit panel keeps the close action in the primary row at narrow width", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 900 });
  await page.goto("/?scenario=audit");

  const primaryRow = page.locator("[data-audit-header-row='primary']");
  const close = page.getByRole("button", { name: "Close preview" });
  const summary = page.getByText("Out of 3");
  await expect(primaryRow).toBeVisible();
  await expect(close).toBeVisible();
  await expect(summary).toBeVisible();

  const primaryRowBox = await primaryRow.boundingBox();
  const closeBox = await close.boundingBox();
  const summaryBox = await summary.boundingBox();
  expect(primaryRowBox).toBeTruthy();
  expect(closeBox).toBeTruthy();
  expect(summaryBox).toBeTruthy();
  if (!primaryRowBox || !closeBox || !summaryBox) throw new Error("Expected narrow audit header layout in view.");

  expect(closeBox.y).toBeGreaterThanOrEqual(primaryRowBox.y);
  expect(closeBox.y + closeBox.height).toBeLessThanOrEqual(
    primaryRowBox.y + primaryRowBox.height,
  );
  expect(closeBox.x + closeBox.width).toBeGreaterThanOrEqual(
    primaryRowBox.x + primaryRowBox.width - 1,
  );
  expect(summaryBox.y).toBeGreaterThan(closeBox.y);
  await expect(page).toHaveScreenshot("audit-narrow-close-row.png", { fullPage: true });
});

test("Audit keeps its header fixed while its report body scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 480 });
  await page.goto("/?scenario=audit");

  const header = page.locator("[data-audit-header]");
  const body = page.getByRole("region", { name: "Audit report body" });
  const close = page.getByRole("button", { name: "Close preview" });
  await expect(header).toBeVisible();
  await expect(body).toBeVisible();
  await expect(close).toBeVisible();
  await expect.poll(() => body.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);

  const headerBox = await header.boundingBox();
  const closeBox = await close.boundingBox();
  expect(headerBox).toBeTruthy();
  expect(closeBox).toBeTruthy();
  if (!headerBox || !closeBox) throw new Error("Expected fixed audit header in view.");

  await body.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await expect.poll(() => body.evaluate((node) => node.scrollTop > 0)).toBe(true);

  const headerAfterScroll = await header.boundingBox();
  const closeAfterScroll = await close.boundingBox();
  expect(headerAfterScroll?.y).toBe(headerBox.y);
  expect(closeAfterScroll?.y).toBe(closeBox.y);
  await expect(page).toHaveScreenshot("audit-fixed-header-scroll.png", { fullPage: true });
});
