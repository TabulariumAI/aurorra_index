import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

const indexRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const coreRoot = path.resolve(indexRoot, "../../aurora_core/src");
const read = (root: string, file: string) => readFileSync(path.join(root, file), "utf8");

describe("index metadata ownership", () => {
  it("keeps the composed metadata panel and its public contract in Index", () => {
    expect(existsSync(path.join(coreRoot, "features/metadata/component/MetadataPanel.tsx"))).toBe(false);
    expect(read(coreRoot, "public-api.ts")).not.toMatch(/\bMetadataPanel(?:Props)?\b/);
    expect(read(coreRoot, "features/metadata/type/metadata.types.ts")).not.toMatch(/\bMetadataPanel(?:Actions|Sections)\b/);
    expect(read(indexRoot, "public-api.ts")).toContain('export { MetadataPanel } from "./features/metdataview/component/MetadataPanel"');
    expect(read(indexRoot, "public-api.ts")).toContain('export type { MetadataPanelProps, MetadataPanelActions, MetadataPanelSections } from "./features/metdataview/component/MetadataPanel"');
    expect(read(indexRoot, "features/indexing/component/IndexContainer.tsx")).toContain('from "../../metdataview/component/MetadataPanel"');
  });

  it("keeps legal-map eligibility in Index without duplicating it in Core", () => {
    expect(read(coreRoot, "features/metadata/data/metadataData.ts")).not.toContain("hasPlatMap");
    expect(read(indexRoot, "features/legalmap/data/surveyData.ts")).toContain("export function getMapGroups(");
    expect(read(indexRoot, "features/legalmap/component/LegalMapContent.tsx")).not.toMatch(/import\s*\{[^}]*getMapGroups[^}]*\}\s*from\s*["']aurora-core["']/);
    expect(read(indexRoot, "features/metdataview/component/MetadataPanel.tsx")).toContain('from "../../legalmap/data/surveyData"');
  });
});
