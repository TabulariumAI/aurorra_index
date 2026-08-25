import { expect, test } from "@playwright/test";

test("page segments panel renders choices, updates actions, and shows success state", async ({ page }) => {
  await page.goto("/?scenario=pagesegments");

  const reference = page.getByRole("checkbox", { name: "Referance(Rectal)" });
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
  await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Submit" })).not.toBeVisible();
  await expect(page.getByTestId("completion-message")).toHaveText("Updated page-1 in visual-session-pagesegments to reference,endorsement,party");
});

test("page segments panel surfaces update failure and keeps action state", async ({ page }) => {
  await page.goto("/?scenario=pagesegments-fail");

  const reference = page.getByRole("checkbox", { name: "Referance(Rectal)" });
  const property = page.getByRole("checkbox", { name: "Property(Exhibit)" });

  await expect(reference).toBeChecked();
  await expect(property).toBeEnabled();

  await property.check();
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close" })).not.toBeVisible();
  await expect(page.getByTestId("completion-message")).toHaveText("Failed page-1 in visual-session-pagesegments: Could not save page segments.");
});
