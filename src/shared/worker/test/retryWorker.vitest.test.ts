import { expect, it, vi } from "vitest";
import { retryWorker } from "../retryWorker";

it("keeps IQ retry cadence unchanged when a service failure includes Retry-After", async () => {
  vi.useFakeTimers();
  try {
    const request = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error("Service unavailable"), { status: 503, retryAfter: "30" }))
      .mockResolvedValueOnce("loaded");
    const result = retryWorker(request, 500, 3);
    await vi.advanceTimersByTimeAsync(499);
    expect(request).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBe("loaded");
    expect(request).toHaveBeenCalledTimes(2);
  } finally { vi.useRealTimers(); }
});

it("does not serialize independent IQ loads or introduce a retry for 429", async () => {
  const error = Object.assign(new Error("Too many requests"), { status: 429, retryAfter: "30" });
  const request = vi.fn().mockRejectedValue(error);
  const results = await Promise.allSettled(Array.from({ length: 32 }, () => retryWorker(request, 500, 3)));
  expect(request).toHaveBeenCalledTimes(32);
  expect(results.every(result => result.status === "rejected" && result.reason === error)).toBe(true);
});

it("does not retry runtime events even when their message describes connectivity", async () => {
  const event = new ErrorEvent("error", { message: "Failed to fetch network module" });
  const request = vi.fn(async () => { throw event; });
  await expect(retryWorker(request, 0, 3)).rejects.toBe(event);
  expect(request).toHaveBeenCalledOnce();
});

it("retries connectivity failures through the configured limit before exposing one exhausted failure", async () => {
  const request = vi.fn(async () => {
    throw new Error("Failed to fetch");
  });

  await expect(retryWorker(request, 0, 5)).rejects.toMatchObject({
    code: "connectivity_exhausted",
    message: "Failed to fetch",
  });

  expect(request).toHaveBeenCalledTimes(5);
});

it("reports the configured retry attempt before each subsequent request", async () => {
  const request = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(new Error("Failed to fetch"))
    .mockResolvedValueOnce("loaded");
  const onRetry = vi.fn();

  await expect(retryWorker(request, 0, 5, onRetry)).resolves.toBe("loaded");

  expect(onRetry).toHaveBeenCalledTimes(1);
  expect(onRetry).toHaveBeenCalledWith(2);
});

it("does not retry non-connectivity failures", async () => {
  const error = Object.assign(new Error("Missing metadata"), { status: 404 });
  const request = vi.fn(async () => {
    throw error;
  });

  await expect(retryWorker(request, 0, 5)).rejects.toBe(error);

  expect(request).toHaveBeenCalledTimes(1);
});

it("retries service-unavailable responses represented by worker errors", async () => {
  const request = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(Object.assign(new Error("Service unavailable"), { status: 503 }))
    .mockResolvedValueOnce("loaded");

  await expect(retryWorker(request, 0, 5)).resolves.toBe("loaded");

  expect(request).toHaveBeenCalledTimes(2);
});
