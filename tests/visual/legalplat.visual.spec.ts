import { expect, test } from "@playwright/test";

test("legal plat dialog renders one close action", async ({ page }) => {
  await page.goto("/?scenario=legal-plat");

  const dialog = page.getByRole("dialog", { name: "Plat" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("[data-dialog-header]")).toBeVisible();
  await expect(dialog.locator("[data-dialog-body]")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toHaveCount(1);
  await expect(page.locator("[data-legal-plat-grid='true']")).toBeVisible();

  const layout = await dialog.evaluate((node) => {
    const dialog = node as HTMLElement;
    const closeButtons = Array.from(dialog.querySelectorAll("button")).filter((button) => button.textContent?.trim() === "Close");
    const footerCount = dialog.querySelectorAll("[data-dialog-footer='true']").length;
    const rect = dialog.getBoundingClientRect();

    return {
      closeCount: closeButtons.length,
      footerCount,
      height: rect.height,
      width: rect.width,
    };
  });

  expect(layout).toEqual({
    closeCount: 1,
    footerCount: 1,
    height: expect.any(Number),
    width: expect.any(Number),
  });
  expect(layout.height).toBeGreaterThan(0);
  expect(layout.width).toBeGreaterThan(0);
});
