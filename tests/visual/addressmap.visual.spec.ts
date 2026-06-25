import { expect, test } from "@playwright/test";

const expectedAddress = "123 Main Street, Austin, TX 78701";

test("address map opens from address metadata row and clears on close", async ({ page }) => {
  const encodedAddress = encodeURIComponent(expectedAddress);
  const expectedSource = `https://www.google.com/maps?q=${encodedAddress}&output=embed&maptype=roadmap&z=14`;
  const expectedClearedStateText = "empty";

  await page.goto("/?scenario=addressmap");

  const openButton = page.getByRole("button", { name: `Open address ${expectedAddress}` });
  await expect(openButton).toBeVisible();
  await openButton.click();

  const dialog = page.getByRole("dialog");
  const iframe = page.locator("iframe[data-testid='address-map-iframe']");

  await expect(dialog).toBeVisible();
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute("src", expectedSource);
  await expect(page.getByTestId("address-map-open")).toHaveText("open");
  await expect(iframe).toHaveAttribute("src", expectedSource);

  await page.getByRole("button", { name: "Close" }).click();

  await expect(dialog).toBeHidden();
  await expect(iframe).toHaveCount(0);
  await expect(page.getByTestId("address-map-open")).toHaveText("closed");
  await expect(page.getByTestId("address-map-source")).toHaveText(expectedClearedStateText);
});
