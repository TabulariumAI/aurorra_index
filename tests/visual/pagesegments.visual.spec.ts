import { expect, test } from "@playwright/test";

test("page segments panel renders choices, updates actions, and shows success state", async ({ page }) => {
  await page.goto("/?scenario=pagesegments");

  const recital = page.getByRole("checkbox", { name: "Referance(Rectal)" });
  const exhibit = page.getByRole("checkbox", { name: "Property Terms(Exhibit)" });
  const confidential = page.getByRole("checkbox", { name: "Confidential" });
  const endorsement = page.getByRole("checkbox", { name: "Record Endorsements" });

  await expect(recital).toBeChecked();
  await expect(exhibit).toBeEnabled();
  await expect(confidential).toBeDisabled();
  await expect(endorsement).toBeEnabled();

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
  await expect(page.getByTestId("completion-message")).toHaveText("Updated page-1 in visual-session-pagesegments to recital,endorsement");
  await expect(page.getByTestId("job-message")).toHaveText("page-segments.update:completed");
});

test("page segments panel surfaces update failure and keeps action state", async ({ page }) => {
  await page.goto("/?scenario=pagesegments-fail");

  const recital = page.getByRole("checkbox", { name: "Referance(Rectal)" });
  const exhibit = page.getByRole("checkbox", { name: "Property Terms(Exhibit)" });

  await expect(recital).toBeChecked();
  await expect(exhibit).toBeEnabled();

  await exhibit.check();
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close" })).not.toBeVisible();
  await expect(page.getByTestId("completion-message")).toHaveText("Failed page-1 in visual-session-pagesegments: Could not save page segments.");
  await expect(page.getByTestId("job-message")).toHaveText("page-segments.update:failed");
});
