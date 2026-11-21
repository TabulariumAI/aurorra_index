import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { iqQueueStore } from "../store/iqQueueStore";
import { iqStoreApi } from "../store/iqStore";
import type { IqQueueRuntime } from "../type/iqQueue.types";
import type { IqResource } from "../type/iq.types";

const before: IqResource = { report: { iq_doc: 84, gates: [{ code: "gate", status: "FAIL", description: "Signature" }], notes: [{ segment: null, message: "Before" }],
  segments: [{ segment_name: "party", iq: 84, expected_weight: 50, actual_weight: 42, explanations: [],
    cues: [{ code: "cue", aspect: "person", description: "Missing person" }] }] }, metadataEtag: "old" };

function runtime() {
  let submit!: () => void;
  const posted = new Promise<void>(resolve => { submit = resolve; });
  const client = {
    ackGate: vi.fn(async () => { await posted; return { status: "completed", data: {}, etag: "inputs-after", isComplete: true as const }; }),
    ackCue: vi.fn(async () => { await posted; return { status: "completed", data: {}, etag: "inputs-after", isComplete: true as const }; }),
    loadReport: vi.fn(),
  };
  return { authToken: "token", client, onChange: vi.fn(), onComplete: vi.fn(), submit } satisfies IqQueueRuntime & { submit(): void };
}

beforeEach(() => { iqQueueStore.getState().reset(); iqStoreApi.getState().resetIq(); iqStoreApi.getState().setLoaded("s", before.report, before.metadataEtag); });
afterEach(() => { iqQueueStore.getState().reset(); iqStoreApi.getState().resetIq(); localStorage.clear(); });

it.each(["gates", "cues"] as const)("completes %s without downloading or replacing the saved report", async kind => {
  const run = runtime();
  iqQueueStore.getState().enqueue("s", kind, "code", run);
  expect(iqQueueStore.getState().tasks[0]).toMatchObject({ session: "s", kind, code: "code", status: "processing" });
  expect(iqStoreApi.getState().report).toBe(before.report);
  expect(run.client[kind === "gates" ? "ackGate" : "ackCue"]).toHaveBeenCalledExactlyOnceWith("token", "s", "code");
  run.submit();
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(run.client.loadReport).not.toHaveBeenCalled();
  expect(iqStoreApi.getState().report).toBe(before.report);
  expect(iqStoreApi.getState().etag).toBe("inputs-after");
  expect(run.onChange.mock.calls.map(([event]) => event.status)).toEqual(["queued", "processing", "completed"]);
  expect(run.onComplete).toHaveBeenCalledExactlyOnceWith("code");
  expect(iqQueueStore.getState().queues[0]).toMatchObject({ pending: 0, failed: 0, completed: 1 });
});

it("deduplicates and serializes cue and compliance work", async () => {
  const run = runtime();
  iqQueueStore.getState().enqueue("s", "cues", "cue", run);
  iqQueueStore.getState().enqueue("s", "cues", "cue", run);
  iqQueueStore.getState().enqueue("s", "gates", "gate", run);
  expect(iqQueueStore.getState().tasks).toHaveLength(2);
  expect(run.client.ackCue).toHaveBeenCalledOnce();
  expect(run.client.ackGate).not.toHaveBeenCalled();
  run.submit();
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(run.client.ackGate).toHaveBeenCalledOnce();
});

it("retains queued order behind a failed acknowledgment until retry", async () => {
  const run = runtime();
  run.client.ackCue.mockRejectedValueOnce(new Error("Offline"));
  iqQueueStore.getState().enqueue("s", "cues", "cue", run);
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks[0].status).toBe("failed"));
  iqQueueStore.getState().enqueue("s", "gates", "gate", run);
  expect(run.client.ackGate).not.toHaveBeenCalled();
  iqQueueStore.getState().retry(iqQueueStore.getState().tasks[0].id);
  run.submit();
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(run.client.ackGate).toHaveBeenCalledOnce();
});

it("restores an interrupted submit for explicit retry without persisting credentials", () => {
  const run = runtime();
  iqQueueStore.getState().restore("owner", run);
  iqQueueStore.getState().enqueue("s", "gates", "gate", run);
  const stored = localStorage.getItem("aurorra-index:iq-queue")!;
  expect(stored).not.toContain("authToken");
  expect(stored).not.toContain("runtime");
  iqQueueStore.getState().restore("other", run);
  iqQueueStore.getState().restore("owner", run);
  expect(iqQueueStore.getState().tasks[0]).toMatchObject({ status: "failed" });
  expect(run.client.ackGate).toHaveBeenCalledOnce();
});

it("hydrates existing owner snapshots without dropping interrupted work", async () => {
  const run = runtime();
  localStorage.setItem("aurorra-index:iq-queue", JSON.stringify({ version: 1, state: { snapshots: {
    owner: {
      tasks: [{ id: "saved", session: "s", kind: "gates", code: "gate", status: "processing", error: null }],
      queues: [{ id: "iq", session: "s", batch: null, pending: 1, failed: 0, completed: 0 }],
    },
  } } }));
  await iqQueueStore.persist.rehydrate();
  iqQueueStore.getState().restore("owner", run);
  expect(iqQueueStore.getState().tasks).toEqual([expect.objectContaining({ id: "saved", status: "failed" })]);
  expect(iqQueueStore.getState().queues[0]).toMatchObject({ pending: 0, failed: 1, completed: 0 });
  expect(run.client.ackGate).not.toHaveBeenCalled();
  expect(run.client.loadReport).not.toHaveBeenCalled();
});

