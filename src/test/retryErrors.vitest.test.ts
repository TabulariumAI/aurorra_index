import { expect, it, vi } from "vitest";
import { toIqError } from "../features/iq/data/iqData";
import { toViewerError } from "../features/imageviewer/data/imageViewerData";
import { loadAuditReport } from "../features/audit/data/loadAuditReport";
import { auditStoreApi } from "../features/audit/store/auditStore";

it.each([429, 503])("retains %s retry availability through IQ, Audit and image error normalization", async status => {
  const failure = { status, retryAfter: "30", retryAt: 123456, error: "Unavailable. Retry after 12:00." };
  expect.soft(toIqError(failure)).toMatchObject(failure);
  expect.soft(toViewerError(failure, "Image failed.")).toMatchObject(failure);
  auditStoreApi.getState().resetAudit();
  const loadReport = vi.fn().mockRejectedValue(failure);
  await expect.soft(loadAuditReport({ authToken: "token", session: "session", background: false, workerClient: { loadReport } })).resolves.toMatchObject(failure);
  expect(auditStoreApi.getState().error).toMatchObject(failure);
  expect(loadReport).toHaveBeenCalledOnce();
  auditStoreApi.getState().resetAudit();
});
