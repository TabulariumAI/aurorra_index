import { expect, test } from "@playwright/test";

for (const width of [1440, 390, 320]) test(`IQ panel renders notes and clears failed gate at ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/?scenario=iq");

  await expect(page.getByText("Indexing Quality (IQ)")).toBeVisible();
  await expect(page.locator("div").filter({ hasText: /^90%$/ })).toBeVisible();
  await expect(page.getByText(/^Indexing Segments/)).toHaveCount(0);
  const rows = page.getByRole("table").getByRole("row");
  await expect(rows).toHaveCount(6);
  await expect(rows.nth(1).getByRole("cell").first()).toHaveText("Sides");
  await expect(rows.nth(2).getByRole("cell").first()).toHaveText("Transaction");
  await expect(rows.nth(3).getByRole("cell").first()).toHaveText("Party");
  await expect(rows.nth(4).getByRole("cell").first()).toHaveText("Legal");
  await expect(rows.nth(5).getByRole("cell").first()).toHaveText("Reference");
  await expect(page.getByRole("cell", { name: "Party" })).toBeVisible();
  expect(await page.evaluate(() => navigator.userAgent)).toContain("Edg/");
  await page.screenshot({ path: testInfo.outputPath("iq-quality.png"), fullPage: true });
  await page.getByRole("tab", { name: "Compliance" }).click();
  await expect(page.getByRole("table")).toBeHidden();
  await expect(page.getByText(/^Compliance Gates \(/)).toHaveCount(0);
  await expect(page.getByText("out of 2 gates")).toBeVisible();
  await expect(page.getByText("50%")).toBeVisible();
  await expect(page.locator("[data-gate-code]")).toHaveCount(2);
  await expect(page.locator("[data-gate-code='gate-pass']")).toContainText('Compliance is satisfied. Notary Seal is present.');
  await expect(page.locator("[data-gate-code='gate-pass']").getByText("PASS", { exact: true })).toBeVisible();
  await expect(page.getByText("INFO", { exact: true })).toHaveCount(0);
  for (const code of ["gate-pass", "gate-fail"]) {
    const text = page.locator(`[data-gate-code='${code}'] > span`);
    await expect(text.locator("br")).toHaveCount(1);
    const positions = await text.evaluate(element => {
      const lineBreak = element.querySelector("br")!;
      const before = document.createRange();
      before.selectNodeContents(lineBreak.previousSibling!);
      const after = document.createRange();
      after.selectNodeContents(lineBreak.nextSibling!);
      return { before: before.getBoundingClientRect().top, after: after.getBoundingClientRect().top };
    });
    expect(positions.after).toBeGreaterThan(positions.before);
    expect(await text.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath("iq-compliance.png"), fullPage: true });
  await page.getByRole("tab", { name: "Notes" }).click();
  const notes = page.getByRole("tabpanel", { name: "Notes" });
  await expect(notes.getByText("Notes", { exact: true })).toHaveCount(0);
  await expect(notes.getByRole("list")).toHaveCount(0);
  const text = notes.locator("p");
  await expect(notes.locator(".iq-note")).toHaveCount(16);
  const firstNote = (await notes.locator(".iq-note").first().boundingBox())!;
  const tabStrip = (await page.getByRole("tablist", { name: "IQ views" }).boundingBox())!;
  expect(firstNote.x).toBeCloseTo(tabStrip.x, 0);
  for (const paragraph of await text.all()) {
    const bounds = (await paragraph.boundingBox())!;
    expect(bounds.x).toBeCloseTo(firstNote.x + 36, 0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
  }
  await expect(notes.locator("p")).toHaveCount(16);
  await expect(notes.getByText("Compliance gates: not satisfied (1 / 2).", { exact: true })).toHaveCount(0);
  await expect(notes.getByText("Indexing quality needing attention: Party.", { exact: true })).toHaveCount(0);
  for (const grade of ["Optimal (1/20)", "Satisfied (0/20)"]) {
    const card = notes.locator("p").filter({ hasText: `Unclassified indexes: ${grade}` });
    await expect(card).toHaveAttribute("data-status", "success");
    await expect(card).toHaveCSS("border-left-width", "0px");
    await expect(card).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    expect(await card.evaluate(element => getComputedStyle(element).color)).toBe(await page.getByText("Indexing Quality (IQ)").evaluate(element => getComputedStyle(element).color));
    await expect(card.getByText("success", { exact: true })).toHaveCount(0);
    await expect(card.getByRole("img")).toHaveCount(0);
    await expect(card.locator("[data-status-icon]")).toHaveCount(0);
  }
  for (const card of await notes.locator("p").filter({ hasText: /(WARNING:|Unclassified indexes: (Needs Attention|High Risk|Critical))/ }).all()) {
    await expect(card).toHaveAttribute("data-status", "warning");
    await expect(card).toHaveCSS("border-left-width", "0px");
    await expect(card).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(card.getByText("warning", { exact: true })).toHaveCount(0);
    await expect(card.getByRole("img")).toHaveCount(0);
  }
  await expect(notes.locator("p[data-status='success']")).toHaveCount(2);
  await expect(notes.locator("p[data-status='warning']")).toHaveCount(5);
  await expect(notes.locator("p[data-status='neutral']")).toHaveCount(9);
  for (const card of await notes.locator("p[data-status='neutral']").all()) {
    await expect(card).toHaveCSS("border-left-width", "0px");
  }
  for (const paragraph of await text.all()) {
    await expect(paragraph).toHaveCSS("padding", "0px 16px");
    await expect(paragraph).toHaveCSS("overflow-wrap", "anywhere");
    expect(await paragraph.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(notes.locator("p > strong")).toHaveCount(10);
  for (const heading of await notes.locator("p > strong").all()) {
    await expect(heading).toHaveCSS("font-weight", "700");
    const position = await heading.evaluate(element => ({
      heading: element.getBoundingClientRect().bottom,
      message: element.nextElementSibling!.getBoundingClientRect().top,
    }));
    expect(position.message).toBeGreaterThanOrEqual(position.heading);
  }
  const info = notes.locator("p").filter({ hasText: "Required indexes were not confirmed: Effective Date." });
  await expect(info).toHaveAttribute("data-status", "neutral");
  await expect(info.locator("strong")).toHaveText("Transaction");
  await expect(info.getByText("WARNING:", { exact: true })).toHaveCount(0);
  await expect(notes.getByText("WARNING:", { exact: true })).toHaveCount(2);
  const contrast = await notes.getByText("WARNING:", { exact: true }).first().evaluate(label => {
    const luminance = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3)
      .map(channel => Number(channel) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const foreground = luminance(getComputedStyle(label).color);
    const background = luminance(getComputedStyle(document.getElementById("visual-stage")!).backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
  const secondNote = (await notes.locator(".iq-note").nth(1).boundingBox())!;
  expect(secondNote.y - firstNote.y - firstNote.height).toBeCloseTo(0, 0);
  await expect(notes.getByText("Report explanation", { exact: true })).toBeVisible();
  await expect(notes.getByText("Required indexes were not confirmed: Effective Date.", { exact: true })).toBeVisible();
  await expect(notes.getByText(/Missing indexes:/)).toHaveCount(0);
  await expect(notes.getByText("WARNING: The transaction segment has ambiguous index values for effective date.", { exact: true })).toBeVisible();
  await expect(notes.getByText("WARNING: The acknowledgment segment has ambiguous index values for acknowledgment date.", { exact: true })).toBeVisible();
  const warningLabel = notes.getByText("WARNING:", { exact: true }).first();
  await expect(warningLabel).toHaveCSS("color", "rgb(146, 64, 14)");
  await text.first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("iq-notes.png"), fullPage: true });
  const expandable = notes.locator(".iq-note").filter({ has: page.getByRole("button", { name: "Expand note" }) });
  expect(await expandable.count()).toBe(2);
  const row = expandable.first();
  const preview = await row.locator("p > span").innerText();
  expect(preview.split(/\s+/)).toHaveLength(25);
  expect(preview.endsWith("…")).toBe(true);
  const trigger = row.getByRole("button", { name: "Expand note" });
  await expect(trigger).toHaveCSS("width", "32px");
  await expect(trigger).toHaveCSS("height", "32px");
  await expect(trigger).toHaveCSS("color", "rgb(0, 139, 163)");
  await trigger.hover();
  await expect(trigger).toHaveCSS("background-color", "rgb(224, 243, 255)");
  await trigger.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS("outline-style", "solid");
  await expect(trigger).toHaveCSS("outline-offset", "3px");
  await page.keyboard.press("Enter");
  const expanded = notes.locator('.iq-note[data-state="open"]');
  await expect(expanded.getByRole("button", { name: "Collapse note" })).toHaveAttribute("aria-expanded", "true");
  expect((await expanded.locator("p > span").innerText()).split(/\s+/).length).toBeGreaterThan(25);
  await expect(expanded.locator("strong")).toBeVisible();
  await expect(expanded).toHaveCSS("background-color", "rgb(246, 252, 251)");
  await expect(expanded.locator("p")).toHaveCSS("overflow-wrap", "anywhere");
  await page.screenshot({ path: testInfo.outputPath("iq-notes-expanded.png"), fullPage: true });
  await page.keyboard.press("Space");
  await expect(notes.locator('.iq-note[data-state="open"]')).toHaveCount(0);
  await expect(notes.getByRole("button", { name: "Expand note" }).first()).toHaveAttribute("aria-expanded", "false");
  await text.last().scrollIntoViewIfNeeded();
  await expect(text.last()).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("iq-notes-bottom.png"), fullPage: true });
  await page.getByRole("tab", { name: "Compliance" }).click();
  await expect(page.getByText("Compliance is not satisfied. Notary Name is unavailable.")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-gate-code='gate-fail']").getByRole("button", { name: "Clear gate" })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  const clear = page.locator("[data-gate-code='gate-fail']").getByRole("button", { name: "Clear gate" });
  await expect(clear).toHaveText("");
  await expect(clear.locator("svg")).toBeVisible();
  await clear.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Clear gate");
  await clear.focus();
  await page.keyboard.press("Enter");
  const confirm = page.locator("[data-gate-code='gate-fail']").getByRole("button", { name: "Confirm", exact: true });
  await expect(confirm).toBeVisible();
  await expect(confirm.locator("svg")).toBeVisible();
  await expect(confirm.locator("[data-confirm-progress]")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.locator("[data-gate-code='gate-fail']")).toHaveCount(0);
  await expect(page.getByText("out of 2 gates")).toBeVisible();
  await expect(page.locator("div").filter({ hasText: /^50%$/ })).toBeVisible();
  await page.getByRole("tab", { name: "Notes" }).click();
  await expect(notes.locator("p")).toHaveCount(16);
  await expect(notes.locator("p[data-status='success']")).toHaveCount(2);
  await expect(notes.locator("p[data-status='warning']")).toHaveCount(5);
  await page.reload();
  await expect(page.getByRole("tab", { name: "Notes" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel", { name: "Notes" }).locator("p")).toHaveCount(16);
});

test("IQ notes retain content and status cues at 200 percent text size", async ({ page }, testInfo) => {
  await page.goto("/?scenario=iq");
  await page.addStyleTag({ content: ":root { font-size: 200%; }" });
  await page.getByRole("tab", { name: "Notes" }).click();
  const notes = page.getByRole("tabpanel", { name: "Notes" });
  await expect(notes.locator("p")).toHaveCount(16);
  await expect(notes.locator("p[data-status='success']")).toHaveCount(2);
  await expect(notes.locator("p[data-status='warning']")).toHaveCount(5);
  for (const card of await notes.locator("p").all()) {
    expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("iq-notes-scaled.png"), fullPage: true });
  await notes.getByText("Report explanation", { exact: true }).scrollIntoViewIfNeeded();
  await expect(notes.getByText("Report explanation", { exact: true })).toBeInViewport();
});
