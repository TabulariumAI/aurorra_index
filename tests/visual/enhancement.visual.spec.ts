import { expect, test } from "@playwright/test";

test.use({ channel: "msedge" });

for (const width of [1440, 390]) {
  for (const mode of ["add", "update"]) {
    for (const segment of ["party", "property", "transaction"]) {
      test(`${mode} ${segment} Enhancement at ${width}px`, async ({ page }, testInfo) => {
        const errors: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        const bodies: Record<string, unknown>[] = [];
        await page.route("https://gateway.example.test/v1/refine/session/patch/*", async route => {
          bodies.push(route.request().postDataJSON());
          await route.fulfill({ json: { status: "completed", data: "", version: 1 } });
        });
        await page.route("https://gateway.example.test/v1/metadata/session/data", route => route.fulfill({ json: { status: "completed", data: "https://storage.example.test/metadata.json" } }));
        await page.route("https://storage.example.test/metadata.json", route => route.fulfill({ json: { indexes: [], parties: [], heading: {}, secrets: [], fees: [], funds: [] } }));
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/enhancement.html?mode=${mode}&segment=${segment}`);
        const checkbox = page.getByRole("checkbox", { name: "Enhancement" });
        await expect(checkbox).toBeVisible();
        await expect(checkbox).not.toBeChecked();
        if (segment === "transaction") await expect(checkbox).toBeDisabled();
        else {
          await expect(checkbox).toBeEnabled();
          await checkbox.check();
          await expect(checkbox).toBeChecked();
          await checkbox.uncheck();
          await expect(checkbox).not.toBeChecked();
          await checkbox.check();
        }
        await page.getByRole("textbox", { name: "Index" }).fill("Changed value");
        if (mode === "add") {
          await page.getByRole("combobox", { name: "Type" }).click();
          await page.getByRole("option", { name: segment === "party" ? "Person" : segment === "property" ? "Parcel Id" : "Recording Number" }).click();
          await page.getByRole("textbox", { name: "Index" }).click();
        }
        const command = page.getByRole("button", { name: mode === "add" ? "Add" : "Update", exact: true });
        const checkBox = await checkbox.boundingBox();
        const commandBox = await command.boundingBox();
        expect(checkBox!.y + checkBox!.height).toBeLessThan(commandBox!.y);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath("enhancement.png"), fullPage: true });
        await command.click();
        await page.getByRole("button", { name: "Confirm", exact: true }).click();
        await expect.poll(() => bodies.length).toBe(1);
        expect(bodies[0]).toMatchObject({ segment, allow_enrichment: segment !== "transaction", new_index_value: "Changed value" });
        expect(errors).toEqual([]);
      });
    }
  }
}
