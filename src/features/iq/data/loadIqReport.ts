import { iqStoreApi } from "../store/iqStore";
import type { LoadIqInput } from "../type/iq.types";
import { createIqWorkerClient } from "../worker/iqWorkerClient";
import { toIqError } from "./iqData";

const DEFAULT_POLL_INTERVAL_MS = 1500;
const activeLoads = new Map<string, Promise<void>>();

export async function loadIqReport(input: LoadIqInput): Promise<void> {
  const activeLoad = activeLoads.get(input.session);
  if (activeLoad) return activeLoad;

  const state = iqStoreApi.getState();
  if (state.activeSession === input.session && state.report !== null && state.status === "success") return;

  const load = (async () => {
    const client = input.workerClient || createIqWorkerClient({ apiBaseUrl: input.apiGatewayUrl });
    iqStoreApi.getState().setLoading(input.session);
    const startJobId = crypto.randomUUID();
    input.onJobEvent({ job: "iq.start", jobId: startJobId, message: "Starting IQ report", phase: "started", session: input.session });
    try {
      await client.startReport(input.authToken, input.session);
      input.onJobEvent({ job: "iq.start", jobId: startJobId, message: "IQ report started", phase: "completed", session: input.session });
    } catch (error) {
      const workerError = toIqError(error);
      input.onJobEvent({ error: workerError.error, job: "iq.start", jobId: startJobId, message: "IQ report start failed", phase: "failed", session: input.session });
      iqStoreApi.getState().setError(workerError);
      input.onError(workerError);
      return;
    }
    const pollJobId = crypto.randomUUID();
    input.onJobEvent({ job: "iq.poll", jobId: pollJobId, message: "Checking IQ report status", phase: "started", session: input.session });
    try {
      let current = await client.pollReport(input.authToken, input.session);
      while (!current.isComplete) {
        await new Promise((resolve) => setTimeout(resolve, input.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS));
        current = await client.pollReport(input.authToken, input.session);
      }
      input.onJobEvent({ job: "iq.poll", jobId: pollJobId, message: "IQ report completed", phase: "completed", session: input.session });
      iqStoreApi.getState().setLoaded(input.session, current.data);
    } catch (error) {
      const workerError = toIqError(error);
      input.onJobEvent({ error: workerError.error, job: "iq.poll", jobId: pollJobId, message: "IQ report generation failed", phase: "failed", session: input.session });
      iqStoreApi.getState().setError(workerError);
      input.onError(workerError);
    }
  })();

  activeLoads.set(input.session, load);
  try {
    await load;
  } finally {
    activeLoads.delete(input.session);
  }
}
