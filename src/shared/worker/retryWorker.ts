type RetryError = Error & {
  code?: string;
  details?: unknown;
  status?: number;
};

function retryable(error: unknown): boolean {
  const value = error as { error?: unknown; message?: unknown; name?: unknown; status?: unknown };
  if (value?.name === "AbortError") return false;
  if (value?.status === 502 || value?.status === 503 || value?.status === 504) return true;
  const message = String(value?.error ?? value?.message ?? "").toLowerCase();
  return message.includes("failed to fetch") || message.includes("network") || message.includes("connection") || message.includes("timeout");
}

function exhausted(error: unknown): RetryError {
  const value = error as { details?: unknown; message?: unknown; status?: unknown };
  const failure = new Error(String(value?.message ?? error)) as RetryError;
  failure.code = "connectivity_exhausted";
  failure.details = value?.details;
  failure.status = typeof value?.status === "number" ? value.status : undefined;
  return failure;
}

export async function retryWorker<T>(request: () => Promise<T>, retryIntervalMs: number, retryLimit: number, onRetry?: (attempt: number) => void): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      if (!retryable(error)) throw error;
      if (attempt === retryLimit) throw exhausted(error);
      onRetry?.(attempt + 1);
      await new Promise<void>((resolve) => setTimeout(resolve, retryIntervalMs));
    }
  }
}
