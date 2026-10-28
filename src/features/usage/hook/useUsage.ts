import { useEffect, useState } from "react";
import { auditStoreApi } from "../../audit/store/auditStore";
import type { UsageRecord, UsageResult } from "../type/usage.types";

export function useUsage(owner: string | null) {
  const [state, setState] = useState<{ owner: string | null; records: UsageRecord[]; error: string | ErrorEvent | null; loading: boolean }>({ owner: null, records: [], error: null, loading: false });
  useEffect(() => {
    if (owner === null) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const worker = new Worker(new URL("../worker/UsageWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<UsageResult>) => {
      if (!active) return;
      if (event.data.ok) setState({ owner, records: event.data.data, error: null, loading: false });
      else setState({ owner, records: [], error: event.data.error, loading: false });
    };
    worker.onerror = (event) => {
      if (active) setState({ owner, records: [], error: event, loading: false });
    };
    function sync() {
      const audit = auditStoreApi.getState();
      worker.postMessage({ owner, now: Date.now(), services: audit.activeSession === null ? []
        : (audit.report?.usage?.services ?? []).map(service => ({ ...service, session: audit.activeSession })) });
    }
    function schedule() {
      const now = new Date();
      timer = setTimeout(() => { sync(); schedule(); }, Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - now.getTime());
    }
    sync();
    schedule();
    const unsubscribe = auditStoreApi.subscribe((next, previous) => {
      if (next.activeSession !== previous.activeSession || next.report?.usage?.services !== previous.report?.usage?.services) sync();
    });
    return () => { active = false; clearTimeout(timer); unsubscribe(); worker.terminate(); };
  }, [owner]);
  return state.owner === owner ? state : { owner, records: [], error: null, loading: owner !== null };
}
