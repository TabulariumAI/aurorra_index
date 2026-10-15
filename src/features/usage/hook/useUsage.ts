import { useEffect, useState } from "react";
import { auditStoreApi } from "../../audit/store/auditStore";
import type { UsageRecord, UsageResult } from "../type/usage.types";

export function useUsage(owner: string | null) {
  const [state, setState] = useState<{ owner: string | null; records: UsageRecord[]; error: string | null; loading: boolean }>({ owner: null, records: [], error: null, loading: false });
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
    worker.onerror = () => {
      if (active) setState({ owner, records: [], error: "Usage could not be loaded.", loading: false });
    };
    function sync() {
      worker.postMessage({ owner, now: Date.now(), services: Object.entries(auditStoreApi.getState().reportsBySession)
        .flatMap(([session, report]) => (report.usage?.services ?? []).map(service => ({ ...service, session }))) });
    }
    function schedule() {
      const now = new Date();
      timer = setTimeout(() => { sync(); schedule(); }, Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - now.getTime());
    }
    sync();
    schedule();
    const unsubscribe = auditStoreApi.subscribe((next, previous) => {
      if (Object.entries(next.reportsBySession).some(([session, report]) => report.usage?.services !== previous.reportsBySession[session]?.usage?.services)) sync();
    });
    return () => { active = false; clearTimeout(timer); unsubscribe(); worker.terminate(); };
  }, [owner]);
  return state.owner === owner ? state : { owner, records: [], error: null, loading: owner !== null };
}
