import { create } from "zustand";
import { persist } from "zustand/middleware";
import { composeMetadataJSON, splitMetadataJSON, type MetadataPayload } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { applyChange, readChanges } from "../data/queueData";
import type { QueueChange, QueueState, QueueTask } from "../type/queue.types";

function reportChange(task: QueueTask, status: "queued" | "processing" | "completed" | "failed" | "retried" | "canceled", changes: readonly QueueChange[]): void {
  task.runtime.onChange({ session: task.session, batch: task.batch, status, error: task.error, changes: structuredClone(changes) });
}

export const useQueueStore = create<QueueState>()(persist((set, get) => {
  const bases = new Map<string, MetadataPayload>();
  let scope: string | null = null;
  let generation = 0;
  let running = false;

  function canRefresh(session: string): boolean {
    return get().tasks.every((task) => task.session !== session ||
      (task.status !== "failed" && task.cursor === task.changes.length));
  }

  function project(session: string): void {
    const base = bases.get(session);
    if (!base) return;
    const metadata = get().tasks.filter((task) => task.session === session)
      .reduce((data, task) => task.changes.reduce((current, change, position) =>
        (change.action === "patch" && change.patch?.action === "add") ||
        (position >= task.cursor && (change.action === "page" || change.action === "confirm"))
          ? applyChange(current, change) : current, data), base);
    storeApi.getState().setJSON(session, splitMetadataJSON(metadata));
  }

  function notify(completed?: QueueTask): void {
    set((state) => {
      const queues = state.queues.map((queue) => ({ ...queue,
        pending: state.tasks.filter((task) => task.session === queue.session && task.batch === queue.batch && task.status !== "failed").length,
        failed: state.tasks.filter((task) => task.session === queue.session && task.batch === queue.batch && task.status === "failed").length,
        completed: queue.completed + (completed?.session === queue.session && completed.batch === queue.batch ? 1 : 0),
      }));
      return { tasks: [...state.tasks], queues, ...(scope !== null ? { snapshots: { ...state.snapshots, [scope]: {
        tasks: state.tasks.map(({ runtime: _runtime, ...task }) => task), queues, bases: Object.fromEntries(bases), paths: state.paths,
      } } } : {}) };
    });
  }

  async function process(): Promise<void> {
    if (running) return;
    running = true;
    const started = generation;
    try {
      for (;;) {
        const task = get().tasks.find((item) => item.status === "queued" && item.cursor < item.changes.length)
          ?? get().tasks.find((item) => item.status !== "failed" && canRefresh(item.session));
        if (!task) break;
        task.status = "processing";
        task.error = null;
        const refreshing = task.cursor === task.changes.length;
        if (refreshing) reportChange(task, "processing", []);
        notify();
        const { authToken, client, intervalMs } = task.runtime;
        try {
          while (task.cursor < task.changes.length) {
            const change = task.changes[task.cursor];
            reportChange(task, "processing", [change]);
            if (change.action === "reprocess") {
              await client.reprocessSegment(authToken, task.session, change.segment);
              if (started !== generation) return;
            } else if (change.action === "page") {
              await client.updatePageSegments(authToken, task.session, change.code, change.segments);
              if (started !== generation) return;
            } else {
              if (!task.result) {
                task.result = change.patch
                  ? await client.patchIndex(authToken, task.session, task.segment, change.patch)
                  : change.action === "confirm"
                    ? await client.confirmIndex(authToken, task.session, change.code)
                    : await client.dropIndex(authToken, task.session, change.code);
                if (started !== generation) return;
                notify();
              }
              while (task.result.status === "pending" || task.result.status === "processing") {
                await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
                if (started !== generation) return;
                task.result = await client.patchStatus(authToken, task.session, task.result.version);
                if (started !== generation) return;
                notify();
              }
              if (task.result.status === "error") {
                const error = task.result.data;
                task.result = null;
                throw new Error(error);
              }
            }
            if (change.action === "page" || change.action === "confirm") bases.set(task.session, applyChange(bases.get(task.session)!, change));
            reportChange(task, "completed", [change]);
            task.cursor += 1;
            task.result = null;
            notify();
          }
          const reprocess = task.changes.some(change => change.action === "reprocess");
          task.status = reprocess ? "processing" : "completed";
          notify(refreshing || reprocess ? undefined : task);
          if (!canRefresh(task.session)) {
            continue;
          }
          const data = await client.indexData(authToken, task.session, true);
          if (started !== generation) return;
          if (!canRefresh(task.session)) {
            continue;
          }
          bases.set(task.session, data);
          const reprocessed = get().tasks.filter((item) => item.session === task.session && item.changes.some(change => change.action === "reprocess"));
          set((state) => ({ tasks: state.tasks.filter((item) => item.session !== task.session) }));
          project(task.session);
          if (!get().tasks.some((item) => item.session === task!.session)) bases.delete(task.session);
          if (refreshing) reportChange(task, "completed", []);
          notify();
          for (const item of reprocessed) notify(item);
        } catch (error) {
          if (started !== generation) return;
          task.status = "failed";
          task.error = error instanceof Error ? error.message : String(error);
          reportChange(task, "failed", task.changes.slice(task.cursor, task.cursor + 1));
          notify();
        }
      }
    } finally {
      if (started === generation) running = false;
    }
  }

  return {
    tasks: [], queues: [], snapshots: {}, paths: {}, generation: 0,
    restore(owner, runtime) {
      if (scope === owner) {
        for (const task of get().tasks) task.runtime = runtime;
        return;
      }
      generation += 1;
      running = false;
      scope = owner;
      for (const session of bases.keys()) storeApi.getState().removeJSON(session);
      bases.clear();
      const snapshot = get().snapshots[owner];
      for (const [session, metadata] of Object.entries(snapshot?.bases ?? {})) bases.set(session, metadata);
      const tasks = (snapshot?.tasks ?? []).map((saved): QueueTask => {
        const task = { ...saved, runtime };
        if (task.status === "processing") {
          if (!task.result && task.cursor < task.changes.length) {
            task.status = "failed";
            task.error = "The page closed before this request was acknowledged. Review the metadata before retrying; the server may already have accepted it.";
          } else task.status = "queued";
          reportChange(task, task.status, task.changes.slice(task.cursor));
        }
        return task;
      });
      set({ tasks, queues: snapshot?.queues ?? [], paths: snapshot?.paths ?? {}, generation });
      for (const session of bases.keys()) project(session);
      notify();
      void process();
    },
    async enqueue(request, runtime) {
      const metadata = composeMetadataJSON(storeApi.getState().getJSON(request.session));
      if (!metadata) throw new Error("Load metadata before changing indexes.");
      const id = crypto.randomUUID();
      const changes = readChanges(request, metadata, id);
      if (!bases.has(request.session)) bases.set(request.session, metadata);
      const task: QueueTask = { id, batch: request.batch, session: request.session, segment: request.segment,
        changes, cursor: 0, result: null, status: "queued", error: null, runtime };
      set((state) => ({ tasks: [...state.tasks, task], queues: state.queues.some((queue) => queue.session === request.session && queue.batch === request.batch)
        ? state.queues : [...state.queues, { id: "index", batch: request.batch, session: request.session, pending: 0, failed: 0, completed: 0 }] }));
      project(request.session);
      reportChange(task, "queued", changes);
      notify();
      void process();
      return { status: "accepted" };
    },
    async retry(id) {
      const task = get().tasks.find((item) => item.id === id);
      if (!task || task.status !== "failed") throw new Error("This change is not available for retry.");
      task.status = "queued";
      task.error = null;
      reportChange(task, "retried", task.changes.slice(task.cursor));
      notify();
      void process();
      return { status: "accepted" };
    },
    cancel(id, code) {
      const task = get().tasks.find((item) => item.id === id);
      if (!task || task.status === "processing") throw new Error("A processing change cannot be canceled.");
      const canceled = task.changes.slice(task.cursor).filter(change => change.action === "reprocess" ? code === undefined : change.code === code);
      if (canceled.length === 0) throw new Error("A completed change cannot be canceled.");
      reportChange(task, "canceled", canceled);
      if (canceled.includes(task.changes[task.cursor])) task.result = null;
      task.changes = task.changes.filter(change => !canceled.includes(change));
      if (task.changes.length === task.cursor) {
        set((state) => ({ tasks: state.tasks.filter((item) => item.id !== id) }));
      }
      project(task.session);
      if (!get().tasks.some((item) => item.session === task.session)) bases.delete(task.session);
      notify();
      void process();
    },
    setPath(session, path) {
      set((state) => ({ paths: { ...state.paths, [session]: path } }));
      notify();
    },
    setMetadata(session, metadata) {
      if (get().tasks.some((task) => task.session === session)) {
        bases.set(session, metadata);
        project(session);
        notify();
      } else {
        storeApi.getState().setJSON(session, splitMetadataJSON(metadata));
      }
    },
    reset() {
      generation += 1;
      running = false;
      for (const [session, metadata] of bases) storeApi.getState().setJSON(session, splitMetadataJSON(metadata));
      bases.clear();
      set({ tasks: [], queues: [], paths: {}, generation });
      notify();
    },
  };
}, { name: "aurorra-index:queue", partialize: (state) => ({ snapshots: state.snapshots }) }));

export const queueStoreApi = useQueueStore;
