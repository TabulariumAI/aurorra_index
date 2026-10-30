import { iqStoreApi } from "../store/iqStore";
import type { IqReport, IqWorkerError, LoadIqInput } from "../type/iq.types";
import { createIqWorkerClient } from "../worker/iqWorkerClient";
import { toIqError } from "./iqData";
import { requestResource } from "../../metdataview/data/metadataResource";

let activeLoad: { session: string; generation: number; load: Promise<IqReport | IqWorkerError | undefined> } | null = null;

async function runIqReport(input: LoadIqInput, generation: number, refresh: boolean): Promise<IqReport | IqWorkerError | undefined> {
  const client = input.workerClient || createIqWorkerClient({
    apiBaseUrl: input.apiGatewayUrl, retryIntervalMs: input.retryIntervalMs, retryLimit: input.retryLimit,
    onRetry: attempt => {
      if (iqStoreApi.getState().generation === generation && iqStoreApi.getState().activeSession === input.session) {
        iqStoreApi.getState().setRetryAttempt(attempt);
      }
    },
  });
  iqStoreApi.getState().setLoading(input.session, refresh);
  try {
    const etag = refresh ? null : await requestResource({ resource: "metadata_etag" }, input.session) ?? "";
    if (iqStoreApi.getState().generation !== generation || iqStoreApi.getState().activeSession !== input.session) return;
    const { report, metadataEtag } = await client.loadReport(input.authToken, input.session, etag);
    if (iqStoreApi.getState().generation !== generation || iqStoreApi.getState().activeSession !== input.session) return;
    iqStoreApi.getState().setLoaded(input.session, report, metadataEtag);
    return report;
  } catch (error) {
    if (iqStoreApi.getState().generation !== generation || iqStoreApi.getState().activeSession !== input.session) return;
    const workerError = toIqError(error);
    iqStoreApi.getState().setError(workerError);
    return workerError;
  }
}

async function requestIqReport(input: LoadIqInput, refresh: boolean): Promise<void> {
  const generation = iqStoreApi.getState().generation;
  let active = activeLoad?.session === input.session ? activeLoad : null;
  if (active && (active.generation !== generation || iqStoreApi.getState().activeSession !== input.session)) active = null;
  const load = active && !refresh ? active.load : active ? active.load.then(() => {
    if (iqStoreApi.getState().generation === generation && iqStoreApi.getState().activeSession === input.session) {
      return runIqReport(input, generation, refresh);
    }
  }) : runIqReport(input, generation, refresh);

  activeLoad = { session: input.session, generation, load };
  try {
    const result = await load;
    if (!result || iqStoreApi.getState().generation !== generation || iqStoreApi.getState().activeSession !== input.session) return;
    if ("error" in result) input.onError(result);
    else input.onComplete?.(result);
  } finally {
    if (activeLoad?.load === load) activeLoad = null;
  }
}

export function loadIqReport(input: LoadIqInput): Promise<void> {
  return requestIqReport(input, false);
}

export function refreshIqReport(input: LoadIqInput): Promise<void> {
  return requestIqReport(input, true);
}
