# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: legalmap.visual.spec.ts >> single lot with part preserves readable labels through divider changes at 900px
- Location: tests\visual\legalmap.visual.spec.ts:56:5

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 436
Received: 137.68421936035156

Expected precision:    0
Expected difference: < 0.5
Received difference:   298.31578063964844

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e6]: "One parcel: the easterly 40 feet of the westerly 80 feet of Sublot 37 in Lowrie Company's Forestdale Allotment."
    - tablist "Map views" [ref=e8]:
      - tab "Lot & block" [selected] [ref=e9] [cursor=pointer]
    - tabpanel "Lot & block" [ref=e10]:
      - region "Parcel 1" [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e19]:
            - generic [ref=e20]: LOWRIE COMPANY'S FORESTDALE ALLOTMENT
            - generic [ref=e29]:
              - generic [ref=e30]: SUB NO. 37
              - generic [ref=e31]: Lot
          - generic [ref=e43]:
            - generic [ref=e44]:
              - img [ref=e45]
              - generic [ref=e47]: "N"
            - generic [ref=e49]:
              - generic [ref=e52]: Subdivision
              - generic [ref=e55]: Lot
      - separator "Resize map and details" [active] [ref=e56]
      - complementary [ref=e58]:
        - region "Details" [ref=e59]:
          - table "Details" [ref=e60]:
            - rowgroup [ref=e64]:
              - row "City CLEVELAND" [ref=e65]:
                - rowheader "City" [ref=e66]
                - cell "CLEVELAND" [ref=e67]
              - row "County CUYAHOGA" [ref=e68]:
                - rowheader "County" [ref=e69]
                - cell "CUYAHOGA" [ref=e70]
              - row "State OHIO" [ref=e71]:
                - rowheader "State" [ref=e72]
                - cell "OHIO" [ref=e73]
              - row "Lot SUB NO. 37" [ref=e74]:
                - rowheader "Lot" [ref=e75]
                - cell "SUB NO. 37" [ref=e76]
              - row "Subdivision LOWRIE COMPANY'S FORESTDALE ALLOTMENT" [ref=e77]:
                - rowheader "Subdivision" [ref=e78]
                - cell "LOWRIE COMPANY'S FORESTDALE ALLOTMENT" [ref=e79]
              - row "Part EASTERLY 40 FEET OF THE WESTERLY 80 FEET" [ref=e80]:
                - rowheader "Part" [ref=e81]
                - cell "EASTERLY 40 FEET OF THE WESTERLY 80 FEET" [ref=e82]
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | 
  3   | for (const width of [1440, 900, 390]) {
  4   |   test(`street-relative fallback and final failure at ${width}px`, async ({ page }, testInfo) => {
  5   |     const errors: string[] = [];
  6   |     page.on("pageerror", error => errors.push(error.message));
  7   |     await page.setViewportSize({ width, height: 1100 });
  8   |     await page.goto("/?scenario=legal-map&street=true");
  9   |     const lines = page.locator('[data-survey-line][data-unconfirmed="true"][stroke-dasharray="6 4"]');
  10  |     await expect(lines).toHaveCount(4);
  11  |     await expect(page.locator("[data-boundary-fill]")).toHaveCount(0);
  12  |     await expect(page.locator("[data-survey-point]")).toHaveCount(4);
  13  |     await expect(page.getByRole("note")).toContainText(/schematic/i);
  14  |     const table = page.getByRole("table", { name: "Boundary Calls" });
  15  |     await expect(table.getByRole("row")).toHaveCount(5);
  16  |     await expect(table.getByRole("row").last()).toContainText("4 → 1");
  17  |     await expect(table.getByText("59 ft 8 in", { exact: true })).toHaveCount(2);
  18  |     await expect(table).not.toContainText(/48 ft|3 ft|2 ft 6 in/);
  19  |     await expect(page.getByRole("img", { name: /schematic/ })).toBeVisible();
  20  |     const geometry = await lines.evaluateAll(nodes => nodes.map(node => {
  21  |       const line = node.getBoundingClientRect();
  22  |       const svg = node.closest("svg")!.getBoundingClientRect();
  23  |       const style = getComputedStyle(node);
  24  |       return Number.isFinite(line.x + line.y + line.width + line.height) && Math.hypot(line.width, line.height) > 0
  25  |         && style.visibility === "visible" && style.display !== "none"
  26  |         && line.left >= svg.left - 1 && line.right <= svg.right + 1
  27  |         && line.top >= svg.top - 1 && line.bottom <= svg.bottom + 1;
  28  |     }));
  29  |     expect(geometry.every(Boolean)).toBe(true);
  30  |     const status = table.getByRole("button", { name: "Unconfirmed" }).first();
  31  |     await status.hover();
  32  |     await expect(page.getByRole("tooltip")).toContainText(/schematic/i);
  33  |     await page.mouse.move(0, 0);
  34  |     await status.focus();
  35  |     await expect(status).toBeFocused();
  36  |     await expect(page.getByRole("tooltip")).toContainText(/schematic/i);
  37  |     await page.keyboard.press("Escape");
  38  |     await page.screenshot({ path: testInfo.outputPath(`street-boundary-${width}.png`), fullPage: true });
  39  |     await page.goto("/?scenario=legal-map&street=unsupported");
  40  |     await expect(page.locator("[data-survey-line]")).toHaveCount(0);
  41  |     await expect(page.getByRole("alert")).toHaveText("Sorry, this parcel’s boundary couldn’t be drawn from the available details.");
  42  |     await expect(page.getByText("16 ft FRONTAGE", { exact: true })).toBeVisible();
  43  |     await page.screenshot({ path: testInfo.outputPath(`street-unsupported-${width}.png`), fullPage: true });
  44  |     await page.goto("/?scenario=legal-map&metes=1");
  45  |     await page.getByRole("tab", { name: "Metes & Bounds", exact: true }).click();
  46  |     await expect(page.locator("[data-survey-line]")).toHaveCount(16);
  47  |     await expect(page.locator("[data-boundary-fill]")).toHaveCount(2);
  48  |     await expect(page.locator('[data-survey-tie="true"]')).toHaveCount(2);
  49  |     await expect(page.getByRole("table", { name: "Boundary Calls" })).toHaveCount(2);
  50  |     expect(errors).toEqual([]);
  51  |   });
  52  | }
  53  | 
  54  | for (const width of [1440, 900, 390]) {
  55  |   for (const scope of ["lot_scope", "part"]) {
  56  |     test(`single lot with ${scope} preserves readable labels through divider changes at ${width}px`, async ({ page }, testInfo) => {
  57  |       await page.setViewportSize({ width, height: 1100 });
  58  |       await page.goto(`/?scenario=legal-map&scope=${scope}`);
  59  |       const grid = page.locator("[data-legal-map-grid]");
  60  |       const content = grid.locator(":scope > div");
  61  |       const divider = page.getByRole("separator", { name: "Resize map and details" });
  62  |       const aspect = page.getByRole("table", { name: "Details" });
  63  |       const block = page.locator("[data-legal-map-block]");
  64  |       await expect(page.locator("[data-legal-map-fit]")).toHaveCount(0);
  65  |       await expect(aspect).toContainText("EASTERLY 40 FEET OF THE WESTERLY 80 FEET");
  66  |       await expect(page.getByRole("table", { name: "Details" })).toContainText("SUB NO. 37");
  67  |       await divider.focus();
  68  |       await page.keyboard.press("Home");
  69  |       await expect(divider).toHaveAttribute("aria-valuenow", await divider.getAttribute("aria-valuemin") as string);
  70  |       await divider.hover();
  71  |       await page.screenshot({ path: testInfo.outputPath(`map-fit-expanded-${scope}-${width}.png`), fullPage: true });
  72  |       const expanded = (await block.boundingBox())!;
  73  |       const handle = (await divider.boundingBox())!;
  74  |       await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  75  |       await page.mouse.down();
  76  |       await page.mouse.move(handle.x + handle.width / 2, handle.y - 200, { steps: 10 });
  77  |       await page.mouse.up();
  78  |       await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(expanded.height, 0);
  79  |       const contracted = (await block.boundingBox())!;
  80  |       const moved = (await divider.boundingBox())!;
  81  |       await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2);
  82  |       await page.mouse.down();
  83  |       await page.mouse.move(moved.x + moved.width / 2, moved.y + 150, { steps: 10 });
  84  |       await page.mouse.up();
  85  |       await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(contracted.height, 0);
  86  |       await divider.focus();
  87  |       await expect(divider).toBeFocused();
  88  |       await page.keyboard.press("End");
> 89  |       await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(contracted.height, 0);
      |                                                                          ^ Error: expect(received).toBeCloseTo(expected, precision)
  90  |       await page.keyboard.press("Home");
  91  |       await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(expanded.height, 0);
  92  |       const detailsHeight = Number(await divider.getAttribute("aria-valuenow"));
  93  |       await page.keyboard.press("ArrowUp");
  94  |       await expect.poll(async () => Number(await divider.getAttribute("aria-valuenow"))).toBeGreaterThan(detailsHeight);
  95  |       await page.keyboard.press("ArrowDown");
  96  |       await expect(divider).toHaveAttribute("aria-valuenow", String(detailsHeight));
  97  |       await page.keyboard.press("ArrowUp");
  98  |       await page.setViewportSize({ width, height: 800 });
  99  |       await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(expanded.height, 0);
  100 |       const layout = await grid.evaluate(node => {
  101 |         const bounds = node.getBoundingClientRect();
  102 |         const content = node.firstElementChild!.getBoundingClientRect();
  103 |         const header = document.querySelector(".legal-map-toolbar")!.getBoundingClientRect();
  104 |         const details = document.querySelector("[data-legal-map-info]")!.getBoundingClientRect();
  105 |         const divider = document.querySelector(".legal-map-divider")!.getBoundingClientRect();
  106 |         return {
  107 |           fits: node.scrollHeight <= node.clientHeight + 1 && node.scrollWidth <= node.clientWidth + 1,
  108 |           contained: content.x >= bounds.x && content.right <= bounds.right && content.y >= bounds.y && content.bottom <= bounds.bottom,
  109 |           headerClear: bounds.y >= header.bottom,
  110 |           detailsClear: details.y >= divider.bottom && divider.y >= document.querySelector(".legal-map-column")!.getBoundingClientRect().bottom,
  111 |         };
  112 |       });
  113 |       expect(layout).toEqual({ fits: true, contained: true, headerClear: true, detailsClear: true });
  114 |       await expect(aspect).toBeVisible();
  115 |       await expect(page.locator("[data-legal-map-lot]")).toHaveText("SUB NO. 37Lot");
  116 |       await page.screenshot({ path: testInfo.outputPath(`map-fit-${scope}-${width}.png`), fullPage: true });
  117 |       const saved = (await block.boundingBox())!;
  118 |       await page.reload();
  119 |       await expect(page.locator("[data-legal-map-fit]")).toHaveCount(0);
  120 |       await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(saved.height, 0);
  121 |     });
  122 |   }
  123 | }
  124 | 
  125 | 
  126 | 
  127 | for (const width of [1440, 900, 390]) {
  128 |   test(`property map tabs and address fit at ${width}px`, async ({ page }, testInfo) => {
  129 |     await page.setViewportSize({ width, height: 900 });
  130 |     await page.route("https://www.google.com/maps**", route => route.fulfill({ contentType: "text/html", body: "<html><body>Google map test response</body></html>" }));
  131 |     await page.goto("/?scenario=legal-map&address=true&parcels=1");
  132 |     const plat = page.getByRole("tab", { name: "Lot & block" });
  133 |     const address = page.getByRole("tab", { name: "Address" });
  134 |     await expect(plat).toHaveAttribute("aria-selected", "true");
  135 |     await expect(page.getByRole("heading", { name: "Address" })).toHaveCount(0);
  136 |     const layout = await page.locator(".legal-map").evaluate(node => {
  137 |       const tabs = node.querySelector("[role=tablist]")!.getBoundingClientRect();
  138 |       const map = node.querySelector("[data-legal-map-surface]")!.getBoundingClientRect();
  139 |       const label = node.querySelector("[data-legal-map-grid]")!.querySelector("[data-legal-map-subdivision]")!.previousElementSibling!.getBoundingClientRect();
  140 |       return {
  141 |         fits: node.scrollWidth <= node.clientWidth,
  142 |         tabsFit: tabs.right <= map.right && tabs.left >= map.left && tabs.bottom <= map.top,
  143 |         titleClear: label.top >= tabs.bottom,
  144 |         mapHeight: map.height,
  145 |       };
  146 |     });
  147 |     expect(layout).toMatchObject({ fits: true, tabsFit: true, titleClear: true });
  148 |     expect(layout.mapHeight).toBeGreaterThan(200);
  149 |     await page.screenshot({ path: testInfo.outputPath(`map-plat-${width}.png`), fullPage: true });
  150 |     await plat.focus();
  151 |     await page.keyboard.press("ArrowRight");
  152 |     await expect(address).toBeFocused();
  153 |     await expect(page.getByRole("tabpanel")).toHaveAccessibleName("Address");
  154 |     const iframe = page.getByTitle("Address map");
  155 |     await expect(iframe).toBeVisible();
  156 |     const overlay = await page.getByRole("tablist").boundingBox();
  157 |     await expect(iframe).toHaveAttribute("src", /www\.google\.com\/maps\?q=123%20Main.*&z=14$/);
  158 |     const bounds = await iframe.boundingBox();
  159 |     expect(bounds!.width).toBeGreaterThan(250);
  160 |     expect(bounds!.height).toBeGreaterThan(200);
  161 |     expect(overlay!.y + overlay!.height).toBeLessThanOrEqual(bounds!.y);
  162 |     expect(overlay!.x + overlay!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
  163 |     await page.screenshot({ path: testInfo.outputPath(`map-address-${width}.png`), fullPage: true });
  164 |     await address.focus();
  165 |     await page.keyboard.press("Home");
  166 |     await expect(plat).toBeFocused();
  167 |     await expect(page.locator("[data-legal-map-lot]")).toHaveCount(1);
  168 |     await expect(page.getByTitle("Address map")).toHaveCount(0);
  169 |   });
  170 | }
  171 | 
  172 | for (const width of [1440, 900]) {
  173 |   test(`one parcel retains both block identifiers and one lot at ${width}px`, async ({ page }) => {
  174 |     await page.setViewportSize({ width, height: 900 });
  175 |     await page.goto("/?scenario=legal-map&parcels=1");
  176 |     await expect(page.locator("[data-legal-map-block]")).toHaveCount(1);
  177 |     await expect(page.locator("[data-legal-map-lot]")).toHaveCount(1);
  178 |     const label = page.locator("[data-legal-map-block-label]");
  179 |     await expect(label).toHaveText("1/4482C");
  180 |     await expect(page.locator("[data-legal-map-lot]")).toHaveText("32Lot");
  181 |     await expect(page.getByText("Phase II", { exact: true })).toBeVisible();
  182 |     await expect(page.locator("[data-legal-map-info]")).toContainText("One parcel: Lot 32, Block 1, County Block 4482C");
  183 |     await expect(page.getByText("Subdivision", { exact: true })).toBeVisible();
  184 |     const layout = await label.evaluate(node => {
  185 |       const range = document.createRange();
  186 |       range.selectNodeContents(node);
  187 |       const text = range.getBoundingClientRect();
  188 |       const block = node.parentElement!.getBoundingClientRect();
  189 |       const lot = document.querySelector("[data-legal-map-lot]")!.getBoundingClientRect();
```