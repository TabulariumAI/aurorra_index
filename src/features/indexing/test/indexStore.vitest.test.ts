import { afterEach, describe, expect, it } from "vitest";
import { indexStoreApi } from "../../metdataview/store/metadataStore";
import { composeMetadataJSON, splitMetadataJSON, type MetadataPayload } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { normalizeLegalData } from "../../legalmap/data/legalData";

describe("index store", () => {
  afterEach(() => {
    indexStoreApi.getState().resetMetadata();
    storeApi.getState().resetAllState();
  });

  it("preserves parcel counts through metadata storage and recomposition into the legal map", () => {
    const payload = { legals: { parcels_num: 1, summary: "One parcel.", groups: ["1", "4482C"].map(block => ({
      type: "lot_block", elements: [
        { aspect: "subdivision", value: "THE RANCH AT IRON HORSE" },
        { aspect: "phase", value: "II" }, { aspect: "block", value: block }, { aspect: "lot", value: "32" },
      ],
    })) } };
    storeApi.getState().setJSON("session-1", splitMetadataJSON(payload));
    const parts = storeApi.getState().getJSON("session-1");
    expect(parts?.legalJSON.legals).toEqual(payload.legals);
    expect(composeMetadataJSON(parts)).toEqual(payload);
    expect(normalizeLegalData(parts?.legalJSON.legals).subdivisions[0].divisions[0].blocks).toEqual([
      { name: "1/4482C", lots: [{ name: "32" }] },
    ]);
    expect(payload.legals.groups).toHaveLength(2);
    expect(payload.legals.groups.map(group => group.elements[2].value)).toEqual(["1", "4482C"]);
  });

  it("stores split metadata JSON in the package store and reports metadata status updates", () => {
    indexStoreApi.getState().setLoading("session-1");
    expect(indexStoreApi.getState().status).toBe("loading");

    const payload = {
      fees: [],
      funds: [],
      heading: { title: "NOTICE" },
      indexes: [],
      pages: { num_of_pages: 2 },
      secrets: [],
      legals: { summary: "fixture legal summary" },
    } as unknown as MetadataPayload;

    storeApi.getState().setJSON("session-1", splitMetadataJSON(payload));
    indexStoreApi.getState().setLoaded("session-1");

    expect(indexStoreApi.getState().status).toBe("success");
    expect(storeApi.getState().jsonBySession["session-1"]).toEqual({
      chainJSON: {},
      financialJSON: {
        fees: [],
        funds: [],
      },
      headingJSON: {
        heading: { title: "NOTICE" },
      },
      indexJSON: {
        indexes: [],
      },
      legalJSON: {
        legals: { summary: "fixture legal summary" },
      },
      pagesJSON: {
        pages: { num_of_pages: 2 },
      },
      secretsJSON: {
        secrets: [],
      },
    });
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))).toEqual(payload);
  });

  it("invalidates cached session data", () => {
    storeApi.getState().setJSON("session-1", splitMetadataJSON({
      fees: [],
      funds: [],
      heading: {},
      indexes: [],
      pages: { num_of_pages: 1 },
      secrets: [],
    } as unknown as MetadataPayload));
    indexStoreApi.getState().setLoaded("session-1");
    indexStoreApi.getState().invalidateSession("session-1");

    expect(storeApi.getState().jsonBySession["session-1"]).toBeUndefined();
    expect(indexStoreApi.getState().status).toBe("idle");
  });

  it("resets the active view without discarding session metadata", () => {
    const payload = splitMetadataJSON({
      fees: [],
      funds: [],
      heading: {},
      indexes: [],
      pages: { num_of_pages: 1 },
      secrets: [],
    } as unknown as MetadataPayload);
    storeApi.getState().setJSON("session-1", payload);
    indexStoreApi.getState().setLoaded("session-1");

    indexStoreApi.getState().resetView();

    expect(storeApi.getState().getJSON("session-1")).toEqual(payload);
    expect(indexStoreApi.getState().activeSession).toBeNull();
    expect(indexStoreApi.getState().status).toBe("idle");
  });

  it("clears all split metadata sessions on reset", () => {
    storeApi.getState().setJSON("session-1", splitMetadataJSON({ indexes: [] } as unknown as MetadataPayload));
    storeApi.getState().setJSON("session-2", splitMetadataJSON({ indexes: [] } as unknown as MetadataPayload));
    indexStoreApi.getState().setLoaded("session-2");

    indexStoreApi.getState().resetMetadata();

    expect(storeApi.getState().jsonBySession).toEqual({});
    expect(indexStoreApi.getState().activeSession).toBeNull();
    expect(indexStoreApi.getState().status).toBe("idle");
  });
});
