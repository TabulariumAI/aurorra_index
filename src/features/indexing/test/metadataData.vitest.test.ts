import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  composeMetadataJSON,
  getParcelOptions,
  getPanelData,
  getSegmentItems,
  isAmbiguous,
  replaceMetadataPageSegments,
  splitMetadataJSON,
} from "../../metdataview/data/metadataData";
import type { MetadataJSONParts, MetadataPayload } from "../../metdataview/type/metadataView.types";

const metadataFixturePath = join(process.cwd(), "src", "test", "metadata#v1.json");

describe("metadata data normalization", () => {
  it("splits metadata payload into the required JSON parts", () => {
    const payload = {
      chain: [{ source: "chain source" }],
      fee_factors: [{ factor: "0.15" }],
      fees: [{ code: "fee-a" }],
      funds: [{ amount: "1200" }],
      heading: { title: "NOTICE" },
      history: { events: ["created"] },
      indexes: [
        {
          code: "p1",
          page: "1",
          page_number: "1",
          label: "buyer",
          segment: "party",
          value: "Alice",
        },
      ],
      legals: { summary: "summary" },
      pages: { num_of_pages: 2 },
      parties: [
        {
          code: "pt1",
          page: "1",
          page_number: "1",
          label: "seller",
          segment: "party",
          value: "Bob",
        },
      ],
      secrets: [{ code: "s1", page: "1", page_number: "1", label: "secret", segment: "secrets", value: "classified" }],
      tags: ["a", "b"],
      usage: { costs: ["0.10"] },
    } as unknown as MetadataPayload;

    const parts = splitMetadataJSON(payload);

    expect(parts.chainJSON).toEqual({
      chain: [{ source: "chain source" }],
      history: { events: ["created"] },
    });
    expect(parts.financialJSON).toEqual({
      fee_factors: [{ factor: "0.15" }],
      fees: [{ code: "fee-a" }],
      funds: [{ amount: "1200" }],
    });
    expect(parts.headingJSON).toEqual({
      heading: { title: "NOTICE" },
      tags: ["a", "b"],
      usage: { costs: ["0.10"] },
    });
    expect(parts.indexJSON).toEqual({
      indexes: payload.indexes,
      parties: payload.parties,
    });
    expect(parts.legalJSON).toEqual({ legals: { summary: "summary" } });
    expect(parts.pagesJSON).toEqual({ pages: { num_of_pages: 2 } });
    expect(parts.secretsJSON).toEqual({
      secrets: [{ code: "s1", page: "1", page_number: "1", label: "secret", segment: "secrets", value: "classified" }],
    });
  });

  it("rebuilds payload shape from split JSON parts", () => {
    const parts = splitMetadataJSON({
      chain: [{ source: "chain source" }],
      fee_factors: [{ factor: "0.15" }],
      fees: [{ code: "fee-a" }],
      funds: [{ amount: "1200" }],
      heading: { title: "NOTICE" },
      history: { events: ["created"] },
      indexes: [],
      legals: { summary: "summary" },
      pages: { num_of_pages: 2 },
      parties: [],
      secrets: [],
      tags: ["a"],
      usage: { costs: ["0.10"] },
    } as unknown as MetadataPayload);
    const recomposed = composeMetadataJSON(parts);

    expect(recomposed).toMatchObject({
      chain: [{ source: "chain source" }],
      fee_factors: [{ factor: "0.15" }],
      fees: [{ code: "fee-a" }],
      funds: [{ amount: "1200" }],
      heading: { title: "NOTICE" },
      history: { events: ["created"] },
      indexes: [],
      legals: { summary: "summary" },
      pages: { num_of_pages: 2 },
      parties: [],
      secrets: [],
      tags: ["a"],
      usage: { costs: ["0.10"] },
    });
  });

  it("keeps missing optional fields absent in recomposition", () => {
    const emptyParts = {
      chainJSON: {},
      financialJSON: {},
      headingJSON: {},
      indexJSON: {},
      legalJSON: {},
      pagesJSON: {},
      secretsJSON: {},
    } as MetadataJSONParts;

    const recomposed = composeMetadataJSON(emptyParts) as MetadataPayload & { tags?: unknown; usage?: unknown };
    expect(recomposed.chain).toBeUndefined();
    expect(recomposed.fees).toBeUndefined();
    expect(recomposed.heading).toBeUndefined();
    expect(recomposed.legals).toBeUndefined();
    expect(recomposed.pages).toBeUndefined();
    expect(recomposed.fee_factors).toBeUndefined();
    expect(recomposed.funds).toBeUndefined();
    expect(("tags" in recomposed) as boolean).toBe(false);
  });

  it("round-trips fixture metadata without changing stored semantics", async () => {
    const fixtureContent = await readFile(metadataFixturePath, "utf8");
    const fixture = JSON.parse(fixtureContent) as MetadataPayload &
      Record<string, unknown> & { tags?: unknown; usage?: unknown };
    const { gaps, ...fixturePayload } = fixture;

    const parts = splitMetadataJSON(fixture);
    const recomposed = composeMetadataJSON(parts);

    expect(recomposed).not.toBeNull();
    expect(recomposed).toMatchObject(fixturePayload);
  });

  it("filters valid indexes by segment and builds view data", () => {
    const indexes = [
      { label: "grantor", page_number: "1", segment: "party", value: "Alice" },
      { label: "grantee", page_number: "2", segment: "party", value: "" },
      { label: "amount", page_number: "4", segment: "monetary", value: "100" },
      { label: "loan_amount", page_number: "5", segment: "loan", value: "200" },
    ];
    const payload = { indexes } as MetadataPayload;

    expect(getSegmentItems(indexes, ["party"])).toEqual([
      { label: "grantor", page_number: "1", segment: "party", value: "Alice" },
    ]);
    expect(getPanelData(payload).monetarys).toEqual([
      { label: "loan_amount", page_number: "5", segment: "loan", value: "200" },
      { label: "amount", page_number: "4", segment: "monetary", value: "100" },
    ]);
    expect(isAmbiguous("Yes")).toBe(true);
    expect(isAmbiguous("0")).toBe(false);
  });

  it("extracts parcel options", () => {
    expect(
      getParcelOptions([
        { aspect: "parcel_id", value: "PID-1" },
        { aspect: "parcel_address", value: "ADDR-1" },
        { aspect: "parcel_reference", value: "REF-1" },
      ]),
    ).toEqual({
      parcel_address: "ADDR-1",
      parcel_id: "PID-1",
      parcel_reference: "REF-1",
    });
  });

  it("replaces page segments for recordable and nonrecordable pages without changing unrelated metadata", () => {
    const parts = splitMetadataJSON({
      heading: { title: "Instrument" },
      indexes: [{ code: "idx-1", value: "Alice" }],
      pages: {
        nonrecordables: [{ code: "page-b", name: "2", segments: ["property"] }],
        num_of_pages: 2,
        recordables: [{ code: "page-a", name: "1", segments: ["reference"] }],
      },
      secrets: [],
    } as MetadataPayload);

    const recordable = replaceMetadataPageSegments(parts, "page-a", ["party"]);
    expect(recordable.pagesJSON.pages?.recordables?.[0].segments).toEqual(["party"]);
    expect(recordable.pagesJSON.pages?.nonrecordables).toBe(parts.pagesJSON.pages?.nonrecordables);
    expect(recordable.indexJSON).toBe(parts.indexJSON);

    const nonrecordable = replaceMetadataPageSegments(parts, "page-b", ["secrets"]);
    expect(nonrecordable.pagesJSON.pages?.recordables).toBe(parts.pagesJSON.pages?.recordables);
    expect(nonrecordable.pagesJSON.pages?.nonrecordables?.[0].segments).toEqual(["secrets"]);
  });

  it("does not add an absent page collection while replacing segments", () => {
    const parts = splitMetadataJSON({
      pages: {
        num_of_pages: 1,
        recordables: [{ code: "page-a", name: "1", segments: ["reference"] }],
      },
    } as MetadataPayload);

    const updated = replaceMetadataPageSegments(parts, "page-a", ["property"]);

    expect(updated.pagesJSON.pages?.recordables?.[0].segments).toEqual(["property"]);
    expect(updated.pagesJSON.pages).not.toHaveProperty("nonrecordables");
  });
});
