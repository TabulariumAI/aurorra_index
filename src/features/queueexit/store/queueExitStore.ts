import { create } from "zustand";
import { queueStoreApi } from "../../queue/store/queueStore";

type QueueExitState = {
  open: boolean;
  request(): Promise<boolean>;
  decide(accepted: boolean): void;
};

export const useQueueExitStore = create<QueueExitState>()((set) => {
  let pending: Promise<boolean> | null = null;
  let resolve: ((value: boolean) => void) | null = null;
  return {
    open: false,
    request() {
      if (pending) return pending;
      if (!queueStoreApi.getState().tasks.length) return Promise.resolve(true);
      pending = new Promise<boolean>((done) => { resolve = done; });
      set({ open: true });
      return pending;
    },
    decide(accepted) {
      if (accepted) queueStoreApi.getState().reset();
      set({ open: false });
      resolve?.(accepted);
      resolve = null;
      pending = null;
    },
  };
});
