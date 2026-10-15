import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LensError } from "@tabulariumai/aurora-lens";
import { toViewerError, parsePackageMetadata, parsePackageUrls, resolveSelectedIndex, toPageRequest } from "../data/imageViewerData";
import type { PageRequest } from "../type/imageViewer.types";
import type { MetadataPayload } from "aurora-core";

const packageRoot = path.join(process.cwd(), "src", "test", "package");
const directPackage = JSON.parse(readFileSync(path.join(packageRoot, "image-package.json"), "utf8")) as { data: string; tiff: string };
const packageMetadata = JSON.parse(readFileSync(path.join(packageRoot, "image.json"), "utf8")) as { pages: unknown[] };

describe("imageViewerData", () => {
  it("accepts repeated OCR numbers and preserves the name map", () => {
    const data = { pageMap: { "26": 0, "Exhibit-A": 1 }, pages: [{ pageNumber: 1 }, { pageNumber: 1 }] };
    expect(parsePackageMetadata(data)).toEqual(data);
  });
  it("preserves page names when creating preview requests", () => {
    expect(toPageRequest({} as PageRequest, new Map([["Exhibit-A", "code-a"]]), "Exhibit-A")).toMatchObject({ page: "Exhibit-A", code: "code-a" });
  });

  it("preserves original page numbers and package order", () => {
    const pages = [{ pageNumber: 1 }, { pageNumber: 20 }, { pageNumber: 26 }];
    expect(parsePackageMetadata({ pages }).pages).toEqual(pages);
  });

  it("preserves pages and resolves page codes", () => {
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


it("preserves structured page-size failures through the existing viewer error conversion", () => {
  const details = { sourceName: "document-image-package.tiff", pageNumber: 1, width: 2550, height: 3479, tolerance: 0.02, requiredTolerance: 0.0348 };
  const failure = toViewerError(new LensError("page_size", "Page size rejected", details), "Image package failed to load.");
  expect(failure).toMatchObject({ code: "page_size", error: "Page size rejected" });
  expect(failure.details).toBe(details);
});
