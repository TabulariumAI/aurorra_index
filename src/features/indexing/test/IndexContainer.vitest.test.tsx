import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IndexContainer } from "../component/IndexContainer";
import { addIndexStoreApi } from "../../addindex";
import { editIndexStoreApi } from "../../editindex";
import { indexStoreApi } from "../../metdataview/store/metadataStore";
import { queueStoreApi } from "../../queue/store/queueStore";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";
import { createDeferredState } from "../data/deferredState";
import type { MetadataSegments, MetadataPayload } from "aurora-core";

vi.hoisted(() => { Object.defineProperty(window, "AnimationEvent", { value: Event, configurable: true }); });

const segments: MetadataSegments = {
  ACKNOWLEDGMENT: "acknowledgment",
  COURT: "court",
  ENDORSEMENT: "endorsement",
  FEE: "fee",
  FEEFACTOR: "factor",
  FUND: "fund",
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
  { level: 0, service: "MonetaryInfoIndexing" },
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
    addIndexStoreApi.getState().close();
    editIndexStoreApi.getState().close();
    queueStoreApi.getState().reset();
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
    const onLoaderChange = vi.fn();
    const onReadyChange = vi.fn();
    let remote = structuredClone(metadata);
    let completeDrop: (() => void) | undefined;
    let completeReprocess: (() => void) | undefined;
    const workerClient = {
      updatePageSegments: vi.fn(),
      patchIndex: vi.fn(),
      confirmIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      dropIndex: vi.fn(() => new Promise<{ data: string; status: "completed"; version: number }>((resolve) => {
        completeDrop = () => { remote = { ...remote, indexes: remote.indexes?.filter((item) => item.code !== "idx-1") }; resolve({ data: "", status: "completed", version: 1 }); }
      })),
      indexData: vi.fn(async () => remote),
      patchStatus: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      reprocessSegment: vi.fn(() => new Promise<{ data: string; status: "completed" }>((resolve) => {
        completeReprocess = () => resolve({ data: "", status: "completed" });
      })),
    };

    const view = render(
      <IndexContainer onQueueChange={vi.fn()}
        authToken="token"
        apiGatewayUrl="https://doc.example.com"
        batchCode={null}
        callbacks={{ onActionComplete, onEditPage, onMetadataLoaded, onPageClick, onView, onViewStarted }}
        choices={choices}
        deferredState={createDeferredState({ selectedIndex: { code: "idx-1", segment: "party" }, segment: "party" })}
        intervalMs={0}
        retryLimit={5}
        retryIntervalMs={0}
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
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Retrieving metadata...", "Attempt 1 of 5"]);
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    expect(onReadyChange).toHaveBeenCalledWith(false);
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
    expect(onViewStarted).toHaveBeenCalledTimes(1);
    expect(onView).toHaveBeenCalledWith(metadata);
    expect(onMetadataLoaded).toHaveBeenCalledWith(metadata);
    expect(screen.getByText("Deed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Record Endorsements/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Parties\(Party Clause\)/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /References\(Recital\)/i })).toBeVisible();
    expect(screen.getByRole("button", { name: "Property(Exhibit)" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Notarial Acknowledgment/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Transactional/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Monetary/i })).not.toBeInTheDocument();
    const header = screen.getByRole("heading", { level: 2, name: "Deed" }).closest("header");
    expect(header).toBeTruthy();
    expect(screen.getByText("Indexes").parentElement).toHaveTextContent("2");
    expect(screen.getByText("Unclear").parentElement).toHaveTextContent("1");
    if (header) {
      expect(header).toHaveStyle({ flex: "0 0 auto", position: "static" });
      expect(header.nextElementSibling).toHaveStyle({ alignItems: "stretch", display: "flex", flex: "1 1 0", flexDirection: "column", minHeight: "0", overflowX: "hidden", overflowY: "auto" });
      expect(header.nextElementSibling?.nextElementSibling).toHaveAttribute("data-metadata-footer", "true");
    }

    fireEvent.click(screen.getByLabelText("Confirm index and remove ambiguity"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(workerClient.confirmIndex).toHaveBeenCalledWith("token", "session-1", "idx-1"));
    expect(onActionComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("link", { name: "Alice" }));
    expect(onPageClick).toHaveBeenCalledWith(expect.objectContaining({
      highlightOptions: imageViewerStoreApi.getState().request!.highlightOptions,
    }));
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
    fireEvent.click(screen.getByRole("button", { name: "Edit index" }));
    expect(editIndexStoreApi.getState().request).toEqual({ index: expect.objectContaining(metadata.indexes![0]), segment: "party", session: "session-1" });
    expect(onEditPage).not.toHaveBeenCalled();
    editIndexStoreApi.getState().close();

    fireEvent.click(screen.getByRole("button", { name: /Pages/i }));
    const editButton = await screen.findByRole("button", { name: "Edit index" });
    const footer = view.container.querySelector<HTMLElement>("[data-metadata-footer]");
    expect(footer).toBeTruthy();
    if (!footer) throw new Error("Metadata footer is missing.");
    expect(screen.queryByRole("button", { name: "Delete index" })).not.toBeInTheDocument();
    fireEvent.click(editButton);
    expect(onEditPage).toHaveBeenCalledTimes(1);
    expect(onEditPage).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "page-1",
        segment: "page",
        session: "session-1",
        type: "page",
      }),
      expect.any(HTMLButtonElement),
    );

    expect(workerClient.confirmIndex).toHaveBeenCalledTimes(1);
    expect(workerClient.dropIndex).toHaveBeenCalledTimes(0);
    expect(workerClient.reprocessSegment).toHaveBeenCalledTimes(0);

    const partyTrigger = screen.getByRole("button", { name: /Parties\(Party Clause\)/i });
    fireEvent.click(partyTrigger);
    const partyHeader = partyTrigger.parentElement;
    if (!partyHeader) throw new Error("Party header is missing.");
    const partyActions = within(partyHeader);
    const reprocess = await partyActions.findByRole("button", { name: "Reprocess" });
    const addIndex = partyActions.getByRole("button", { name: "Add Index" });
    expect(addIndex.nextElementSibling).toBe(reprocess);
    expect(partyTrigger).not.toContainElement(addIndex);
    fireEvent.click(addIndex);
    expect(addIndexStoreApi.getState().request).toEqual({ segment: "party" });
    expect(partyTrigger).toHaveAttribute("aria-expanded", "true");
    expect(workerClient.reprocessSegment).not.toHaveBeenCalled();
    addIndexStoreApi.getState().close();
    expect(footer).toHaveStyle({ flex: "0 0 0", height: "0px", overflow: "hidden" });
    expect(footer).toBeEmptyDOMElement();
    expect(reprocess.parentElement?.parentElement).toBe(partyTrigger.parentElement);
    expect(partyTrigger).not.toContainElement(reprocess);
    fireEvent.click(reprocess);
    await waitFor(() => expect(workerClient.reprocessSegment).toHaveBeenCalledWith("token", "session-1", "party"));
    expect(partyActions.getByRole("status", { name: "Reprocessing party" })).toBeVisible();
    expect(partyActions.queryByRole("button", { name: "Reprocess" })).not.toBeInTheDocument();
    expect(partyActions.getByRole("button", { name: "Open AI chat" })).toBeVisible();
    act(() => completeReprocess?.());
    await waitFor(() => expect(partyActions.getByRole("button", { name: "Reprocess" })).toBeVisible());
    expect(onActionComplete).toHaveBeenCalledWith({ action: "reprocess", segment: "party", session: "session-1" });

    fireEvent.click(screen.getByRole("button", { name: "Legal Descriptions" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit index" }));
    expect(editIndexStoreApi.getState().request).toEqual({ session: "session-1", segment: "legal", index: { aspect: "subdivision", value: "Riverside", label: "legal", page: "3" } });
    editIndexStoreApi.getState().close();
    fireEvent.click(partyTrigger);

    const dropButton = screen.getByLabelText("Delete index");
    fireEvent.click(dropButton);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(workerClient.dropIndex).toHaveBeenCalledWith("token", "session-1", "idx-1"));
    expect(screen.getByText("Alice")).toBeVisible();
    expect(screen.queryByText("Not completed", { exact: true })).toBeNull();
    expect(screen.getByLabelText("Delete index")).toBeDisabled();
    await act(async () => {
      completeDrop?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(queueStoreApi.getState().tasks).toEqual([]));
    await waitFor(() => expect(screen.getByText("Alice").closest("article")).toHaveAttribute("data-removing", "true"));
    fireEvent.animationEnd(screen.getByText("Alice").closest("article")!);
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.getByText("Indexes").parentElement).toHaveTextContent("1");
    expect(screen.getByText("Unclear").parentElement).toHaveTextContent("0");
  }, 10_000);

  it("renders worker errors through callbacks only", async () => {
    const onMetadataError = vi.fn();
    const onViewError = vi.fn();

    render(
      <IndexContainer onQueueChange={vi.fn()}
        authToken="token"
        apiGatewayUrl="https://doc.example.com"
        batchCode={null}
        callbacks={{ onMetadataError, onViewError }}
        choices={choices}
        deferredState={createDeferredState()}
        intervalMs={0}
        retryLimit={5}
        retryIntervalMs={0}
        onReadyChange={vi.fn()}
        refresh={null}
        segments={segments}
        session="session-1"
        workerClient={{
          updatePageSegments: vi.fn(),
      patchIndex: vi.fn(),
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

  it("retains visible metadata while a refresh is loading", async () => {
    let resolveRefresh: ((value: MetadataPayload) => void) | undefined;
    const workerClient = {
      updatePageSegments: vi.fn(),
      patchIndex: vi.fn(),
      confirmIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      dropIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      indexData: vi.fn()
        .mockResolvedValueOnce(metadata)
        .mockImplementationOnce(() => new Promise<MetadataPayload>((resolve) => {
          resolveRefresh = resolve;
        })),
      patchStatus: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      reprocessSegment: vi.fn(async () => ({ data: "", status: "completed" as const })),
    };
    const props = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      batchCode: null,
      callbacks: {},
      choices,
      deferredState: createDeferredState(),
      intervalMs: 0,
      retryLimit: 5,
      retryIntervalMs: 0,
      onReadyChange: vi.fn(),
      segments,
      session: "session-1",
      workerClient,
    };
    const view = render(<IndexContainer onQueueChange={vi.fn()} {...props} refresh={null} />);

    await screen.findByRole("heading", { name: "Deed" });
    view.rerender(<IndexContainer onQueueChange={vi.fn()} {...props} refresh={{ id: 1, segment: "party", session: "session-1" }} />);

    await waitFor(() => expect(workerClient.indexData).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("heading", { name: "Deed" })).toBeVisible();

    act(() => resolveRefresh?.({ ...metadata, heading: { class: "mortgage", title: "Mortgage" } }));
    await screen.findByRole("heading", { name: "Mortgage" });
  });

  it("emits view canceled on unmount", () => {
    const onViewCanceled = vi.fn();
    const workerClient = {
      updatePageSegments: vi.fn(),
      patchIndex: vi.fn(),
      confirmIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      dropIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      indexData: vi.fn(async () => metadata),
      patchStatus: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      reprocessSegment: vi.fn(async () => ({ data: "", status: "completed" as const })),
    };
    const view = render(
      <IndexContainer onQueueChange={vi.fn()}
        authToken="token"
        apiGatewayUrl="https://doc.example.com"
        batchCode={null}
        callbacks={{ onViewCanceled }}
        choices={choices}
        deferredState={createDeferredState()}
        intervalMs={0}
        retryLimit={5}
        retryIntervalMs={0}
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
