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

  expect(Math.abs(changeTypeBox.y - badgeBox.y)).toBeLessThan(24);
  expect(processBox.x).toBeLessThan(badgeBox.x);
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
