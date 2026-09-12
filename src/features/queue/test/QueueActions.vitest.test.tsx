import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { splitMetadataJSON } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { queueStoreApi } from "../store/queueStore";
import { QueueActions } from "../component/QueueActions";
beforeEach(() => { queueStoreApi.getState().reset(); storeApi.getState().resetAllState(); });
afterEach(cleanup);
it("provides recovery only for its item and keeps other sessions unchanged", async () => {
  const client = { confirmIndex: vi.fn(async () => { throw new Error("Confirm failed"); }), indexData: vi.fn(), dropIndex: vi.fn(), patchIndex: vi.fn(), patchStatus: vi.fn(), reprocessSegment: vi.fn(), updatePageSegments: vi.fn() };
  for (const session of ["session-1", "session-2"]) {
    storeApi.getState().setJSON(session, splitMetadataJSON({ indexes: [{ code: session, value: session }] }));
    await queueStoreApi.getState().enqueue({ batch: "batch-1", session, segment: "party", action: "confirm", code: session }, { authToken: "token", intervalMs: 0, client });
  }
  await waitFor(() => expect(queueStoreApi.getState().tasks.every((task) => task.status === "failed")).toBe(true));
  const task = queueStoreApi.getState().tasks[0];
  render(<QueueActions id={task.id} code="session-1" />);
  expect(screen.getByRole("alert")).toHaveTextContent("Confirm failed");
  expect(screen.getByRole("button", { name: "Retry change" })).toHaveStyle({ height: "1.75rem" });
  expect(screen.queryByText("Confirm: session-2")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Retry change" }));
  await waitFor(() => expect(client.confirmIndex).toHaveBeenCalledTimes(3));
  await waitFor(() => expect(screen.getByRole("button", { name: "Cancel change" })).toBeVisible());
  fireEvent.click(screen.getByRole("button", { name: "Cancel change" }));
  expect(screen.queryByRole("button", { name: "Retry change" })).toBeNull();
  expect(queueStoreApi.getState().tasks).toHaveLength(1);
});

it("hides recovery for queued and processing items", async () => {
  const client = { confirmIndex: vi.fn(() => new Promise<never>(() => {})), indexData: vi.fn(), dropIndex: vi.fn(), patchIndex: vi.fn(), patchStatus: vi.fn(), reprocessSegment: vi.fn(), updatePageSegments: vi.fn() };
  for (const code of ["first", "second"]) {
    storeApi.getState().setJSON(code, splitMetadataJSON({ indexes: [{ code, value: code }] }));
    await queueStoreApi.getState().enqueue({ batch: "batch", session: code, segment: "party", action: "confirm", code }, { authToken: "token", intervalMs: 0, client });
  }
  const [processing, queued] = queueStoreApi.getState().tasks;
  const view = render(<><QueueActions id={processing.id} code="first" /><QueueActions id={queued.id} code="second" /></>);
  expect(screen.queryByRole("button")).toBeNull();
  act(() => { queueStoreApi.setState({ tasks: [{ ...queued, status: "failed", error: "Failed" }] }); });
  expect(screen.getByRole("button", { name: "Retry change" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel change" })).toBeVisible();
  view.unmount();
});
