import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { splitMetadataJSON } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { queueStoreApi } from "../store/queueStore";
import { QueueActions } from "../component/QueueActions";
beforeEach(() => { queueStoreApi.getState().reset(); storeApi.getState().resetAllState(); });
afterEach(cleanup);
it("provides recovery only for its item and keeps other sessions unchanged", async () => {
  const client = { confirmIndex: vi.fn(async () => { throw new Error("Confirm failed"); }), indexData: vi.fn(), dropIndex: vi.fn(), patchIndex: vi.fn(), patchStatus: vi.fn(), reprocessSegment: vi.fn(), pagesData: vi.fn(), updatePageSegments: vi.fn() };
  for (const session of ["session-1", "session-2"]) {
    storeApi.getState().setJSON(session, splitMetadataJSON({ indexes: [{ code: session, value: session }] }));
    await queueStoreApi.getState().enqueue({ batch: "batch-1", session, segment: "party", action: "confirm", code: session }, { onChange: vi.fn(), authToken: "token", intervalMs: 0, client });
  }
  await waitFor(() => expect(queueStoreApi.getState().tasks.every((task) => task.status === "failed")).toBe(true));
  const task = queueStoreApi.getState().tasks[0];
  render(<QueueActions id={task.id} code="session-1" />);
  expect(screen.getByRole("alert")).toHaveTextContent("Confirm failed");
  expect(screen.getByRole("button", { name: "Retry change" })).toHaveTextContent("Retry");
  expect(screen.getByRole("button", { name: "Retry change" })).toHaveAttribute("data-flat", "true");
  expect(screen.getByRole("button", { name: "Cancel change" })).toHaveTextContent("Cancel");
  expect(screen.getByRole("button", { name: "Cancel change" })).toHaveAttribute("data-flat", "true");
  expect(screen.queryByText("Confirm: session-2")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Retry change" }));
  await waitFor(() => expect(client.confirmIndex).toHaveBeenCalledTimes(3));
  await waitFor(() => expect(screen.getByRole("button", { name: "Cancel change" })).toBeVisible());
  fireEvent.click(screen.getByRole("button", { name: "Cancel change" }));
  expect(screen.queryByRole("button", { name: "Retry change" })).toBeNull();
  expect(queueStoreApi.getState().tasks).toHaveLength(1);
});

it("opens the complete error in a dismissible callout without retrying or canceling", async () => {
  const error = "Internal server error: " + "The service could not complete this change. ".repeat(12);
  const client = { confirmIndex: vi.fn(async () => { throw new Error(error); }), indexData: vi.fn(), dropIndex: vi.fn(), patchIndex: vi.fn(), patchStatus: vi.fn(), reprocessSegment: vi.fn(), pagesData: vi.fn(), updatePageSegments: vi.fn() };
  storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [{ code: "item", value: "Value" }] }));
  await queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "party", action: "confirm", code: "item" }, { onChange: vi.fn(), authToken: "token", intervalMs: 0, client });
  await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
  const task = queueStoreApi.getState().tasks[0];
  render(<QueueActions id={task.id} code="item" />);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("alert")).toHaveTextContent(error.trim());
  expect(screen.getByRole("alert")).toHaveStyle({ clipPath: "inset(50%)" });
  const info = screen.getByRole("button", { name: "Error details" });
  fireEvent.click(info);
  expect(await screen.findByRole("dialog", { name: "Error details" })).toHaveTextContent(error.trim());
  expect(screen.getByRole("dialog")).toHaveTextContent("The request could not be completed. Please retry.");
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(client.confirmIndex).toHaveBeenCalledTimes(1);
  expect(queueStoreApi.getState().tasks[0]).toMatchObject({ id: task.id, status: "failed" });
  fireEvent.click(info);
  await screen.findByRole("dialog");
  act(() => queueStoreApi.setState({ tasks: [] }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("retains task retry but offers cancel only for unfinished changes", async () => {
  const client = { confirmIndex: vi.fn(async () => { throw new Error("Failed"); }), indexData: vi.fn(), dropIndex: vi.fn(), patchIndex: vi.fn(), patchStatus: vi.fn(), reprocessSegment: vi.fn(), pagesData: vi.fn(), updatePageSegments: vi.fn() };
  storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [{ code: "item", value: "Value" }] }));
  await queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "party", action: "confirm", code: "item" }, { onChange: vi.fn(), authToken: "token", intervalMs: 0, client });
  await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
  const task = queueStoreApi.getState().tasks[0];
  const view = render(<QueueActions id={task.id} code="completed-item" />);
  expect(screen.getByRole("button", { name: "Retry change" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "Cancel change" })).toBeNull();
  act(() => queueStoreApi.setState({ tasks: [{ ...task, error: null }] }));
  expect(screen.queryByRole("button", { name: "Error details" })).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
  view.rerender(<QueueActions id="missing" />);
  expect(screen.queryByRole("button")).toBeNull();
});

it("hides recovery for queued and processing items", async () => {
  const client = { confirmIndex: vi.fn(() => new Promise<never>(() => {})), indexData: vi.fn(), dropIndex: vi.fn(), patchIndex: vi.fn(), patchStatus: vi.fn(), reprocessSegment: vi.fn(), pagesData: vi.fn(), updatePageSegments: vi.fn() };
  for (const code of ["first", "second"]) {
    storeApi.getState().setJSON(code, splitMetadataJSON({ indexes: [{ code, value: code }] }));
    await queueStoreApi.getState().enqueue({ batch: "batch", session: code, segment: "party", action: "confirm", code }, { onChange: vi.fn(), authToken: "token", intervalMs: 0, client });
  }
  const [processing, queued] = queueStoreApi.getState().tasks;
  const view = render(<><QueueActions id={processing.id} code="first" /><QueueActions id={queued.id} code="second" /></>);
  expect(screen.queryByRole("button")).toBeNull();
  act(() => { queueStoreApi.setState({ tasks: [{ ...queued, status: "failed", error: "Failed" }] }); });
  expect(screen.getByRole("button", { name: "Retry change" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel change" })).toBeVisible();
  view.unmount();
});
