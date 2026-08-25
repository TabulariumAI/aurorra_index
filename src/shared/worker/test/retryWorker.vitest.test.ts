import { expect, it, vi } from "vitest";
import { retryWorker } from "../retryWorker";

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
