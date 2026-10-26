# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cogo.visual.spec.ts >> COGO gap details and anchored sections at 1440px
- Location: tests\visual\cogo.visual.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.focus: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('tab', { name: 'Boundary Calls' })

```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - tablist "Map views" [ref=e6]:
      - tab "Metes & Bounds" [selected] [ref=e7] [cursor=pointer]
    - tabpanel "Metes & Bounds" [ref=e8]:
      - generic [ref=e10]:
        - region "Parcel 1" [ref=e11]:
          - heading "Parcel 1" [level=4] [ref=e12]
          - note [ref=e13]:
            - img [ref=e14]
            - generic [ref=e17]: Partial COGO map shown. Confirmed calls plotted; unconfirmed pair(s) flagged for review.
          - generic [ref=e18]:
            - img "Parcel 1 schematic" [ref=e20]:
              - generic "North–south reference through point 1"
              - generic "Beginning; east 100 feet"
              - generic [ref=e21]:
                - generic: "1"
              - generic [ref=e24]:
                - generic: "2"
              - generic "Unconfirmed call 2" [ref=e27]:
                - generic [ref=e29]: "!"
                - generic [ref=e30]: Unconfirmed call
            - generic [ref=e31]:
              - img [ref=e32]
              - generic [ref=e34]: "N"
            - generic "Map legend" [ref=e36]:
              - generic [ref=e39]: Confirmed boundary
              - generic [ref=e42]: Unconfirmed call
        - region "Parcel 1" [ref=e43]:
          - heading "Parcel 1" [level=4] [ref=e44]
          - generic [ref=e45]:
            - img "Parcel 1 schematic" [ref=e47]:
              - generic "North–south reference through point 1"
              - generic "Beginning at a separate point; north 10 feet"
              - generic [ref=e48]:
                - generic: "4"
              - generic [ref=e51]:
                - generic: "5"
            - generic [ref=e54]:
              - img [ref=e55]
              - generic [ref=e57]: "N"
            - generic "Map legend" [ref=e59]:
              - generic [ref=e62]: Parcel boundary
      - separator "Resize map and details" [ref=e63]
      - complementary [ref=e65]:
        - region "Boundary Calls" [ref=e66]:
          - table "Boundary Calls" [ref=e67]:
            - rowgroup [ref=e75]:
              - row "# Boundary Bearing Distance Status Issue" [ref=e76]:
                - columnheader "#" [ref=e77]
                - columnheader "Boundary" [ref=e78]
                - columnheader "Bearing" [ref=e79]
                - columnheader "Distance" [ref=e80]
                - columnheader "Status" [ref=e81]
                - columnheader "Issue" [ref=e82]
            - rowgroup [ref=e83]:
              - row "1 1 → 2 E 100 feet Confirmed —" [ref=e84]:
                - cell "1" [ref=e85]
                - cell "1 → 2" [ref=e86]
                - cell "E" [ref=e87]
                - cell "100 feet" [ref=e88]
                - cell "Confirmed" [ref=e89]:
                  - generic [ref=e90]:
                    - img [ref=e92]
                    - text: Confirmed
                - cell "—" [ref=e94]
              - row "2 2 → 3 S — Unconfirmed Distance missing / ambiguous pair" [ref=e95]:
                - cell "2" [ref=e96]
                - cell "2 → 3" [ref=e97]
                - cell "S" [ref=e98]
                - cell "—" [ref=e99]
                - cell "Unconfirmed" [ref=e100]:
                  - generic [ref=e101]:
                    - img [ref=e102]
                    - text: Unconfirmed
                - cell "Distance missing / ambiguous pair" [ref=e105]
              - 'row "3 3 → 4 W 50 feet Confirmed Unlocated: explicit source anchor required" [ref=e106]':
                - cell "3" [ref=e107]
                - cell "3 → 4" [ref=e108]
                - cell "W" [ref=e109]
                - cell "50 feet" [ref=e110]
                - cell "Confirmed" [ref=e111]:
                  - generic [ref=e112]:
                    - img [ref=e114]
                    - text: Confirmed
                - 'cell "Unlocated: explicit source anchor required" [ref=e116]'
              - row "4 4 → 5 N 10 feet Confirmed —" [ref=e117]:
                - cell "4" [ref=e118]
                - cell "4 → 5" [ref=e119]
                - cell "N" [ref=e120]
                - cell "10 feet" [ref=e121]
                - cell "Confirmed" [ref=e122]:
                  - generic [ref=e123]:
                    - img [ref=e125]
                    - text: Confirmed
                - cell "—" [ref=e127]
          - note [ref=e128]:
            - img [ref=e129]
            - generic [ref=e132]:
              - strong [ref=e133]: "Unconfirmed details: 4 bearings and 3 distances extracted; 2 call(s) require review."
              - generic [ref=e134]: 2 confirmed calls plotted. Plotting resumes after a gap only at an explicit source anchor.
              - list [ref=e135]:
                - listitem [ref=e136]: "Call 2: south an uncertain distance — Distance missing / ambiguous pair"
                - listitem [ref=e137]: "Call 3: west 50 feet — Unlocated: explicit source anchor required"
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | for (const width of [1440, 900, 390]) {
  4  |   test(`COGO gap details and anchored sections at ${width}px`, async ({ page }, testInfo) => {
  5  |     await page.setViewportSize({ width, height: 1000 });
  6  |     await page.goto("/?scenario=legal-map&cogo=partial");
  7  |     await expect(page.getByRole("img", { name: /schematic/ })).toHaveCount(2);
  8  |     await expect(page.locator("[data-survey-line]")).toHaveCount(2);
  9  |     await expect(page.locator("[data-cogo-gap]")).toHaveCount(1);
  10 |     await expect(page.locator("[data-survey-gap]")).toHaveCount(0);
  11 |     const table = page.getByRole("table", { name: "Boundary Calls" });
  12 |     await expect(table).toContainText("Unconfirmed");
  13 |     await expect(table).toContainText("Unlocated");
  14 |     await expect(table).toContainText("50 feet");
> 15 |     await page.getByRole("tab", { name: "Boundary Calls" }).focus();
     |                                                             ^ Error: locator.focus: Test timeout of 30000ms exceeded.
  16 |     await expect(page.getByRole("tab", { name: "Boundary Calls" })).toBeFocused();
  17 |     expect(await page.locator(".legal-map").evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
  18 |     await page.screenshot({ path: testInfo.outputPath(`cogo-partial-${width}.png`), fullPage: true });
  19 |   });
  20 | 
  21 |   test(`legacy measurements remain available at ${width}px`, async ({ page }, testInfo) => {
  22 |     await page.setViewportSize({ width, height: 900 });
  23 |     await page.goto("/?scenario=legal-map&cogo=legacy");
  24 |     await expect(page.getByRole("table", { name: "Boundary Calls" })).toContainText("source verification required");
  25 |     await expect(page.locator("[data-survey-line]")).toHaveCount(0);
  26 |     await expect(page.locator("[data-cogo-gap]")).toHaveCount(1);
  27 |     await expect(page.getByRole("table", { name: "Boundary Calls" }).locator("tbody tr")).toHaveCount(3);
  28 |     const label = (await page.locator("[data-cogo-label]").boundingBox())!;
  29 |     expect(label.height).toBeGreaterThanOrEqual(12);
  30 |     expect(label.height).toBeLessThanOrEqual(24);
  31 |     await page.screenshot({ path: testInfo.outputPath(`cogo-legacy-${width}.png`), fullPage: true });
  32 |   });
  33 | }
  34 | 
  35 | for (const scenario of ["map", "lists"]) for (const width of [1440, 900, 390]) {
  36 |   test(`${scenario}: confirmed parcel and partial parcel preserve the requested layout at ${width}px`, async ({ page }, testInfo) => {
  37 |     await page.setViewportSize({ width, height: 1600 });
  38 |     await page.goto(`/?scenario=legal-map&cogo=${scenario}`);
  39 |     const maps = page.getByRole("img", { name: /Parcel .* schematic/ });
  40 |     await expect(maps).toHaveCount(2);
  41 |     await expect(maps.nth(0).locator("[data-survey-line]")).toHaveCount(7);
  42 |     await expect(maps.nth(1).locator("[data-survey-line]")).toHaveCount(3);
  43 |     await expect(maps.nth(0).locator("[data-cogo-gap]")).toHaveCount(0);
  44 |     await expect(maps.nth(1).locator("[data-cogo-gap]")).toHaveCount(1);
  45 |     await expect(maps.nth(1).getByText("Unconfirmed call", { exact: true })).toBeVisible();
  46 |     const warning = page.getByRole("note").filter({ hasText: "Partial COGO map shown" });
  47 |     expect((await warning.locator("svg").boundingBox())!.width).toBeGreaterThanOrEqual(18);
  48 |     await expect(page.getByRole("button", { name: "Reprocess legal" })).toHaveCount(0);
  49 |     const table = page.getByRole("table", { name: "Boundary Calls" }).nth(1);
  50 |     await expect(table.getByRole("columnheader")).toHaveText(["#", "Boundary", "Bearing", "Distance", "Status", "Issue"]);
  51 |     await expect(table.getByRole("row").last()).toContainText("4 → 5");
  52 |     await expect(table.getByRole("row").last()).toContainText("Distance missing / ambiguous pair");
  53 |     await expect(page.locator("details")).toHaveCount(0);
  54 |     if (width === 390) {
  55 |       const caption = table.locator("caption");
  56 |       const text = await caption.evaluate(node => {
  57 |         const range = document.createRange();
  58 |         range.selectNodeContents(node);
  59 |         const bounds = range.getBoundingClientRect();
  60 |         return { left: bounds.left, right: bounds.right };
  61 |       });
  62 |       const panel = (await page.locator("[data-legal-map-info]").boundingBox())!;
  63 |       expect(text.left).toBeGreaterThanOrEqual(panel.x);
  64 |       expect(text.right).toBeLessThanOrEqual(panel.x + panel.width);
  65 |     }
  66 |     await page.screenshot({ path: testInfo.outputPath(`cogo-map-${width}.png`), fullPage: true });
  67 |   });
  68 | }
  69 | 
```