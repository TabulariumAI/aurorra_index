import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { composeMetadataJSON, getPanelData, splitMetadataJSON, type MetadataPayload } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { queueStoreApi } from "../store/queueStore";
import type { IndexChange, QueueRuntime } from "../type/queue.types";

const existing = { code: "existing", segment: "party", aspect: "grantor", label: "Grantor", value: "Alice" };
const base = { indexes: [existing], parties: [existing], secrets: [] };
const addition: IndexChange = {
  action: "add", explanation: "Index created by user.", new_index_page: "1", new_index_source: "Source", new_index_label: "Grantor", new_index_aspect: "grantor", new_index_value: "Bob",
  new_index_ambiguous: null, old_index_label: null, old_index_aspect: null, old_index_value: null,
};

function runtime(): QueueRuntime {
  return { authToken: "token", intervalMs: 0, onChange: vi.fn(), client: {
    patchIndex: vi.fn(() => new Promise<never>(() => {})),
    patchStatus: vi.fn(() => new Promise<never>(() => {})),
    indexData: vi.fn(() => new Promise<MetadataPayload>(() => {})),
    confirmIndex: vi.fn(), dropIndex: vi.fn(), updatePageSegments: vi.fn(), reprocessSegment: vi.fn(),
  } };
}

beforeEach(() => {
  queueStoreApi.getState().reset();
  storeApi.getState().resetAllState();
  storeApi.getState().setJSON("session", splitMetadataJSON(base));
});
afterEach(() => queueStoreApi.getState().reset());

it.each([false, true])("projects additions into each displayed segment with enrichment=%s", async (allow_enrichment) => {
  const config = runtime();
  for (const [segment, section] of Object.entries({ party: "parties", property: "properties", reference: "references", acknowledgment: "notary", endorsement: "endorsements", monetary: "monetarys", transaction: "transactions", vital: "vitals", secrets: "secrets" })) {
    await queueStoreApi.getState().enqueue({ batch: null, session: "session", segment, data: JSON.stringify([{ ...addition, allow_enrichment, new_index_aspect: segment, new_index_value: segment }]) }, config);
    const task = queueStoreApi.getState().tasks.at(-1)!;
    const change = task.changes[0];
    if (change.action !== "patch") throw new Error("Expected an addition");
    const panel = getPanelData(composeMetadataJSON(storeApi.getState().getJSON("session"))!);
    expect(panel[section as keyof typeof panel]).toEqual(expect.arrayContaining([change.index]));
    expect(panel.parties).toContainEqual(existing);
    expect(change.index).toMatchObject({ page: "1", source: "Source", explanation: "Index created by user." });
  }
  expect(config.client.patchIndex).toHaveBeenCalledOnce();
  expect(config.client.indexData).not.toHaveBeenCalled();
});

it("preserves displayed parties when metadata has only raw indexes", async () => {
  storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [existing] }));
  await queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "party", data: JSON.stringify([addition]) }, runtime());
  const panel = getPanelData(composeMetadataJSON(storeApi.getState().getJSON("session"))!);
  expect(panel.parties.map(item => item.value)).toEqual(["Bob", "Alice"]);
  expect(panel.indexes).toEqual([existing]);
});

it("retains completed additions when another task or metadata refresh reprojects the session", async () => {
  const config = runtime();
  vi.mocked(config.client.patchIndex).mockResolvedValueOnce({ status: "completed", data: "", version: 1 });
  let refresh!: (data: MetadataPayload) => void;
  vi.mocked(config.client.indexData).mockImplementationOnce(() => new Promise(resolve => { refresh = resolve; }));
  await queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "party", data: JSON.stringify([addition]) }, config);
  await waitFor(() => expect(config.client.indexData).toHaveBeenCalledOnce());
  const code = queueStoreApi.getState().tasks[0].changes[0];
  expect(code.action === "patch" && code.index.value).toBe("Bob");
  await queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "party", data: JSON.stringify([{ ...addition, new_index_value: "Carol" }]) }, config);
  queueStoreApi.getState().setMetadata("session", { ...base, heading: { title: "Refreshed" } });
  expect(getPanelData(composeMetadataJSON(storeApi.getState().getJSON("session"))!).parties.map(item => item.value)).toEqual(["Carol", "Bob", "Alice"]);
  refresh(base);
  await waitFor(() => expect(config.client.patchIndex).toHaveBeenCalledTimes(2));
  expect(getPanelData(composeMetadataJSON(storeApi.getState().getJSON("session"))!).parties.map(item => item.value)).toEqual(["Carol", "Bob", "Alice"]);
});

