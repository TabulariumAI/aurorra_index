import { StrictMode } from "react";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { indexSegments, loaderDelayMs, splitMetadataJSON, type MetadataPayload } from "aurora-core";
import { IndexContainer } from "../component/IndexContainer";
import { createDeferredState } from "../data/deferredState";
import { indexStoreApi } from "../../metdataview/store/metadataStore";
import { storeApi } from "../../../store/state/store";
import type { MetadataClient, MetadataProps } from "../../metdataview/type/metadataView.types";

vi.mock("../../choices/worker/choicesWorkerClient", () => ({
  createSessionDataWorkerClient: () => ({ load: async () => ({ items: [], jurisdiction: null }) }),
}));

const metadata: MetadataPayload = {
  heading: { class: "deed", title: "Warranty Deed" },
  indexes: [], fees: [], funds: [], secrets: [],
};
let finish: (data: MetadataPayload) => void;
let fail: (error: Error) => void;
let props: MetadataProps;
let client: MetadataClient;

beforeEach(() => {
  vi.useFakeTimers();
  indexStoreApi.getState().resetMetadata();
  client = {
    indexData: vi.fn(() => new Promise<MetadataPayload>((resolve, reject) => { finish = resolve; fail = reject; })),
    pagesData: vi.fn(), updatePageSegments: vi.fn(), patchIndex: vi.fn(),
    confirmIndex: vi.fn(), dropIndex: vi.fn(), patchStatus: vi.fn(), reprocessSegment: vi.fn(),
  };
  props = { formatError: (error: unknown) => (error as Error).message,
    apiGatewayUrl: "https://api.test", authToken: "token", batchCode: null,
    callbacks: { onMetadataLoaded: vi.fn(), onViewError: vi.fn(), onViewCanceled: vi.fn() },
    deferredState: createDeferredState(), intervalMs: 0, retryIntervalMs: 0, retryLimit: 5,
    onQueueChange: vi.fn(), refresh: null,
    segments: { ...indexSegments, TITLE: "title", FEE: "fee", FEEFACTOR: "factor", FUND: "fund" },
    session: "first", workerClient: client,
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  indexStoreApi.getState().resetMetadata();
});

it("shows named, noninteractive accordion skeletons after the shared delay without empty data or first-attempt details", async () => {
  await act(async () => { render(<IndexContainer {...props} />); });
  expect(screen.queryByRole("status", { name: "Loading metadata" })).toBeNull();
  act(() => vi.advanceTimersByTime(loaderDelayMs - 1));
  expect(screen.queryByRole("status", { name: "Loading metadata" })).toBeNull();
  act(() => vi.advanceTimersByTime(1));
  const status = screen.getByRole("status", { name: "Loading metadata" });
  expect(status).toBeVisible();
  expect(status).toHaveAttribute("aria-busy", "true");
  expect(status).toHaveTextContent("Loading metadata…");
  expect(within(status).queryByRole("button")).toBeNull();
  expect(status.querySelectorAll('[aria-hidden="true"] span[style*="--skeleton-animation"]').length).toBeGreaterThan(6);
  expect(screen.queryByText(/Attempt/)).toBeNull();
  expect(screen.queryByText("No metadata found.")).toBeNull();
  expect(screen.queryByRole("progressbar")).toBeNull();
});

it("announces retry details only after the first failed attempt and removes loading on success", async () => {
  await act(async () => { render(<IndexContainer {...props} />); });
  act(() => vi.advanceTimersByTime(loaderDelayMs));
  act(() => indexStoreApi.getState().setRetryAttempt(2));
  expect(screen.getByRole("status", { name: "Loading metadata" })).toHaveTextContent("Attempt 2 of 5");
  await act(async () => finish(metadata));
  expect(screen.getByRole("heading", { name: "Deed" })).toBeVisible();
  expect(screen.queryByRole("status", { name: "Loading metadata" })).toBeNull();
  expect(screen.queryByText(/Attempt/)).toBeNull();
  expect(props.callbacks.onMetadataLoaded).toHaveBeenCalledExactlyOnceWith(metadata, "first");
  expect(screen.getByRole("button", { name: /^Titles$/ })).toBeEnabled();
});

it("ends loading on failure and preserves the structured error callback", async () => {
  await act(async () => { render(<IndexContainer {...props} />); });
  await act(async () => fail(Object.assign(new Error("Metadata rejected"), { code: "metadata_rejected", status: 400 })));
  expect(screen.queryByRole("status", { name: "Loading metadata" })).toBeNull();
  expect(screen.queryByText("No metadata found.")).toBeNull();
  expect(props.callbacks.onViewError).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
    error: "Metadata rejected", code: "metadata_rejected", status: 400,
  }));
});

