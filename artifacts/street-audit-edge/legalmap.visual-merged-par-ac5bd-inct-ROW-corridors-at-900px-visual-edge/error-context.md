# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: legalmap.visual.spec.ts >> merged parcels retain distinct ROW corridors at 900px
- Location: tests\visual\legalmap.visual.spec.ts:218:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Right Of Way', { exact: true })
Expected: visible
Error: strict mode violation: getByText('Right Of Way', { exact: true }) resolved to 3 elements:
    1) <span>Right Of Way</span> aka getByLabel('Parcel').getByText('Right Of Way', { exact: true })
    2) <th scope="row">Right Of Way</th> aka getByRole('row', { name: 'Right Of Way 2.669 ACRE' }).getByRole('rowheader')
    3) <th scope="row">Right Of Way</th> aka getByRole('rowheader', { name: 'Right Of Way' }).nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Right Of Way', { exact: true })

```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e6]: "One parcel: Lot 32, Block 1, County Block 4482C, The Ranch at Iron Horse, Phase II, in Bexar County, Texas. PLATTED."
    - tablist "Map views" [ref=e8]:
      - tab "Lot & block" [selected] [ref=e9] [cursor=pointer]
    - tabpanel "Lot & block" [ref=e10]:
      - region "Parcel 1" [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e17]:
            - generic [ref=e19]:
              - generic [ref=e20]: THE RANCH AT IRON HORSE
              - generic [ref=e22]:
                - generic [ref=e23]:
                  - generic [ref=e25]: Phase II
                  - generic [ref=e28]:
                    - generic [ref=e30]:
                      - generic [ref=e31]: 1/4482C
                      - generic [ref=e32]: Block
                    - generic [ref=e34]:
                      - generic [ref=e35]: "32"
                      - generic [ref=e36]: Lot
                - generic [ref=e48]: 2.669 ACRE DRAINAGE RIGHT OF WAY
                - generic [ref=e49]: 5.455 ACRE DRAINAGE RIGHT OF WAY
            - generic [ref=e50]: Bexar County
          - generic [ref=e51]:
            - generic [ref=e52]:
              - img [ref=e53]
              - generic [ref=e55]: "N"
            - generic [ref=e57]:
              - generic [ref=e60]: Subdivision
              - generic [ref=e63]: Right Of Way
              - generic [ref=e66]: Phase
              - generic [ref=e69]: Block
              - generic [ref=e72]: Lot
      - separator "Resize map and details" [ref=e73]
      - complementary [ref=e75]:
        - region "Details" [ref=e76]:
          - table "Details" [ref=e77]:
            - rowgroup [ref=e81]:
              - row "Subdivision THE RANCH AT IRON HORSE" [ref=e82]:
                - rowheader "Subdivision" [ref=e83]
                - cell "THE RANCH AT IRON HORSE" [ref=e84]
              - row "Phase II" [ref=e85]:
                - rowheader "Phase" [ref=e86]
                - cell "II" [ref=e87]
              - row "Block 1" [ref=e88]:
                - rowheader "Block" [ref=e89]
                - cell "1" [ref=e90]
              - row "Lot 32" [ref=e91]:
                - rowheader "Lot" [ref=e92]
                - cell "32" [ref=e93]
              - row "Right Of Way 2.669 ACRE DRAINAGE RIGHT OF WAY" [ref=e94]:
                - rowheader "Right Of Way" [ref=e95]
                - cell "2.669 ACRE DRAINAGE RIGHT OF WAY" [ref=e96]
          - table "Details" [ref=e97]:
            - rowgroup [ref=e101]:
              - row "Subdivision THE RANCH AT IRON HORSE" [ref=e102]:
                - rowheader "Subdivision" [ref=e103]
                - cell "THE RANCH AT IRON HORSE" [ref=e104]
              - row "Phase II" [ref=e105]:
                - rowheader "Phase" [ref=e106]
                - cell "II" [ref=e107]
              - row "Block 4482C" [ref=e108]:
                - rowheader "Block" [ref=e109]
                - cell "4482C" [ref=e110]
              - row "Lot 32" [ref=e111]:
                - rowheader "Lot" [ref=e112]
                - cell "32" [ref=e113]
              - row "Right Of Way 5.455 ACRE DRAINAGE RIGHT OF WAY" [ref=e114]:
                - rowheader "Right Of Way" [ref=e115]
                - cell "5.455 ACRE DRAINAGE RIGHT OF WAY" [ref=e116]
```

# Test source

```ts
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
> 225 |     await expect(page.getByText("Right Of Way", { exact: true })).toBeVisible();
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
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
  283 |       const text = range.getBoundingClientRect();
  284 |       return {
  285 |         y: band.y, x: band.x, width: band.width, height: band.height, innerY: inner.y, innerX: inner.x,
  286 |         innerWidth: inner.width, innerHeight: inner.height,
  287 |         radius: style.borderRadius, hatch: style.backgroundImage, transform: style.transform,
  288 |         topBorder: style.borderTopWidth, bottomBorder: style.borderBottomWidth,
  289 |         textFits: text.x >= band.x && text.right <= band.right && text.y >= band.y && text.bottom <= band.bottom,
  290 |         visible: band.y >= 0 && band.bottom <= window.innerHeight,
  291 |         rootSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
  292 |       };
  293 |     }));
  294 |     geometry.forEach((band, index) => {
  295 |       expect(band.height).toBeCloseTo(3 * band.rootSize, 0);
  296 |       expect(band.innerHeight).toBeGreaterThanOrEqual(24 * band.rootSize);
  297 |       expect(band.x).toBeCloseTo(band.innerX, 0);
  298 |       expect(band.width).toBeCloseTo(band.innerWidth, 0);
  299 |       expect(band.y).toBeCloseTo(band.innerY + (index + 1) * band.innerHeight / 3 - band.height / 2, 0);
  300 |       expect(band.radius).toBe("0px");
  301 |       expect(band.hatch).toContain("repeating-linear-gradient");
  302 |       expect(band.topBorder).toBe("1px");
  303 |       expect(band.bottomBorder).toBe("1px");
  304 |       expect(band.textFits).toBe(true);
  305 |       expect(band.visible).toBe(true);
  306 |     });
  307 |     expect(geometry[0].y + geometry[0].height).toBeLessThan(geometry[1].y);
  308 |     const unit = await page.getByText("Unit 1", { exact: true }).boundingBox();
  309 |     expect(unit!.y).toBeGreaterThan(geometry[0].y + geometry[0].height);
  310 |     expect(unit!.y + unit!.height).toBeLessThan(geometry[1].y);
  311 |     await page.screenshot({ path: `artifacts/legalmap-row-${width}.png`, fullPage: true });
  312 |     await page.reload();
  313 |     await expect(bands).toHaveText(["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"]);
  314 |   });
  315 | }
  316 | 
  317 | test("a single ROW stays centered and ordinary maps keep their existing hierarchy", async ({ page }) => {
  318 |   await page.goto("/?scenario=legal-map&rows=true&count=1");
  319 |   const band = page.locator("[data-legal-map-row]");
  320 |   await expect(band).toHaveCount(1);
  321 |   expect(await band.evaluate(node => (node as HTMLElement).style.top)).toBe("50%");
  322 |   await page.goto("/?scenario=legal-map");
  323 |   await expect(page.locator("[data-legal-map-row]")).toHaveCount(0);
  324 |   await expect(page.getByText("Right Of Way", { exact: true })).toHaveCount(0);
  325 |   await expect(page.locator("[data-legal-map-subdivision]")).toHaveCount(2);
```