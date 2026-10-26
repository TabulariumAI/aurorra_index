# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: legalmap.visual.spec.ts >> one parcel retains both block identifiers and one lot at 1440px
- Location: tests\visual\legalmap.visual.spec.ts:173:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('[data-legal-map-info]')
Expected substring: "One parcel: Lot 32, Block 1, County Block 4482C"
Received string:    "SubdivisionTHE RANCH AT IRON HORSEPhaseIIBlock1Lot32SubdivisionTHE RANCH AT IRON HORSEPhaseIIBlock4482CLot32"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('[data-legal-map-info]')
    14 × locator resolved to <aside class="legal-map-info" data-legal-map-info="true">…</aside>
       - unexpected value "SubdivisionTHE RANCH AT IRON HORSEPhaseIIBlock1Lot32SubdivisionTHE RANCH AT IRON HORSEPhaseIIBlock4482CLot32"

```

```yaml
- complementary:
  - region "Details":
    - table "Details":
      - rowgroup:
        - row "Subdivision THE RANCH AT IRON HORSE":
          - rowheader "Subdivision"
          - cell "THE RANCH AT IRON HORSE"
        - row "Phase II":
          - rowheader "Phase"
          - cell "II"
        - row "Block 1":
          - rowheader "Block"
          - cell "1"
        - row "Lot 32":
          - rowheader "Lot"
          - cell "32"
    - table "Details":
      - rowgroup:
        - row "Subdivision THE RANCH AT IRON HORSE":
          - rowheader "Subdivision"
          - cell "THE RANCH AT IRON HORSE"
        - row "Phase II":
          - rowheader "Phase"
          - cell "II"
        - row "Block 4482C":
          - rowheader "Block"
          - cell "4482C"
        - row "Lot 32":
          - rowheader "Lot"
          - cell "32"
