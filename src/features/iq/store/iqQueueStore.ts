import { create } from "zustand";
import { persist } from "zustand/middleware";
import { formatLabel } from "aurora-core";
import type { IqQueueState, IqTask } from "../type/iqQueue.types";
import type { IqTransition } from "../type/iq.types";
import { toIqError } from "../data/iqData";
import { iqStoreApi } from "./iqStore";

export const iqQueueStore = create<IqQueueState>()(persist((set, get) => {
  let owner: string | null = null;
  let generation = 0;
  let running = false;

  function saveSnapshot() {
    if (owner === null) return;
    const tasks = get().tasks.map(({ runtime: _runtime, ...task }) => task);
    set(state => ({ snapshots: { ...state.snapshots, [owner!]: { tasks, queues: state.queues } } }));
  }

  function notify(task: IqTask, status: IqTransition["status"]) {
    set(state => {
      const tasks = status === "completed" || status === "canceled"
        ? state.tasks.filter(item => item.id !== task.id) : [...state.tasks];
      return { tasks, queues: state.queues.map(queue => queue.session !== task.session ? queue : { ...queue,
        pending: tasks.filter(item => item.session === task.session && item.status !== "failed").length,
        failed: tasks.filter(item => item.session === task.session && item.status === "failed").length,
        completed: queue.completed + (status === "completed" ? 1 : 0),
      }) };
    });
    saveSnapshot();
    task.runtime.onChange({ id: task.id, session: task.session, kind: task.kind, code: task.code, error: task.error, status });
  }

  async function process() {
    if (running) return;
    running = true;
    const started = generation;
    try {
      for (;;) {
        const task = get().tasks[0];
        if (task?.status !== "queued") break;
        task.status = "processing";
        task.error = null;
        const baseline = iqStoreApi.getState();
        notify(task, "processing");
        const { authToken, client } = task.runtime;
        try {
          const result = await client[task.kind === "gates" ? "ackGate" : "ackCue"](authToken, task.session, task.code);
          if (started !== generation) return;
          const current = iqStoreApi.getState();
          if (current.activeSession === task.session && current.reportGeneration === baseline.reportGeneration) {
            current.setAcknowledged(task.code, result.etag);
            task.runtime.onComplete?.(task.code);
          }
          notify(task, "completed");
        } catch (error) {
          if (started !== generation) return;
          task.status = "failed";
          task.error = toIqError(error).error;
          notify(task, "failed");
          break;
        }
      }
    } finally {
      if (started === generation) running = false;
    }
  }

  return {
    tasks: [], queues: [], snapshots: {},
    restore(scope, runtime) {
      if (owner === scope) {
        for (const task of get().tasks) task.runtime = runtime;
        return;
      }
      generation += 1;
      running = false;
      owner = scope;
      const saved = get().snapshots[scope];
      const tasks = (saved?.tasks ?? []).map((task): IqTask => ({ ...task, runtime,
        ...(task.status === "processing" ? {
          status: "failed", error: "The page closed before acknowledgment completed. Retry to check the saved result.",
        } : {}),
      }));
      set({ tasks, queues: saved?.queues ?? [] });
      for (const task of tasks) notify(task, task.status);
      void process();
    },
    enqueue(session, kind, code, runtime) {
      if (get().tasks.some(task => task.session === session && task.kind === kind && task.code === code)) return;
      const task: IqTask = { id: crypto.randomUUID(), session, kind, code, runtime, status: "queued", error: null };
      set(state => ({ tasks: [...state.tasks, task], queues: state.queues.some(queue => queue.session === session) ? state.queues
        : [...state.queues, { id: "iq", session, batch: null, pending: 0, failed: 0, completed: 0 }] }));
      notify(task, "queued");
      void process();
    },
    retry(id) {
      const task = get().tasks.find(item => item.id === id && item.status === "failed");
      if (!task) return;
      task.status = "queued";
      task.error = null;
      notify(task, "retried");
      void process();
    },
    cancel(id) {
      const task = get().tasks.find(item => item.id === id && item.status !== "processing");
      if (!task) return;
      notify(task, "canceled");
      void process();
    },
    getBlockers(_reason) {
      const tasks = get().tasks;
      return tasks.length ? [{ id: "iq", title: "IQ acknowledgments", items: tasks.map(task =>
        `${task.session} · ${task.kind === "cues" ? "Cue dismissal" : "Compliance acknowledgment"} · ${formatLabel(task.status)}`), cancel: () => get().reset() }] : [];
    },
    reset() {
      generation += 1;
      running = false;
      for (const task of get().tasks) notify(task, "canceled");
      set({ tasks: [], queues: [] });
      saveSnapshot();
      owner = null;
    },
  };
}, { name: "aurorra-index:iq-queue", version: 1, partialize: state => ({ snapshots: state.snapshots }) }));
