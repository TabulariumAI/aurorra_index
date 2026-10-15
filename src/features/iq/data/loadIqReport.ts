import { iqStoreApi } from "../store/iqStore";
import type { IqReport, IqWorkerError, LoadIqInput } from "../type/iq.types";
import { createIqWorkerClient } from "../worker/iqWorkerClient";
import { toIqError } from "./iqData";

const activeLoads = new Map<string, { generation: number; load: Promise<IqReport | IqWorkerError | undefined> }>();

async function runIqReport(input: LoadIqInput, generation: number): Promise<IqReport | IqWorkerError | undefined> {
  const client = input.workerClient || createIqWorkerClient({
    apiBaseUrl: input.apiGatewayUrl, retryIntervalMs: input.retryIntervalMs, retryLimit: input.retryLimit,
    onRetry: attempt => {
      if (iqStoreApi.getState().generation === generation && iqStoreApi.getState().activeSession === input.session) {
        iqStoreApi.getState().setRetryAttempt(attempt);
      }
    },
  });
  if (input.restart) iqStoreApi.getState().setRefreshing(input.session);
  else iqStoreApi.getState().setLoading(input.session);
  try {
    const report = await client.loadReport(input.authToken, input.session, input.restart === true);
    if (iqStoreApi.getState().generation !== generation || iqStoreApi.getState().activeSession !== input.session) return;
    iqStoreApi.getState().setLoaded(input.session, report);
    return report;
  } catch (error) {
    if (iqStoreApi.getState().generation !== generation || iqStoreApi.getState().activeSession !== input.session) return;
    const workerError = toIqError(error);
    iqStoreApi.getState().setError(workerError);
    return workerError;
  }
}

export async function loadIqReport(input: LoadIqInput): Promise<void> {
  const generation = iqStoreApi.getState().generation;
  let active = activeLoads.get(input.session);
  if (active && (active.generation !== generation || iqStoreApi.getState().activeSession !== input.session)) active = undefined;
  const load = active && !input.restart ? active.load : active ? active.load.then(() => {
    if (iqStoreApi.getState().generation === generation && iqStoreApi.getState().activeSession === input.session) {
      return runIqReport(input, generation);
    }
  }) : runIqReport(input, generation);

  activeLoads.set(input.session, { generation, load });
  try {
    const result = await load;
    if (!result || iqStoreApi.getState().generation !== generation || iqStoreApi.getState().activeSession !== input.session) return;
    if ("error" in result) input.onError(result);
    else input.onComplete?.(result);
  } finally {
    if (activeLoads.get(input.session)?.load === load) activeLoads.delete(input.session);
  }
}
