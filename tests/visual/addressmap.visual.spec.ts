import { expect, test } from "@playwright/test";

const expectedAddress = "123 Main Street, Austin, TX 78701";
const expectedSource = `https://www.google.com/maps?q=123%20Main%20Street%2C%20Austin%2C%20TX%2078701&output=embed&maptype=roadmap`;

test("address map row forwards address through callback", async ({ page }) => {
  await page.goto("/?scenario=addressmap");

  const openButton = page.getByRole("button", { name: `Open address ${expectedAddress}` });
  const value = page.getByRole("link", { name: expectedAddress });
  await expect(openButton).toBeVisible();
  expect(await openButton.evaluate((button) => button.parentElement?.firstElementChild === button)).toBe(true);
  const offset = await openButton.evaluate((button) => {
    const icon = button.querySelector("svg");
    const valueLink = button.parentElement?.querySelector("a");
    if (!icon || !valueLink) throw new Error("Address action alignment elements are not rendered");
    const iconBox = icon.getBoundingClientRect();
    const valueBox = valueLink.getBoundingClientRect();
    const lineHeight = Number.parseFloat(window.getComputedStyle(valueLink).lineHeight);
    return Math.abs(iconBox.y + iconBox.height / 2 - (valueBox.y + lineHeight / 2));
  });
  expect(offset).toBeLessThanOrEqual(1);
  await expect(value).toBeVisible();
  await openButton.click();

  const callbackSource = page.getByTestId("address-map-callback-source");

  await expect(callbackSource).toHaveText(expectedSource);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("metadata row links the value and copies it from the row action", async ({ page }) => {
  await page.goto("/?scenario=addressmap");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText(value: string) {
          (window as typeof window & { copiedIndexValue?: string }).copiedIndexValue = value;
          return Promise.resolve();
        },
      },
    });
  });

  await expect(page.getByRole("link", { name: expectedAddress })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open page image 1" })).toHaveCount(0);
  await page.getByRole("button", { name: `Copy value ${expectedAddress}` }).click();

  await expect.poll(() => page.evaluate(() => (window as typeof window & { copiedIndexValue?: string }).copiedIndexValue)).toBe(expectedAddress);
});
