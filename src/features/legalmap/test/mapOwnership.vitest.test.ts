import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("legal description ownership", () => {
  it.each(["metes", "plss", "plat"])("gives %s its own parser, drawer and geometry types", type => {
    const component = type[0].toUpperCase() + type.slice(1) + "Map";
    expect(existsSync(path.join(root, `data/${type}Data.ts`))).toBe(true);
    expect(existsSync(path.join(root, `component/${component}.tsx`))).toBe(true);
    expect(existsSync(path.join(root, `type/${type}.types.ts`))).toBe(true);
    for (const other of ["metes", "plss", "plat"].filter(name => name !== type)) {
      for (const file of [`data/${type}Data.ts`, `component/${component}.tsx`, `type/${type}.types.ts`]) {
        expect(read(file)).not.toMatch(new RegExp(`from ["'][^"']*(?:/${other}Data|/${other}\\.types|/${other[0].toUpperCase() + other.slice(1)}Map)["']`));
      }
    }
  });

  it("keeps common metadata access free of type-specific parsing", () => {
    expect(read("data/legalData.ts")).not.toMatch(/buildMatrix|buildPlss|toPlatJSON|normalizeLegalData|PlatSubdivision|SurveyScene/);
  });

  it("routes each existing drawing family to its own parser and drawer", () => {
    const groups = read("data/mapGroups.ts");
    const content = read("component/LegalMapContent.tsx");
    for (const type of ["metes", "plss", "plat"]) {
      expect(groups).toContain(`./${type}Data`);
      expect(content).toContain(`./${type[0].toUpperCase() + type.slice(1)}Map`);
    }
    for (const file of ["data/surveyData.ts", "component/SurveyMap.tsx"]) {
      expect(existsSync(path.join(root, file))).toBe(false);
    }
    expect(read("component/MetesMap.tsx")).not.toMatch(/data-survey-section|data-survey-area|plssScale/);
    expect(read("component/PlssMap.tsx")).not.toMatch(/data-survey-line|data-survey-point|data-boundary-fill|formatMeasure/);
    expect(groups).not.toMatch(/displayLots|getPresentLayers|toPlatJSON|parseBearing|parseDistance/);
    expect(read("component/LegalMapContent.tsx")).not.toMatch(/function (?:PlatMap|BlockView|LotView|DivisionView|Legend)\b|SurveyScene|SurveyMap/);
  });

  it("keeps map eligibility and public exports on the same package router", () => {
    const publicApi = readFileSync(path.join(root, "../../public-api.ts"), "utf8");
    const metadata = readFileSync(path.join(root, "../metdataview/component/MetadataPanel.tsx"), "utf8");
    expect(publicApi).toContain('export { getMapGroups } from "./features/legalmap/data/mapGroups"');
    expect(metadata).toContain('from "../../legalmap/data/mapGroups"');
  });
});
