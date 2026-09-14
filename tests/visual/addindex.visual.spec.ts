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
  await page.route("https://gateway.example.test/v1/refine/visual-session-001/patch/add", async (route) => {
    const request = route.request();
    serviceRequest = {
      authorization: request.headers().authorization,
      body: request.postDataJSON(),
      method: request.method(),
    };
    await serviceGate;
    await route.fulfill({
      body: JSON.stringify({ data: "", status: "completed", version: 3 }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route("https://gateway.example.test/v1/metadata/visual-session-001/data", (route) => route.fulfill({
    json: { status: "completed", data: "https://storage.example.test/metadata.json" },
  }));
  await page.route("https://storage.example.test/metadata.json", (route) => route.fulfill({
    json: { heading: {}, secrets: [], indexes: [{ code: "added", segment: "party", label: "Party", aspect: "Party", value: "Edited Index" }], pages: { num_of_pages: 4 }, fees: [], funds: [] },
  }));
  await page.setViewportSize({ width: 1880, height: 1334 });
  await page.goto("/?scenario=imageviewer");

  await expect(page.locator("#visual-stage")).toHaveAttribute(
    "data-image-loader",
    '["Backend is generating the image package"]',
  );
  await expect(page.getByRole("progressbar", { name: "image viewer progress" })).toHaveCount(0);
  await page.evaluate(() => {
    window.completeDocumentPackage = true;
  });
  await expect(page.locator("[aria-label='Image viewer top toolbar']")).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 3 of 4")).toBeVisible();
  await page.getByRole("button", { exact: true, name: "Select" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-draw-mode", "true");
  await page.getByRole("button", { name: "Export" }).click();
  await expect(page.locator("[data-document-lens-host='true']")).toHaveAttribute("data-selection", "copied");

  const host = page.getByTestId("add-index-host");
  await expect(host).toBeVisible();
  const form = page.getByRole("region", { name: "Add selected index form" });
  await expect(form).toHaveCSS("max-width", "none");
  await expect(form).toHaveCSS("padding", "0px");
  await expect(form).toHaveCSS("overflow-y", "visible");
  await expect(form.locator("h2")).toHaveCount(0);
  const indexInput = page.getByRole("textbox", { name: "Index" });
  const typeInput = page.getByRole("combobox", { name: "Type" });
  await expect(indexInput).toBeVisible();
  await expect(indexInput).toHaveAttribute("type", "text");
  await expect(typeInput).toBeVisible();
  await typeInput.click();
  await expect(page.getByRole("option", { name: "Grantor", exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Add", exact: true })).toBeDisabled();
  const details = page.getByRole("button", { name: "Additional details" });
  await expect(details).toHaveAttribute("data-state", "closed");
  await expect(page.getByRole("group", { name: "Quote" })).toHaveCount(0);
  await expect(indexInput).toHaveValue("JOHN SMITH JOHN M. SMITH");
  await details.click();
  await expect(details).toHaveAttribute("data-state", "open");
  const pageInput = page.getByRole("textbox", { name: "Page Number" });
  const sourceInput = page.getByRole("textbox", { name: "Source" });
  const labelInput = page.getByRole("textbox", { name: "Label" });
  await expect(page.getByRole("group", { name: "Quote" })).toBeVisible();
  await expect(pageInput).toBeVisible();
  await expect(sourceInput).toBeVisible();
  await expect(labelInput).toBeVisible();
  await expect(labelInput).not.toHaveAttribute("required", "");
  await expect(pageInput).toHaveValue("3");
  await expect(sourceInput).toHaveValue(
    "JOHN SMITH, RESIDING AT 69-55 62ND STREET, RIDGEWOOD, NEW YORK 11385 PARTY OF THE FIRST PART, AND\n\n"
      + "JOHN M. SMITH, RESIDING AT 69-55 62ND STREET, RIDGEWOOD, NEW YORK 11385, AS TRUSTEE OF THE JOHN M. SMITH LIVING TRUST, DATED JUNE 9, 2025",
  );
  const indexFieldBox = await page.getByTestId("add-index-field").boundingBox();
  const quoteFieldBox = await page.getByTestId("add-quote-field").boundingBox();
  const typeFieldBox = await page.getByTestId("add-type-field").boundingBox();
  const labelInputBox = await labelInput.boundingBox();
  expect(indexFieldBox).not.toBeNull();
  expect(quoteFieldBox).not.toBeNull();
  expect(typeFieldBox).not.toBeNull();
  expect(labelInputBox).not.toBeNull();
  expect(indexFieldBox!.y).toBeLessThan(typeFieldBox!.y);
  expect(typeFieldBox!.y).toBeLessThan(labelInputBox!.y);
  expect(labelInputBox!.y).toBeLessThan(quoteFieldBox!.y);
  const formBox = await form.boundingBox();
  expect(formBox).not.toBeNull();
  expect(formBox!.width).toBeLessThan(1880);
  expect(formBox!.height).toBeLessThan(1334);
  await expect.poll(async () => form.evaluate((node) => node.scrollHeight <= node.clientHeight)).toBe(true);
  await expect(page.getByTestId("add-index-field")).toHaveCSS("border-width", "0px");
  await expect(page.getByTestId("add-quote-field")).toHaveCSS("border-width", "0px");
  await expect(page.getByTestId("add-type-field")).toHaveCSS("border-width", "0px");
  const actionsBox = await page.getByTestId("add-index-actions").boundingBox();
  const confirmBox = await page.getByRole("button", { name: "Add", exact: true }).boundingBox();
  const cancelBox = await page.getByRole("button", { name: "Cancel" }).boundingBox();
  expect(actionsBox).not.toBeNull();
  expect(confirmBox).not.toBeNull();
  expect(cancelBox).not.toBeNull();
  expect(confirmBox!.width).toBeGreaterThanOrEqual(112);
  expect(cancelBox!.width).toBeGreaterThanOrEqual(112);
  expect(confirmBox!.x).toBeLessThan(cancelBox!.x);
  expect(Math.abs(
    actionsBox!.x + actionsBox!.width / 2
      - (formBox!.x + formBox!.width / 2),
  )).toBeLessThanOrEqual(1);

  await indexInput.fill("Edited Index");
  await pageInput.fill("7");
  await sourceInput.fill("Edited source");
  await labelInput.fill("Party label");
  await page.getByRole("combobox", { name: "Type" }).click();
  await page.getByRole("option", { name: "Grantor" }).click();
  await expect(page.getByRole("button", { name: "Add", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("button", { name: "Confirm" })).toHaveAttribute("data-armed", "true");
  await expect(host).toBeVisible();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(host).toHaveCount(0);
  await expect.poll(() => serviceRequest).not.toBeNull();
  await expect(page.getByTestId("pending-item")).toHaveCount(1);
  releaseService();
  await expect(page.locator("#visual-stage")).toHaveAttribute("data-add-index-complete", "true");
  expect(serviceRequest).toEqual({
    authorization: "Bearer token",
    body: {
      segment: "party",
      explanation: "P 7  Edited source",
      new_index_label: "Party label",
      new_index_aspect: "grantor",
      new_index_value: "Edited Index",
    },
    method: "POST",
  });
});

test("Add Index closes and retains a recoverable task when the service rejects the index", async ({ page }) => {
  await page.route("https://gateway.example.test/v1/refine/visual-session-001/patch/add", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ data: "Index already exists.", status: "error", version: 3 }),
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
  await page.getByRole("button", { exact: true, name: "Select" }).click();
  await page.getByRole("button", { name: "Export" }).click();

  const host = page.getByTestId("add-index-host");
  await expect(host).toBeVisible();
  await page.getByRole("combobox", { name: "Type" }).click();
  await page.getByRole("option", { name: "Grantor" }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("button", { name: "Confirm" })).toHaveAttribute("data-armed", "true");
  await page.getByRole("button", { name: "Confirm" }).click();

  await expect(host).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveText("Index already exists.");
  await expect(page.getByRole("button", { name: "Retry change" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel change" }).click();
  await expect(page.getByTestId("pending-item")).toHaveCount(0);
  await expect(page.locator("#visual-stage")).not.toHaveAttribute("data-add-index-complete", "true");
});