it.each(["mutation", "status", "refresh"] as const)("retains additions after %s failure and retries without duplicate rows", async (failure) => {
  const config = runtime();
  const completed = { status: "completed" as const, data: "", version: 7 };
  vi.mocked(config.client.patchIndex).mockResolvedValue(failure === "status" ? { ...completed, status: "processing" } : completed);
  vi.mocked(config.client.patchStatus).mockResolvedValue(completed);
  const remote = { ...base, parties: [{ ...existing, code: "server", value: "Bob" }, existing] };
  vi.mocked(config.client.indexData).mockResolvedValue(remote);
  if (failure === "mutation") vi.mocked(config.client.patchIndex).mockRejectedValueOnce(new Error("Failed"));
  if (failure === "status") vi.mocked(config.client.patchStatus).mockRejectedValueOnce(new Error("Failed"));
  if (failure === "refresh") vi.mocked(config.client.indexData).mockRejectedValueOnce(new Error("Failed"));
  await queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "party", data: JSON.stringify([addition]) }, config);
  await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
  queueStoreApi.getState().setMetadata("session", base);
  const task = queueStoreApi.getState().tasks[0];
  const change = task.changes[0];
  if (change.action !== "patch") throw new Error("Expected an addition");
  expect(getPanelData(composeMetadataJSON(storeApi.getState().getJSON("session"))!).parties).toEqual([change.index, existing]);
  await queueStoreApi.getState().retry(task.id);
  await waitFor(() => expect(queueStoreApi.getState().tasks).toHaveLength(0));
  expect(getPanelData(composeMetadataJSON(storeApi.getState().getJSON("session"))!).parties).toEqual(remote.parties);
  expect(config.client.patchIndex).toHaveBeenCalledTimes(failure === "mutation" ? 2 : 1);
});

it("cancels only the selected failed addition and resets remaining provisional rows", async () => {
  const config = runtime();
  vi.mocked(config.client.patchIndex).mockRejectedValue(new Error("Failed"));
  await queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "party", data: JSON.stringify([addition, { ...addition, new_index_value: "Carol" }]) }, config);
  await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
  const task = queueStoreApi.getState().tasks[0];
  const change = task.changes[0];
  if (change.action !== "patch") throw new Error("Expected an addition");
  queueStoreApi.getState().cancel(task.id, change.code);
  expect(getPanelData(composeMetadataJSON(storeApi.getState().getJSON("session"))!).parties.map(item => item.value)).toEqual(["Carol", "Alice"]);
  queueStoreApi.getState().reset();
  expect(composeMetadataJSON(storeApi.getState().getJSON("session"))).toEqual(base);
});

it("does not duplicate an existing addition or leak it into another session", async () => {
  storeApi.getState().setJSON("other", splitMetadataJSON(base));
  const config = runtime();
  for (const value of ["Alice", "Bob", "Bob"]) {
    await queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "party", data: JSON.stringify([{ ...addition, new_index_value: value }]) }, config);
  }
  expect(getPanelData(composeMetadataJSON(storeApi.getState().getJSON("session"))!).parties.map(item => item.value)).toEqual(["Bob", "Alice"]);
  expect(composeMetadataJSON(storeApi.getState().getJSON("other"))).toEqual(base);
});
