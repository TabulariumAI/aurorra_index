import { syncUsage } from "../storage/usageStorage";
import type { UsageCommand, UsageResult } from "../type/usage.types";

self.onmessage = async (event: MessageEvent<UsageCommand>) => {
  const { owner, services, now } = event.data;
  let result: UsageResult;
  try { result = { ok: true, data: await syncUsage(owner, services, now) }; }
  catch (error) { result = { ok: false, error: (error as Error).message }; }
  self.postMessage(result);
};
