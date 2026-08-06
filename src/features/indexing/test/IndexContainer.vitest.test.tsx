import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IndexContainer } from "../component/IndexContainer";
import { indexStoreApi } from "../../metdataview/store/metadataStore";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";
import { createDeferredState } from "../data/deferredState";
import type { MetdataSegmentValues, MetadataPayload } from "../../metdataview/type/metadataView.types";

const segments: MetdataSegmentValues = {
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
    recordables: [{ class: "deed", code: "page-1", name: "1", segments: ["party"] }],
  },
  secrets: [],
};

describe("IndexContainer", () => {
afterEach(() => {
  act(() => {
    indexStoreApi.getState().resetMetadata();
    imageViewerStoreApi.getState().resetViewer();
  });
});

  it("fetches metadata, renders visible sections, and emits callbacks", async () => {
    const onMetadataLoaded = vi.fn();
    const onPageClick = vi.fn();
    const onActionComplete = vi.fn();
    const onEditPage = vi.fn();
    const onView = vi.fn();
    const onViewStarted = vi.fn();
    const onJobEvent = vi.fn();
    const onLoaderChange = vi.fn();
    const onReadyChange = vi.fn();
    const workerClient = {
      confirmIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      dropIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      indexData: vi.fn(async () => metadata),
      patchStatus: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      reprocessSegment: vi.fn(async () => ({ data: "", status: "completed" as const })),
    };

    const view = render(
      <IndexContainer
        authToken="token"
        apiGatewayUrl="https://doc.example.com"
        callbacks={{ onActionComplete, onEditPage, onJobEvent, onMetadataLoaded, onPageClick, onView, onViewStarted }}
        choices={choices}
        deferredState={createDeferredState({ selectedIndex: { code: "idx-1", segment: "party" }, segment: "party" })}
        intervalMs={0}
        onLoaderChange={onLoaderChange}
        onReadyChange={onReadyChange}
        refresh={null}
        segments={segments}
        session="session-1"
        workerClient={workerClient}
      />,
    );

    const shell = view.container.firstElementChild;
    expect(shell).not.toBeNull();
    if (shell) {
      expect(shell).toHaveStyle({ display: "flex", flex: "1 1 auto", flexDirection: "column", minHeight: "0px", overflow: "hidden" });
      expect(shell).toHaveStyle({ width: "100%" });
      expect(shell).toHaveStyle({ minWidth: "0px" });
      expect((shell as HTMLElement).style.boxShadow).toBe("");
      expect((shell as HTMLElement).style.padding).toBe("");
      expect(shell).not.toHaveStyle({ overflowY: "auto" });
    }

    expect(screen.queryByRole("progressbar", { name: "Metadata progress" })).not.toBeInTheDocument();
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Retrieving metadata..."]);
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    expect(onReadyChange).toHaveBeenCalledWith(false);
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
    expect(onViewStarted).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledWith(metadata);
    expect(onMetadataLoaded).toHaveBeenCalledWith(metadata);
    expect(screen.getByText("Deed")).toBeInTheDocument();
    const header = screen.getByRole("heading", { level: 2, name: "Deed" }).closest("header");
    expect(header).toBeTruthy();
    if (header) {
      expect(header).toHaveStyle({ borderBottom: "2px solid #06afc1", flex: "0 0 auto", position: "static" });
      expect(header.nextElementSibling).toHaveStyle({ alignItems: "stretch", display: "flex", flex: "1 1 0", flexDirection: "column", minHeight: "0", overflowX: "hidden", overflowY: "auto" });
      expect(header.nextElementSibling?.nextElementSibling).toHaveAttribute("data-metadata-footer", "true");
    }

    fireEvent.click(screen.getByLabelText("Confirm index and remove ambiguity"));
    await waitFor(() => expect(workerClient.confirmIndex).toHaveBeenCalledWith("token", "session-1", "idx-1"));
    expect(onActionComplete).toHaveBeenCalledWith({ action: "confirm", code: "idx-1", session: "session-1" });

    fireEvent.click(screen.getByRole("link", { name: "Alice" }));
    expect(onPageClick).toHaveBeenCalled();
    expect(imageViewerStoreApi.getState().request).toMatchObject({
      code: "idx-1",
      index: "index",
      metadataIndex: {
        label: "grantor",
        source: "source",
        value: "Alice",
      },
      page: 1,
      quote: "source",
      segment: "party",
      session: "session-1",
      value: "Alice",
    });
    expect(screen.queryByLabelText("Open page image 1")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit index" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Pages/i }));
    const editButton = await screen.findByRole("button", { name: "Edit index" });
    const footer = view.container.querySelector<HTMLElement>("[data-metadata-footer]");
    expect(footer).toBeTruthy();
    if (!footer) throw new Error("Metadata footer is missing.");
    expect(screen.queryByRole("button", { name: "Pop the index" })).not.toBeInTheDocument();
    fireEvent.click(editButton);
    expect(onEditPage).toHaveBeenCalledTimes(1);
    expect(onEditPage).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "page-1",
        segment: "page",
        session: "session-1",
        type: "page",
      }),
    );

    expect(workerClient.confirmIndex).toHaveBeenCalledTimes(1);
    expect(workerClient.dropIndex).toHaveBeenCalledTimes(0);
    expect(workerClient.reprocessSegment).toHaveBeenCalledTimes(0);

    fireEvent.click(screen.getByRole("button", { name: /Parties\(Party Clause\)/i }));
    const reprocess = await screen.findByRole("link", { name: "Reprocess" });
    expect(footer).toHaveStyle({ flex: "0 0 0", height: "0px", overflow: "hidden" });
    expect(footer).toBeEmptyDOMElement();
    expect(header?.nextElementSibling).toContainElement(reprocess);
    fireEvent.click(reprocess);
    await waitFor(() => expect(workerClient.reprocessSegment).toHaveBeenCalledWith("token", "session-1", "party"));
    expect(onJobEvent).toHaveBeenCalledWith({
      jobId: expect.any(String),
      message: "Reprocessing segment",
      phase: "started",
      session: "session-1",
    });
    expect(onActionComplete).toHaveBeenCalledWith({ action: "reprocess", segment: "party", session: "session-1" });

    const dropButton = screen.getByLabelText("Pop the index");
    expect(dropButton).toHaveAttribute("title", "Pop the index");
    fireEvent.click(dropButton);
    expect(dropButton).toHaveAttribute("data-armed", "true");
    expect(dropButton).toHaveAttribute("aria-label", "Confirm");
    expect(dropButton).toHaveAttribute("title", "Confirm");
    expect(workerClient.dropIndex).not.toHaveBeenCalled();

    fireEvent.click(dropButton);
    await waitFor(() => expect(workerClient.dropIndex).toHaveBeenCalledWith("token", "session-1", "idx-1"));
    expect(onActionComplete).toHaveBeenCalledWith({ action: "drop", code: "idx-1", session: "session-1" });
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
        intervalMs={0}
        onReadyChange={vi.fn()}
        refresh={null}
        segments={segments}
        session="session-1"
        workerClient={{
          confirmIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
          dropIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
          indexData: vi.fn(async () => { throw new Error("broken"); }),
          patchStatus: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
          reprocessSegment: vi.fn(async () => ({ data: "", status: "completed" as const })),
        }}
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
    const workerClient = {
      confirmIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      dropIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      indexData: vi.fn(async () => metadata),
      patchStatus: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      reprocessSegment: vi.fn(async () => ({ data: "", status: "completed" as const })),
    };
    const view = render(
      <IndexContainer
        authToken="token"
        apiGatewayUrl="https://doc.example.com"
        callbacks={{ onViewCanceled }}
        choices={choices}
        deferredState={createDeferredState()}
        intervalMs={0}
        onReadyChange={vi.fn()}
        refresh={null}
        segments={segments}
        session="session-1"
        workerClient={workerClient}
      />,
    );

    view.unmount();

    expect(onViewCanceled).toHaveBeenCalledTimes(1);
  });
});