```

# Test source

```ts
  82  |       await page.mouse.down();
  83  |       await page.mouse.move(moved.x + moved.width / 2, moved.y + 150, { steps: 10 });
  84  |       await page.mouse.up();
  85  |       await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(contracted.height, 0);
  86  |       await divider.focus();
  87  |       await expect(divider).toBeFocused();
  88  |       await page.keyboard.press("End");
  89  |       await expect.poll(async () => (await block.boundingBox())!.height).toBeCloseTo(contracted.height, 0);
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
> 182 |     await expect(page.locator("[data-legal-map-info]")).toContainText("One parcel: Lot 32, Block 1, County Block 4482C");
      |                                                         ^ Error: expect(locator).toContainText(expected) failed
  183 |     await expect(page.getByText("Subdivision", { exact: true })).toBeVisible();
  184 |     const layout = await label.evaluate(node => {
  185 |       const range = document.createRange();
  186 |       range.selectNodeContents(node);
  187 |       const text = range.getBoundingClientRect();
  188 |       const block = node.parentElement!.getBoundingClientRect();
  189 |       const lot = document.querySelector("[data-legal-map-lot]")!.getBoundingClientRect();
  190 |       const grid = document.querySelector("[data-legal-map-grid]")!.getBoundingClientRect();
  191 |       const info = document.querySelector("[data-legal-map-info]")!.getBoundingClientRect();
  192 |       return {
  193 |         textFits: text.x >= block.x && text.right <= block.right && text.y >= block.y && text.bottom <= block.bottom,
  194 |         centered: Math.abs(text.x + text.width / 2 - block.x - block.width / 2) < 1,
  195 |         lotVisible: lot.x >= grid.x && lot.right <= grid.right && lot.y >= grid.y && lot.bottom <= grid.bottom,
  196 |         infoToRight: info.x >= grid.right,
  197 |       };
  198 |     });
  199 |     expect(layout).toEqual({ textFits: true, centered: true, lotVisible: true, infoToRight: true });
  200 |     await page.screenshot({ path: `artifacts/legalmap-parcel-${width}.png`, fullPage: true });
  201 |     await page.reload();
  202 |     await expect(label).toHaveText("1/4482C");
  203 |     await page.goto("/?scenario=legal-map&parcels=2");
  204 |     await expect(page.locator("[data-legal-map-block-label]")).toHaveText(["1", "4482C"]);
  205 |     await expect(page.locator("[data-legal-map-lot]")).toHaveCount(2);
  206 |     await page.goto("/?scenario=legal-map&parcels=0");
  207 |     await expect(page.locator("[data-legal-map-block-label]")).toHaveText(["1", "4482C"]);
  208 |   });
  209 | }
  210 | 
  211 | test("equal merge weights follow source order and stop at the parcel count", async ({ page }) => {
  212 |   await page.goto("/?scenario=legal-map&parcels=2&ties=true");
  213 |   await expect(page.locator("[data-legal-map-block-label]")).toHaveText(["1/2", "4482C"]);
  214 |   await expect(page.locator("[data-legal-map-lot]")).toHaveCount(2);
  215 | });
  216 | 
  217 | for (const width of [1440, 900]) {
  218 |   test(`merged parcels retain distinct ROW corridors at ${width}px`, async ({ page }) => {
  219 |     await page.setViewportSize({ width, height: 900 });
  220 |     await page.goto("/?scenario=legal-map&parcels=1&merged-rows=true");
  221 |     await expect(page.locator("[data-legal-map-block-label]")).toHaveText("1/4482C");
  222 |     await expect(page.locator("[data-legal-map-lot]")).toHaveText("32Lot");
  223 |     const bands = page.locator("[data-legal-map-row]");
  224 |     await expect(bands).toHaveText(["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"]);
  225 |     await expect(page.getByText("Right Of Way", { exact: true })).toBeVisible();
  226 |     const geometry = await bands.evaluateAll(nodes => nodes.map(node => {
  227 |       const band = node.getBoundingClientRect();
  228 |       const parent = node.parentElement!.getBoundingClientRect();
  229 |       const range = document.createRange();
  230 |       range.selectNodeContents(node);
  231 |       const text = range.getBoundingClientRect();
  232 |       return { contained: band.x >= parent.x && band.right <= parent.right && band.y >= parent.y && band.bottom <= parent.bottom,
  233 |         textFits: text.x >= band.x && text.right <= band.right && text.y >= band.y && text.bottom <= band.bottom,
  234 |         top: band.y, bottom: band.bottom };
  235 |     }));
  236 |     expect(geometry.every(band => band.contained && band.textFits)).toBe(true);
  237 |     expect(geometry[0].bottom).toBeLessThan(geometry[1].top);
  238 |     await page.screenshot({ path: `artifacts/legalmap-merged-row-${width}.png`, fullPage: true });
  239 |   });
  240 | }
  241 | 
  242 | test("legal map content renders plat grid", async ({ page }) => {
  243 |   await page.goto("/?scenario=legal-map");
  244 | 
  245 |   await expect(page.locator("[data-legal-map-grid='true']")).toBeVisible();
  246 |   await expect(page.getByRole("dialog", { name: "Lot & block" })).toHaveCount(0);
  247 |   await expect(page.getByRole("button", { name: "Close" })).toHaveCount(0);
  248 | 
  249 |   const layout = await page.locator("[data-legal-map-grid='true']").evaluate((node) => ({
  250 |     height: node.getBoundingClientRect().height,
  251 |     width: node.getBoundingClientRect().width,
  252 |   }));
  253 | 
  254 |   expect(layout.height).toBeGreaterThan(0);
  255 |   expect(layout.width).toBeGreaterThan(0);
  256 |   const location = page.locator("#plat-location-bottom");
  257 |   const legend = page.getByText("Subdivision", { exact: true });
  258 |   await expect(legend).toBeVisible();
  259 |   await expect(page.locator("[data-legal-map-footer='true']")).toContainText("Subdivision");
  260 |   expect(await location.evaluate(node => getComputedStyle(node).fontSize)).toBe(
  261 |     await page.getByText("MISSION DEL LAGO UNIT 16A", { exact: true }).evaluate(node => getComputedStyle(node).fontSize),
  262 |   );
  263 | });
  264 | 
  265 | for (const width of [1440, 900]) {
  266 |   test(`ROW corridors fit their subdivision at ${width}px`, async ({ page }) => {
  267 |     await page.setViewportSize({ width, height: 900 });
  268 |     await page.goto("/?scenario=legal-map&rows=true");
  269 |     const subdivision = page.locator("[data-legal-map-subdivision]");
  270 |     const bands = subdivision.locator("[data-legal-map-row]");
  271 |     await expect(subdivision).toHaveCount(1);
  272 |     await expect(bands).toHaveText(["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"]);
  273 |     await expect(page.getByText("Unit 1", { exact: true })).toBeVisible();
  274 |     await expect(page.locator("[data-legal-map-block], [data-legal-map-lot]")).toHaveCount(0);
  275 |     await expect(page.locator("[data-legal-map-info]")).toContainText("Summary");
  276 |     await expect(page.getByText("Right Of Way", { exact: true })).toBeVisible();
  277 |     const geometry = await bands.evaluateAll(nodes => nodes.map(node => {
  278 |       const band = node.getBoundingClientRect();
  279 |       const inner = node.parentElement!.getBoundingClientRect();
  280 |       const style = getComputedStyle(node);
  281 |       const range = document.createRange();
  282 |       range.selectNodeContents(node);
```