it("retries a failed submission without losing or downloading the report", async () => {
  const run = runtime();
  run.client.ackGate.mockRejectedValueOnce(new Error("Submit failed"));
  run.submit();
  iqQueueStore.getState().enqueue("s", "gates", "gate", run);
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks[0].status).toBe("failed"));
  expect(iqStoreApi.getState().report).toBe(before.report);
  iqQueueStore.getState().retry(iqQueueStore.getState().tasks[0].id);
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(run.client.ackGate).toHaveBeenCalledTimes(2);
  expect(run.client.loadReport).not.toHaveBeenCalled();
});

it.each(["session", "reset", "refresh", "owner"] as const)("ignores stale report publication after %s changes", async change => {
  const run = runtime();
  iqQueueStore.getState().enqueue("s", "cues", "cue", run);
  if (change === "session") iqStoreApi.getState().setLoaded("other", before.report);
  if (change === "reset") { iqStoreApi.getState().resetIq(); iqStoreApi.getState().setLoaded("s", before.report); }
  if (change === "refresh") iqStoreApi.getState().setLoading("s", true);
  if (change === "owner") iqQueueStore.getState().restore("other-owner", run);
  const current = iqStoreApi.getState();
  run.submit();
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(iqStoreApi.getState()).toBe(current);
  expect(run.onComplete).not.toHaveBeenCalled();
});

it("keeps session and logout blockers until work is completed or explicitly discarded", async () => {
  const run = runtime();
  run.client.ackCue.mockRejectedValueOnce(new Error("Offline"));
  iqQueueStore.getState().enqueue("s", "cues", "cue", run);
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks[0].status).toBe("failed"));
  for (const reason of ["session", "logout"] as const) expect(iqQueueStore.getState().getBlockers(reason)[0].items).toEqual(["s · Cue dismissal · Failed"]);
  iqQueueStore.getState().cancel(iqQueueStore.getState().tasks[0].id);
  expect(iqQueueStore.getState().getBlockers("session")).toEqual([]);
  expect(run.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: "canceled" }));
});

it("restores only the active owner's interrupted submission for explicit retry", async () => {
  const run = runtime();
  iqQueueStore.getState().restore("owner", run);
  iqQueueStore.getState().enqueue("s", "cues", "cue", run);
  iqQueueStore.getState().restore("other", run);
  expect(iqQueueStore.getState().tasks).toEqual([]);
  iqQueueStore.getState().restore("owner", run);
  expect(iqQueueStore.getState().tasks[0].status).toBe("failed");
  iqQueueStore.getState().retry(iqQueueStore.getState().tasks[0].id);
  run.submit();
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(run.client.ackCue).toHaveBeenCalledTimes(2);
  expect(run.client.loadReport).not.toHaveBeenCalled();
});

it("discards in-flight work on queue reset without publishing or downloading its result", async () => {
  const run = runtime();
  iqQueueStore.getState().enqueue("s", "cues", "cue", run);
  iqQueueStore.getState().reset();
  run.submit();
  await vi.waitFor(() => expect(run.client.ackCue).toHaveResolved());
  expect(run.client.loadReport).not.toHaveBeenCalled();
  expect(run.onChange).not.toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }));
  expect(iqStoreApi.getState().report).toBe(before.report);
  expect(iqQueueStore.getState().getBlockers("logout")).toEqual([]);
});

it("cancels queued work without submitting it and continues the remaining queue", async () => {
  const run = runtime();
  run.client.ackCue.mockRejectedValueOnce(new Error("Offline"));
  iqQueueStore.getState().enqueue("s", "cues", "cue", run);
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks[0].status).toBe("failed"));
  iqQueueStore.getState().enqueue("s", "gates", "gate", run);
  iqQueueStore.getState().cancel(iqQueueStore.getState().tasks[1].id);
  iqQueueStore.getState().retry(iqQueueStore.getState().tasks[0].id);
  run.submit();
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(run.client.ackGate).not.toHaveBeenCalled();
  expect(iqQueueStore.getState().queues[0]).toMatchObject({ pending: 0, failed: 0, completed: 1 });
});

it("uses refreshed owner credentials when retrying restored work", async () => {
  const run = runtime();
  run.client.ackCue.mockRejectedValueOnce(new Error("Expired token"));
  iqQueueStore.getState().restore("owner", run);
  iqQueueStore.getState().enqueue("s", "cues", "cue", run);
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks[0].status).toBe("failed"));
  iqQueueStore.getState().restore("owner", { ...run, authToken: "renewed" });
  iqQueueStore.getState().retry(iqQueueStore.getState().tasks[0].id);
  run.submit();
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(run.client.ackCue).toHaveBeenLastCalledWith("renewed", "s", "cue");
  expect(run.client.loadReport).not.toHaveBeenCalled();
});

it("preserves a model change received while an acknowledgment is being published", async () => {
  const run = runtime();
  const saved = { class: "deed", jurisdiction: null, etag: "saved-model" };
  const current = { ...saved, etag: "current-model" };
  iqStoreApi.getState().setLoaded("s", before.report, "metadata", saved.etag, saved);
  iqQueueStore.getState().enqueue("s", "cues", "cue", run);
  iqStoreApi.getState().setVerificationModel("s", current);
  run.submit();
  await vi.waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(iqStoreApi.getState().verificationModel).toBe(current);
  expect(iqStoreApi.getState().verificationEtag).toBe(saved.etag);
});
