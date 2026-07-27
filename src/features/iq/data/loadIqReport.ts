import { iqStoreApi } from "../store/iqStore";
import type { LoadIqInput } from "../type/iq.types";
import { createIqWorkerClient } from "../worker/iqWorkerClient";
import { toIqError } from "./iqData";

const DEFAULT_POLL_INTERVAL_MS = 1500;
const activeLoads = new Map<string, Promise<void>>();

async function runIqReport(input: LoadIqInput): Promise<void> {
  const client = input.workerClient || createIqWorkerClient({ apiBaseUrl: input.apiGatewayUrl });
  iqStoreApi.getState().setLoading(input.session);
  const startJobId = crypto.randomUUID();
  input.onJobEvent({ jobId: startJobId, message: "Starting IQ report", phase: "started", session: input.session });
  try {
    await client.startReport(input.authToken, input.session);
    input.onJobEvent({ jobId: startJobId, message: "IQ report started", phase: "completed", session: input.session });
  } catch (error) {
    const workerError = toIqError(error);
    input.onJobEvent({ error: workerError.error, jobId: startJobId, message: "IQ report start failed", phase: "failed", session: input.session });
    iqStoreApi.getState().setError(workerError);
    input.onError(workerError);
    return;
  }
  const pollJobId = crypto.randomUUID();
  input.onJobEvent({ jobId: pollJobId, message: "Checking IQ report status", phase: "started", session: input.session });
  try {
    let current = await client.pollReport(input.authToken, input.session);
    while (!current.isComplete) {
      await new Promise((resolve) => setTimeout(resolve, input.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS));
      current = await client.pollReport(input.authToken, input.session);
    }
    input.onJobEvent({ jobId: pollJobId, message: "IQ report completed", phase: "completed", session: input.session });
    iqStoreApi.getState().setLoaded(input.session, current.data);
  } catch (error) {
    const workerError = toIqError(error);
    input.onJobEvent({ error: workerError.error, jobId: pollJobId, message: "IQ report generation failed", phase: "failed", session: input.session });
    iqStoreApi.getState().setError(workerError);
    input.onError(workerError);
  }
}

export async function loadIqReport(input: LoadIqInput): Promise<void> {
  const activeLoad = activeLoads.get(input.session);
  if (activeLoad && !input.restart) return activeLoad;

  const state = iqStoreApi.getState();
  if (!input.restart && state.activeSession === input.session && state.report !== null && state.status === "success") return;

  const load = activeLoad ? activeLoad.then(() => runIqReport(input)) : runIqReport(input);

  activeLoads.set(input.session, load);
  try {
    await load;
  } finally {
    if (activeLoads.get(input.session) === load) {
      activeLoads.delete(input.session);
    }
  }
}
