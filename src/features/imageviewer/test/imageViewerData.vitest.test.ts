import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parsePackageMetadata, parsePackageUrls, resolveSelectedIndex, toPageRequest, toPositivePage } from "../data/imageViewerData";
import type { PageRequest } from "../type/imageViewer.types";
import type { MetadataPayload } from "../../metdataview/type/metadataView.types";

const packageRoot = path.join(process.cwd(), "src", "test", "package");
const directPackage = JSON.parse(readFileSync(path.join(packageRoot, "image-package.json"), "utf8")) as { data: string; tiff: string };
const packageMetadata = JSON.parse(readFileSync(path.join(packageRoot, "image.json"), "utf8")) as { pages: unknown[] };

describe("imageViewerData", () => {
  it("normalizes pages and resolves page codes", () => {
    expect(toPositivePage(2)).toBe(2);
    expect(toPositivePage(0)).toBe(1);
    const request: PageRequest = {
      code: "old",
      highlightOptions: { scroll: false },
      index: "page",
      metadataIndex: null,
      page: 1,
      quote: "",
      segment: "page",
      session: "session-1",
      value: "",
    };
    expect(toPageRequest(request, new Map([["2", "page-2"]]), 2)).toMatchObject({ code: "page-2", page: 2 });
  });

  it("resolves selected metadata index in defined order", () => {
    const metadata: MetadataPayload = {
      indexes: [{ code: "idx-1", label: "Grantor", page_number: 1, source: "quote", value: "Alice" }],
      parties: [{ code: "idx-1", label: "Party", page_number: 2, value: "Bob" }],
    };
    expect(resolveSelectedIndex(metadata, { code: "idx-1", segment: "party" })).toEqual({
      ambiguous: "",
      label: "Grantor",
      pageNumber: 1,
      source: "quote",
      value: "Alice",
    });
    expect(resolveSelectedIndex({ indexes: [{ code: "bad", label: "Bad" }] }, { code: "bad", segment: null })).toBeNull();
  });

  it("parses top-level tiff and data urls from get_data", () => {
    expect(parsePackageUrls(directPackage)).toEqual({
      jsonUrl: directPackage.data,
      tiffUrl: directPackage.tiff,
    });
  });

  it("rejects image package data without top-level tiff and data urls", () => {
    expect(() => parsePackageUrls({ data: "", tiff: "" })).toThrow(expect.objectContaining({ code: "invalid_image_package" }));
  });

  it("parses real package metadata and rejects metadata without pages", () => {
    expect(parsePackageMetadata(packageMetadata).pages.length).toBeGreaterThan(0);
    expect(() => parsePackageMetadata({ page: [] })).toThrow(expect.objectContaining({ code: "invalid_image_metadata" }));
  });
});
