import { expect, test } from "@playwright/test";

test("Audit panel renders filters, sorting, and message expansion", async ({ page }) => {
  await page.goto("/?scenario=audit");

  const controlsRow = page.locator("[data-audit-controls]");
  await expect(controlsRow).toBeVisible();
  await expect(page.getByText("Out of 3")).toBeVisible();
  await expect(page.getByText("Change type", { exact: true })).toBeVisible();
  await expect(page.getByText("Process", { exact: true })).toBeVisible();
  await expect(page.getByText("Audit gaps", { exact: true })).toHaveCount(0);
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
  const controlsRowBox = await controlsRow.boundingBox();

  expect(changeTypeBox).toBeTruthy();
  expect(processBox).toBeTruthy();
  expect(badgeBox).toBeTruthy();
  expect(costsBox).toBeTruthy();
  expect(controlsRowBox).toBeTruthy();
  if (!changeTypeBox || !processBox || !badgeBox || !costsBox || !controlsRowBox) throw new Error("Expected audit layout in view.");

  expect(badgeBox.y).toBeGreaterThanOrEqual(changeTypeBox.y);
  await expect(costs).toHaveCSS("color", "rgb(16, 36, 58)");

  const addMessage = await page.getByText("Newest addition message").boundingBox();
  const correction = await page.getByText("This is a long correction message").boundingBox();
  const removeMessage = await page.getByText("Old remove message").boundingBox();
  expect(addMessage).toBeTruthy();
  expect(correction).toBeTruthy();
  expect(removeMessage).toBeTruthy();
  if (!addMessage || !correction || !removeMessage) throw new Error("Expected messages in view.");

  expect(addMessage.y).toBeLessThan(correction.y);
  expect(correction.y).toBeLessThan(removeMessage.y);
  expect(costsBox.y).toBeGreaterThan(removeMessage.y);

  await expect(page.getByText("[Show more]")).toBeVisible();
  await page.getByText("[Show more]").first().click();
  await expect(page.getByText("[Show less]")).toBeVisible();
  await page.getByText("[Show less]").first().click();
  await expect(page.getByText("[Show more]")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("Audit panel keeps controls in their row at narrow width", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 900 });
  await page.goto("/?scenario=audit");

  const controlsRow = page.locator("[data-audit-controls]");
  const summary = page.getByText("Out of 3");
  await expect(controlsRow).toBeVisible();
  await expect(summary).toBeVisible();

  const controlsRowBox = await controlsRow.boundingBox();
  const summaryBox = await summary.boundingBox();
  expect(controlsRowBox).toBeTruthy();
  expect(summaryBox).toBeTruthy();
  if (!controlsRowBox || !summaryBox) throw new Error("Expected narrow audit controls in view.");

  expect(summaryBox.y).toBeGreaterThanOrEqual(controlsRowBox.y);
  expect(summaryBox.y + summaryBox.height).toBeLessThanOrEqual(controlsRowBox.y + controlsRowBox.height);
  await expect(page).toHaveScreenshot("audit-narrow-close-row.png", { fullPage: true });
});

test("Audit report body scrolls", async ({ page }) => {
  await page.setViewportSize({ width: 440, height: 480 });
  await page.goto("/?scenario=audit");

  const body = page.getByRole("region", { name: "Audit report body" });
  await expect(body).toBeVisible();
  await expect.poll(() => body.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);

  const bodyBox = await body.boundingBox();
  expect(bodyBox).toBeTruthy();
  if (!bodyBox) throw new Error("Expected audit report body in view.");

  await body.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await expect.poll(() => body.evaluate((node) => node.scrollTop > 0)).toBe(true);

  expect((await body.boundingBox())?.y).toBe(bodyBox.y);
  await expect(page).toHaveScreenshot("audit-fixed-header-scroll.png", { fullPage: true });
});
