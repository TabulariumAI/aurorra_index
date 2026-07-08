import { expect, test } from "@playwright/test";

const expectedAddress = "123 Main Street, Austin, TX 78701";
const expectedSource = `https://www.google.com/maps?q=123%20Main%20Street%2C%20Austin%2C%20TX%2078701&output=embed&maptype=roadmap`;

test("address map row forwards address through callback", async ({ page }) => {
  await page.goto("/?scenario=addressmap");

  const openButton = page.getByRole("button", { name: `Open address ${expectedAddress}` });
  await expect(openButton).toBeVisible();
  await openButton.click();

  const callbackSource = page.getByTestId("address-map-callback-source");

  await expect(callbackSource).toHaveText(expectedSource);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
