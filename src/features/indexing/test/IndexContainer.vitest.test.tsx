import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IndexContainer } from "../component/IndexContainer";
import { indexStoreApi } from "../../metdata/store/indexStore";
import { createDeferredState } from "../data/deferredState";
import type { IndexSegmentValues, MetadataPayload } from "../../metdata/type/metadata.types";

const segments: IndexSegmentValues = {
  ACKNOWLEDGMENT: "acknowledgment",
  CHAIN: "chain",
  COURT: "court",
  ENDORSEMENT: "endorsement",
  FEE: "fee",
  FEEFACTOR: "factor",
  FUND: "fund",
  HISTORY: "history",
  LEGAL: "legal",
  MONETARY: "monetary",
  PAGE: "page",
  PARTY: "party",
  PROPERTY: "property",
  REFERENCE: "reference",
  SECRETS: "secrets",
  TITLE: "title",
  TRANSACTION: "transaction",
  VITAL: "vital",
};

const choices = [
  { level: 1, service: "PartyClauseIndexing" },
  { level: 1, service: "RecitalIndexing" },
  { level: 1, service: "ExhibitIndexing" },
  { level: 1, service: "LegalEnrichment" },
  { level: 1, service: "MonetaryInfoIndexing" },
  { level: 1, service: "AcknowledgmentIndexing" },
  { level: 1, service: "EndorsementIndexing" },
  { level: 1, service: "TransactionIndexing" },
  { level: 1, service: "VitalIndexing" },
  { level: 1, service: "ConfidentialIndexing" },
];

const metadata: MetadataPayload = {
  fees: [],
  funds: [],
  heading: { class: "deed", title: "Warranty Deed" },
  indexes: [
    { ambiguous: "YES", aspect: "grantor", code: "idx-1", label: "grantor", page: "1", page_number: "1", segment: "party", source: "source", value: "Alice" },
    { aspect: "property_address", code: "idx-2", label: "address", page: "2", page_number: "2", segment: "property", value: "101 Main Street" },
  ],
  legals: {
    groups: [
      {
        code: "legal-1",
        elements: [{ aspect: "subdivision", value: "Riverside" }],
        page: "3",
        type: "lot_block",
      },
    ],
    summary: "Property is described.",
  },
  pages: {
    nonrecordables: [],
    num_of_pages: 2,
    recordables: [{ class: "deed", code: "page-1", name: "1", segments: ["party_clause"] }],
  },
  secrets: [],
};

describe("IndexContainer", () => {
  afterEach(() => {
    indexStoreApi.getState().resetMetadata();
  });

  it("fetches metadata, renders visible sections, and emits callbacks", async () => {
    const onMetadataLoaded = vi.fn();
    const onPageClick = vi.fn();
    const onConfirmIndex = vi.fn(async () => true);
    const onDropIndex = vi.fn(async () => true);
    const onView = vi.fn();
    const onViewStarted = vi.fn();
    let resolveMetadata!: (value: MetadataPayload) => void;
    const workerClient = {
      indexData: vi.fn(() => new Promise<MetadataPayload>((resolve) => {
        resolveMetadata = resolve;
      })),
    };

    const view = render(
      <IndexContainer
        authToken="token"
        apiGatewayUrl="https://doc.example.com"
        callbacks={{ onConfirmIndex, onDropIndex, onMetadataLoaded, onPageClick, onView, onViewStarted }}
        choices={choices}
        deferredState={createDeferredState({ selectedIndex: { code: "idx-1", segment: "party" }, segment: "party" })}
        segments={segments}
        session="session-1"
        workerClient={workerClient}
      />,
    );

    const shell = view.container.firstElementChild;
    expect(shell).not.toBeNull();
    if (shell) {
      expect(shell).toHaveStyle({ overflow: "visible" });
      expect(shell).toHaveStyle({ height: "auto" });
      expect(shell).toHaveStyle({ minHeight: "0px" });
      expect(shell).toHaveStyle({ width: "100%" });
      expect(shell).toHaveStyle({ minWidth: "0px" });
      expect(shell).toHaveStyle({ boxShadow: "none" });
      expect(shell).toHaveStyle({ paddingTop: "0px" });
      expect(shell).not.toHaveStyle({ overflow: "auto" });
    }

    expect(screen.getByRole("progressbar", { name: "Metadata progress" })).toBeInTheDocument();
    resolveMetadata(metadata);
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByRole("progressbar", { name: "Metadata progress" })).not.toBeInTheDocument());
    expect(onViewStarted).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledWith(metadata);
    expect(onMetadataLoaded).toHaveBeenCalledWith(metadata);
    expect(screen.getByText("Deed")).toBeInTheDocument();
    const header = screen.getByRole("heading", { level: 2, name: "Deed" }).closest("header");
    expect(header).toBeTruthy();
    if (header) {
      expect(header).toHaveStyle({ position: "sticky", top: "0px", zIndex: "2" });
    }

    fireEvent.click(screen.getByLabelText("Confirm index and remove ambiguity"));
    await waitFor(() => expect(onConfirmIndex).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText("Open page image 1"));
    expect(onPageClick).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Pop the index"));
    await waitFor(() => expect(onDropIndex).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("Alice")).not.toBeInTheDocument());
  });

  it("renders worker errors through callbacks only", async () => {
    const onMetadataError = vi.fn();
    const onViewError = vi.fn();

    render(
      <IndexContainer
        authToken="token"
        apiGatewayUrl="https://doc.example.com"
        callbacks={{ onMetadataError, onViewError }}
        choices={choices}
        deferredState={createDeferredState()}
        segments={segments}
        session="session-1"
        workerClient={{ indexData: vi.fn(async () => { throw new Error("broken"); }) }}
      />,
    );

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(onViewError).toHaveBeenCalledWith({
      code: undefined,
      details: undefined,
      error: "broken",
      status: undefined,
    });
    expect(onMetadataError).toHaveBeenCalledWith({
      code: undefined,
      details: undefined,
      error: "broken",
      status: undefined,
    });
  });

  it("emits view canceled on unmount", () => {
    const onViewCanceled = vi.fn();
    const workerClient = { indexData: vi.fn(async () => metadata) };
    const view = render(
      <IndexContainer
        authToken="token"
        apiGatewayUrl="https://doc.example.com"
        callbacks={{ onViewCanceled }}
        choices={choices}
        deferredState={createDeferredState()}
        segments={segments}
        session="session-1"
        workerClient={workerClient}
      />,
    );

    view.unmount();

    expect(onViewCanceled).toHaveBeenCalledTimes(1);
  });
});