it("uses cached metadata without requesting it again or leaving a skeleton visible", async () => {
  storeApi.getState().setJSON("first", splitMetadataJSON(metadata));
  await act(async () => { render(<IndexContainer {...props} />); });
  expect(screen.getByRole("heading", { name: "Deed" })).toBeVisible();
  expect(screen.queryByRole("status", { name: "Loading metadata" })).toBeNull();
  expect(client.indexData).not.toHaveBeenCalled();
});

it("retains loaded content while refreshing and replaces it when the refresh finishes", async () => {
  const view = render(<IndexContainer {...props} />);
  await act(async () => finish(metadata));
  view.rerender(<IndexContainer {...props} refresh={{ id: 1, session: "first", segment: "title" }} />);
  expect(client.indexData).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("heading", { name: "Deed" })).toBeVisible();
  expect(screen.queryByRole("status", { name: "Loading metadata" })).toBeNull();
  await act(async () => finish({ ...metadata, heading: { class: "mortgage", title: "Mortgage" } }));
  expect(screen.getByRole("heading", { name: "Mortgage" })).toBeVisible();
});

it("resets retry presentation for another session and ignores the previous request completion", async () => {
  const view = render(<IndexContainer {...props} />);
  const previous = finish;
  act(() => vi.advanceTimersByTime(loaderDelayMs));
  act(() => indexStoreApi.getState().setRetryAttempt(3));
  view.rerender(<IndexContainer {...props} session="second" />);
  expect(screen.queryByRole("status", { name: "Loading metadata" })).toBeNull();
  act(() => vi.advanceTimersByTime(loaderDelayMs - 1));
  expect(screen.queryByRole("status", { name: "Loading metadata" })).toBeNull();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole("status", { name: "Loading metadata" })).toBeVisible();
  expect(screen.queryByText(/Attempt/)).toBeNull();
  await act(async () => previous(metadata));
  expect(screen.queryByRole("heading", { name: "Deed" })).toBeNull();
  expect(screen.getByRole("status", { name: "Loading metadata" })).toBeVisible();
  await act(async () => finish({ ...metadata, heading: { class: "mortgage", title: "Mortgage" } }));
  expect(screen.getByRole("heading", { name: "Mortgage" })).toBeVisible();
  expect(props.callbacks.onMetadataLoaded).toHaveBeenCalledTimes(1);
});

it("settles the skeleton correctly under Strict Mode", async () => {
  await act(async () => { render(<StrictMode><IndexContainer {...props} /></StrictMode>); });
  act(() => vi.advanceTimersByTime(loaderDelayMs));
  expect(screen.getAllByRole("status", { name: "Loading metadata" })).toHaveLength(1);
  await act(async () => finish(metadata));
  expect(screen.getByRole("heading", { name: "Deed" })).toBeVisible();
  expect(screen.queryByRole("status", { name: "Loading metadata" })).toBeNull();
});

it("removes loading presentation and retains the cancellation callback on unmount", () => {
  const view = render(<IndexContainer {...props} />);
  view.unmount();
  expect(screen.queryByRole("status", { name: "Loading metadata" })).toBeNull();
  expect(props.callbacks.onViewCanceled).toHaveBeenCalledExactlyOnceWith();
});

it("renders fast metadata without ever mounting a loading status", async () => {
  const { container } = render(<IndexContainer {...props} />);
  const statuses: Element[] = [];
  const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node instanceof Element) statuses.push(...(node.matches('[role="status"]') ? [node] : []), ...node.querySelectorAll('[role="status"]'));
  })));
  observer.observe(container, { childList: true, subtree: true });
  expect(screen.queryByRole("status")).toBeNull();
  await act(async () => finish(metadata));
  expect(screen.getByRole("heading", { name: "Deed" })).toBeVisible();
  act(() => vi.advanceTimersByTime(loaderDelayMs));
  expect(screen.queryByRole("status")).toBeNull();
  expect(statuses).toHaveLength(0);
  observer.disconnect();
});
