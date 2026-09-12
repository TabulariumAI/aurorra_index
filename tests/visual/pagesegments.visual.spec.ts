import { expect, test } from "@playwright/test";

test("page segments panel renders choices, updates actions, and closes after queue acceptance", async ({ page }) => {
  await page.goto("/?scenario=pagesegments");

  const reference = page.getByRole("checkbox", { name: "Reference (Recital)" });
  const property = page.getByRole("checkbox", { name: "Property(Exhibit)" });
  const secrets = page.getByRole("checkbox", { name: "Confidential" });
  const endorsement = page.getByRole("checkbox", { name: "Record Endorsements" });
  const party = page.getByRole("checkbox", { name: "Party (Party Clause)" });

  await expect(reference).toBeChecked();
  await expect(property).toBeEnabled();
  await expect(secrets).toBeDisabled();
  await expect(endorsement).toBeEnabled();
  await expect(party).toBeEnabled();
  await expect(party).toBeChecked();

  await expect(page.getByRole("button", { name: "Submit" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cancel" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();

  await endorsement.check();
  await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("region", { name: "Page Segments", exact: true })).toHaveCount(0);
  await expect(page.getByTestId("pending-item")).toHaveCount(0);
});

test("page segments panel retains failed changes for retry or cancellation", async ({ page }) => {
  await page.goto("/?scenario=pagesegments-fail");

  const reference = page.getByRole("checkbox", { name: "Reference (Recital)" });
  const property = page.getByRole("checkbox", { name: "Property(Exhibit)" });

  await expect(reference).toBeChecked();
  await expect(property).toBeEnabled();

  await property.check();
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("region", { name: "Page Segments", exact: true })).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveText("Could not save page segments.");
  await expect(page.getByRole("button", { name: "Retry change" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel change" }).click();
  await expect(page.getByTestId("pending-item")).toHaveCount(0);
});
