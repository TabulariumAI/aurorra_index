import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { splitMetadataJSON, type MetadataPayload } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { queueStoreApi } from "../../queue/store/queueStore";
import { PageSegmentsPanel } from "../component/PageSegmentsPanel";
import { pageSegmentsStoreApi } from "../store/pageSegmentsStore";

const metadata: MetadataPayload = { indexes: [], pages: { num_of_pages: 2, recordables: [{ code: "page-a", name: "1", segments: ["reference"] }], nonrecordables: [{ code: "page-b", name: "2", segments: ["property"] }] } };
function setup() {
  const workerClient = { updatePageSegments: vi.fn(() => new Promise<void>(() => {})), indexData: vi.fn(async () => metadata), patchIndex: vi.fn(), confirmIndex: vi.fn(), dropIndex: vi.fn(), patchStatus: vi.fn(), reprocessSegment: vi.fn() };
  const onClose = vi.fn(); const onError = vi.fn();
  render(<PageSegmentsPanel apiGatewayUrl="https://gateway" authToken="token" batchCode="batch-1" intervalMs={0} retryIntervalMs={0} retryLimit={0} choices={[{ level: 1, service: "RecitalIndexing" }, { level: 1, service: "ConfidentialIndexing" }]} onClose={onClose} onError={onError} onReadyChange={vi.fn()} pageClass="blank" pageCode="page-a" segments={["reference"]} session="session-1" workerClient={workerClient} />);
  return { workerClient, onClose, onError };
}
beforeEach(() => { queueStoreApi.getState().reset(); storeApi.getState().resetAllState(); storeApi.getState().setJSON("session-1", splitMetadataJSON(metadata)); });
afterEach(() => { cleanup(); queueStoreApi.getState().reset(); pageSegmentsStoreApi.getState().reset([]); });
it("has no panel close action and disables actions after manual reversion", () => {
  const { onClose, workerClient } = setup();
  expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  const checkbox = screen.getByRole("checkbox", { name: "Confidential" });
  fireEvent.click(checkbox);
  expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();
  fireEvent.click(checkbox);
  expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
  fireEvent.click(checkbox);
  fireEvent.click(screen.getByRole("checkbox", { name: "Confidential" }));
  expect(checkbox).not.toBeChecked();
  expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  expect(onClose).not.toHaveBeenCalled();
  expect(workerClient.updatePageSegments).not.toHaveBeenCalled();
});
it("preserves selected segments and permissions without network work on open", () => {
  const { workerClient } = setup();
  expect(screen.getByRole("checkbox", { name: "Reference (Recital)" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Record Endorsements" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();
  expect(workerClient.updatePageSegments).not.toHaveBeenCalled(); expect(workerClient.indexData).not.toHaveBeenCalled();
});
it("closes after queue acceptance and changes the page before processing finishes", async () => {
  const { workerClient, onClose, onError } = setup();
  fireEvent.click(screen.getByRole("checkbox", { name: "Confidential" }));
  fireEvent.click(screen.getByRole("button", { name: "Update" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(workerClient.updatePageSegments).toHaveBeenCalledWith("token", "session-1", "page-a", ["reference", "secrets"]);
  expect(storeApi.getState().getJSON("session-1")?.pagesJSON.pages?.recordables?.[0].segments).toEqual(["reference", "secrets"]);
  expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 1, completed: 0 });
  expect(onError).not.toHaveBeenCalled();
});
it("keeps background failures in the queue rather than the closed editor", async () => {
  const { workerClient, onClose, onError } = setup();
  workerClient.updatePageSegments.mockRejectedValueOnce(new Error("Page rejected"));
  fireEvent.click(screen.getByRole("checkbox", { name: "Confidential" })); fireEvent.click(screen.getByRole("button", { name: "Update" }));
  await waitFor(() => expect(queueStoreApi.getState().tasks[0]).toMatchObject({ status: "failed", error: "Page rejected" }));
  expect(onClose).toHaveBeenCalledOnce(); expect(onError).not.toHaveBeenCalled();
});
it("rejects acceptance without metadata and preserves the editor", async () => {
  storeApi.getState().resetAllState(); const { workerClient, onClose, onError } = setup();
  fireEvent.click(screen.getByRole("checkbox", { name: "Confidential" })); fireEvent.click(screen.getByRole("button", { name: "Update" }));
  await waitFor(() => expect(onError).toHaveBeenCalledOnce());
  expect(onClose).not.toHaveBeenCalled(); expect(workerClient.updatePageSegments).not.toHaveBeenCalled();
  expect(queueStoreApi.getState().tasks).toHaveLength(0);
});
it("supports manually reverted selections and accepts blank page segments", async () => {
  const { workerClient, onClose } = setup();
  fireEvent.click(screen.getByRole("checkbox", { name: "Confidential" })); fireEvent.click(screen.getByRole("checkbox", { name: "Confidential" }));
  expect(screen.getByRole("checkbox", { name: "Reference (Recital)" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Confidential" })).not.toBeChecked();
  fireEvent.click(screen.getByRole("checkbox", { name: "This page is blank" })); fireEvent.click(screen.getByRole("button", { name: "Update" }));
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(workerClient.updatePageSegments).toHaveBeenCalledWith("token", "session-1", "page-a", []);
});
