import { afterEach, describe, expect, it } from "vitest";
import { indexStoreApi } from "../../metdata/store/indexStore";
import { composeMetadataJSON, splitMetadataJSON } from "../../metdata/data/metadataData";
import type { MetadataPayload } from "../../metdata/type/metadata.types";
import { storeApi } from "../../../store/state/store";

describe("index store", () => {
  afterEach(() => {
    indexStoreApi.getState().resetMetadata();
    storeApi.getState().resetAllState();
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
