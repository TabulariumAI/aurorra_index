import { expect, test } from "@playwright/test";

test("Add Index renders and confirms the exported Image Viewer selection", async ({ page }) => {
  let serviceRequest: {
    authorization: string | undefined;
    body: unknown;
    method: string;
  } | null = null;
  let releaseService!: () => void;
  const serviceGate = new Promise<void>((resolve) => {
    releaseService = resolve;
  });
  await page.route("https://gateway.example.test/v1/refine/visual-session-001/add/index", async (route) => {
    const request = route.request();
    serviceRequest = {
      authorization: request.headers().authorization,
      body: request.postDataJSON(),
      method: request.method(),
    };
    await serviceGate;
    await route.fulfill({
      body: JSON.stringify({ accepted: true, description: "Index added." }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.setViewportSize({ width: 1880, height: 1334 });
  await page.goto("/?scenario=imageviewer");

  await expect(page.getByRole("progressbar", { name: "image viewer progress" })).toBeVisible();
  await page.evaluate(() => {
    window.completeDocumentPackage = true;
  });
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 3 of 4")).toBeVisible();
  await page.getByRole("button", { name: "Select" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-draw-mode", "true");
  await page.getByRole("button", { name: "Export" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-selection", "copied");

  const dialog = page.getByRole("dialog", { name: "Add selected index" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("data-dialog-draggable", "true");
  await expect(dialog).toHaveAttribute("data-height-mode", "medium");
  await expect(dialog.locator("[data-dialog-body='true']")).toHaveAttribute("data-body-mode", "center");
  const form = page.getByRole("region", { name: "Add selected index form" });
  await expect(form).toHaveCSS("max-width", "672px");
  await expect(form).toHaveCSS("padding", "16px");
  await expect(form).toHaveCSS("overflow-y", "visible");
  await expect(form.locator("h2")).toHaveCSS("font-size", "28px");
  const indexInput = page.getByRole("textbox", { name: "Index" });
  const pageInput = page.getByRole("textbox", { name: "Page Number" });
  const sourceInput = page.getByRole("textbox", { name: "Source" });
  const typeInput = page.getByRole("textbox", { name: "Type" });
  await expect(indexInput).toBeVisible();
  await expect(indexInput).toHaveAttribute("type", "text");
  await expect(pageInput).toBeVisible();
  await expect(sourceInput).toBeVisible();
  await expect(typeInput).toBeVisible();
  await expect(typeInput).toHaveAttribute("required", "");
  await expect(page.getByRole("button", { name: "Confirm" })).toBeDisabled();
  await expect(page.getByRole("group", { name: "Quote" })).toBeVisible();
  await expect(indexInput).toHaveValue("JOHN SMITH JOHN M. SMITH");
  await expect(pageInput).toHaveValue("3");
  await expect(sourceInput).toHaveValue(
    "JOHN SMITH, RESIDING AT 69-55 62ND STREET, RIDGEWOOD, NEW YORK 11385 PARTY OF THE FIRST PART, AND\n\n"
      + "JOHN M. SMITH, RESIDING AT 69-55 62ND STREET, RIDGEWOOD, NEW YORK 11385, AS TRUSTEE OF THE JOHN M. SMITH LIVING TRUST, DATED JUNE 9, 2025",
  );
  const indexFieldBox = await page.getByTestId("add-index-field").boundingBox();
  const quoteFieldBox = await page.getByTestId("add-quote-field").boundingBox();
  const typeFieldBox = await page.getByTestId("add-type-field").boundingBox();
  expect(indexFieldBox).not.toBeNull();
  expect(quoteFieldBox).not.toBeNull();
  expect(typeFieldBox).not.toBeNull();
  expect(indexFieldBox!.y).toBeLessThan(quoteFieldBox!.y);
  expect(quoteFieldBox!.y).toBeLessThan(typeFieldBox!.y);
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.width).toBeLessThan(1880);
  expect(dialogBox!.height).toBeLessThan(1334);
  await expect.poll(async () => form.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
  await expect.poll(async () => dialog.locator("[data-dialog-body='true']")
    .evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
  await expect(page.getByTestId("add-index-field")).toHaveCSS("border-radius", "8px");
  await expect(page.getByTestId("add-quote-field")).toHaveCSS("border-radius", "8px");
  await expect(page.getByTestId("add-type-field")).toHaveCSS("border-radius", "8px");
  const actionsBox = await page.getByTestId("add-index-actions").boundingBox();
  const confirmBox = await page.getByRole("button", { name: "Confirm" }).boundingBox();
  const cancelBox = await page.getByRole("button", { name: "Cancel" }).boundingBox();
  expect(actionsBox).not.toBeNull();
  expect(confirmBox).not.toBeNull();
  expect(cancelBox).not.toBeNull();
  expect(confirmBox!.width).toBeGreaterThanOrEqual(112);
  expect(cancelBox!.width).toBeGreaterThanOrEqual(112);
  expect(confirmBox!.x).toBeLessThan(cancelBox!.x);
  expect(Math.abs(
    actionsBox!.x + actionsBox!.width / 2
      - (dialogBox!.x + dialogBox!.width / 2),
  )).toBeLessThanOrEqual(1);

  await indexInput.fill("Edited Index");
  await pageInput.fill("7");
  await sourceInput.fill("Edited source");
  await typeInput.fill("Party");
  await expect(page.getByRole("button", { name: "Confirm" })).toBeEnabled();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("Click again to confirm")).toBeVisible();
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("dialog", { name: "Add selected index" })).toHaveCount(0);
  await expect(page.locator("#visual-stage")).toHaveAttribute("data-event", "started");
  await expect.poll(() => serviceRequest).not.toBeNull();
  releaseService();
  await expect(page.locator("#visual-stage")).toHaveAttribute("data-add-index-complete", "true");
  await expect(page.locator("#visual-stage")).toHaveAttribute("data-event", "completed");
  expect(serviceRequest).toEqual({
    authorization: "Bearer token",
    body: {
      aspect: "Party",
      source: "P 7  Edited source",
      value: "Edited Index",
    },
    method: "POST",
  });
});

test("Add Index closes and posts failed progress when the service rejects the index", async ({ page }) => {
  await page.route("https://gateway.example.test/v1/refine/visual-session-001/add/index", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ accepted: false, description: "Index already exists." }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.setViewportSize({ width: 1880, height: 1334 });
  await page.goto("/?scenario=imageviewer");

  await page.evaluate(() => {
    window.completeDocumentPackage = true;
  });
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 3 of 4")).toBeVisible();
  await page.getByRole("button", { name: "Select" }).click();
  await page.getByRole("button", { name: "Export" }).click();

  const dialog = page.getByRole("dialog", { name: "Add selected index" });
  await expect(dialog).toBeVisible();
  await page.getByRole("textbox", { name: "Type" }).fill("Party");
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByText("Click again to confirm")).toBeVisible();
  await page.getByRole("button", { name: "Confirm" }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#visual-stage")).toHaveAttribute("data-error", "Index already exists.");
  await expect(page.locator("#visual-stage")).not.toHaveAttribute("data-add-index-complete", "true");
  await expect(page.locator("#visual-stage")).toHaveAttribute("data-event", "failed");
});
