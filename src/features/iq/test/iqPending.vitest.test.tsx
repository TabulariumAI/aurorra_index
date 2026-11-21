import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { IqPanel } from "../component/IqPanel";
import { iqQueueStore } from "../store/iqQueueStore";
import { iqStoreApi } from "../store/iqStore";
import type { IqResource, IqWorkerClient } from "../type/iq.types";

const resource: IqResource = { report: { iq_doc: 90, notes: [{ segment: null, message: "Report note" }], gates: [
  { code: "gate", status: "FAIL", description: "Missing signature" },
  { code: "other-gate", status: "WARNING", description: "Check signature" },
],
  segments: [{ segment_name: "party", expected_weight: 10, actual_weight: 9, iq: 90, explanations: [],
    cues: [{ code: "cue", aspect: "person", description: "Missing person" },
      { code: "other-cue", aspect: "address", description: "Missing address" }] }] } };

beforeEach(() => { Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() }); });

afterEach(() => { delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView; cleanup(); iqQueueStore.getState().reset(); iqStoreApi.getState().resetIq(); localStorage.clear(); });

it.each(["cues", "gates"] as const)("limits the %s overlay to the acknowledged item without automatically loading the report", async kind => {
  let submit!: () => void;
  const posted = new Promise<void>(resolve => { submit = resolve; });
  const ack = vi.fn(async () => { await posted; return { status: "completed", etag: "inputs-after", isComplete: true as const, data: {} }; });
  const client: IqWorkerClient = { ackGate: ack, ackCue: ack,
    loadReport: vi.fn().mockResolvedValue(resource) };
  const { container } = render(<IqPanel apiGatewayUrl="x" authToken="token" session="s" retryIntervalMs={1000} retryLimit={0} callbacks={{}} workerClient={client} />);
  await screen.findAllByText("90%");
  if (kind === "gates") fireEvent.click(screen.getByRole("tab", { name: "Compliance" }));
  fireEvent.click(screen.getAllByRole("button", { name: kind === "cues" ? "Dismiss cue" : "Clear gate" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  const progress = await screen.findByRole("progressbar", { name: "Processing acknowledgment" });
  const row = container.querySelector(`[data-${kind === "cues" ? "cue" : "gate"}-code='${kind === "cues" ? "cue" : "gate"}']`)!;
  const other = container.querySelector(`[data-${kind === "cues" ? "cue" : "gate"}-code='other-${kind === "cues" ? "cue" : "gate"}']`)!;
  expect(row).toContainElement(progress);
  expect(row).toHaveAttribute("aria-busy", "true");
  expect(progress.closest("[inert]")).toBeNull();
  expect(screen.getByRole("tab", { name: "Quality" }).closest("[inert]")).toBeNull();
  expect(screen.getByRole("region", { name: "Indexing Quality" })).not.toHaveAttribute("aria-busy", "true");
  expect(within(other as HTMLElement).getByRole("button")).toBeEnabled();
  expect(other.closest("[inert]")).toBeNull();
  expect(other.querySelector("[inert]")).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: kind === "cues" ? "Compliance" : "Quality" }));
  expect(screen.getAllByRole("button", { name: kind === "cues" ? "Clear gate" : "Dismiss cue" })[0]).toBeEnabled();
  fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
  expect(screen.getByText("Report note")).toBeVisible();
  expect(ack).toHaveBeenCalledOnce();
  await act(async () => submit());
  await waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(client.loadReport).toHaveBeenCalledOnce();
  expect(screen.queryByText("LOADING IQ REPORT")).toBeNull();
  expect(container.querySelector(`[data-${kind === "cues" ? "cue" : "gate"}-code='${kind === "cues" ? "cue" : "gate"}']`)).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "Quality" }));
  expect(screen.getAllByText("90%")[0]).toBeVisible();
  expect(screen.queryByRole("progressbar", { name: "Processing acknowledgment" })).toBeNull();
  expect(iqQueueStore.getState().tasks).toEqual([]);
});

it.each(["cues", "gates"] as const)("keeps failed %s recovery inside its item and leaves other items usable", async kind => {
  const ack = vi.fn().mockResolvedValue({ status: "completed", etag: "inputs-after", isComplete: true, data: {} });
  const loadReport = vi.fn().mockResolvedValueOnce(resource);
  ack.mockRejectedValueOnce(new Error("Offline"));
  loadReport.mockResolvedValue({ report: { ...resource.report, iq_doc: 100 } });
  const client: IqWorkerClient = { ackCue: ack, ackGate: ack,
    loadReport };
  const onIqError = vi.fn();
  const { container } = render(<IqPanel apiGatewayUrl="x" authToken="token" session="s" retryIntervalMs={1} retryLimit={0} callbacks={{ onIqError }} workerClient={client} />);
  await screen.findAllByText("90%");
  fireEvent.click(screen.getByRole("tab", { name: kind === "cues" ? "Quality" : "Compliance" }));
  fireEvent.click(screen.getAllByRole("button", { name: kind === "cues" ? "Dismiss cue" : "Clear gate" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  const retry = await screen.findByRole("button", { name: "Retry change" });
  const row = container.querySelector(`[data-${kind === "cues" ? "cue" : "gate"}-code='${kind === "cues" ? "cue" : "gate"}']`)!;
  expect(row).toContainElement(retry);
  expect(row).toContainElement(screen.getByRole("button", { name: "Cancel change" }));
  expect(retry.closest("[inert]")).toBeNull();
  expect(screen.queryByRole("progressbar", { name: "Processing acknowledgment" })).toBeNull();
  expect(screen.getByRole("button", { name: kind === "cues" ? "Dismiss cue" : "Clear gate" })).toBeEnabled();
  fireEvent.click(retry);
  await waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(loadReport).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("tab", { name: "Quality" }));
  expect(screen.getAllByText("90%")[0]).toBeVisible();
  expect(onIqError).not.toHaveBeenCalled();
  expect(ack).toHaveBeenCalledTimes(2);
});

it.each(["cues", "gates"] as const)("cancels failed %s work from its row without removing the finding", async kind => {
  const ack = vi.fn().mockRejectedValue(new Error("Offline"));
  const client: IqWorkerClient = { ackCue: ack, ackGate: ack, loadReport: vi.fn().mockResolvedValue(resource) };
  const { container } = render(<IqPanel apiGatewayUrl="x" authToken="token" session="s" retryIntervalMs={1} retryLimit={0} callbacks={{}} workerClient={client} />);
  await screen.findAllByText("90%");
  fireEvent.click(screen.getByRole("tab", { name: kind === "cues" ? "Quality" : "Compliance" }));
  fireEvent.click(screen.getAllByRole("button", { name: kind === "cues" ? "Dismiss cue" : "Clear gate" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  fireEvent.click(await screen.findByRole("button", { name: "Cancel change" }));
  expect(iqQueueStore.getState().tasks).toEqual([]);
  const rows = container.querySelectorAll(kind === "cues" ? "[data-cue-code]" : "[data-gate-code]");
  expect(rows).toHaveLength(2);
  for (const row of rows) {
    expect(row.querySelector("[inert]")).toBeNull();
    expect(within(row as HTMLElement).getByRole("button")).toBeEnabled();
  }
  expect(screen.queryByRole("button", { name: "Retry change" })).toBeNull();
  expect(ack).toHaveBeenCalledOnce();
});

it.each(["cues", "gates"] as const)("lets another %s item join the existing queue while one submission is pending", async kind => {
  const ack = vi.fn(() => new Promise<never>(() => {}));
  const client: IqWorkerClient = { ackCue: ack, ackGate: ack, loadReport: vi.fn().mockResolvedValue(resource) };
  const { container } = render(<IqPanel apiGatewayUrl="x" authToken="token" session="s" retryIntervalMs={1} retryLimit={0} callbacks={{}} workerClient={client} />);
  await screen.findAllByText("90%");
  fireEvent.click(screen.getByRole("tab", { name: kind === "cues" ? "Quality" : "Compliance" }));
  const buttons = screen.getAllByRole("button", { name: kind === "cues" ? "Dismiss cue" : "Clear gate" });
  for (const button of buttons) {
    expect(button.closest("[inert]")).toBeNull();
    fireEvent.click(button);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  }
  expect(ack).toHaveBeenCalledOnce();
  expect(iqQueueStore.getState().tasks.map(task => task.status)).toEqual(["processing", "queued"]);
  const progress = screen.getAllByRole("progressbar", { name: "Processing acknowledgment" });
  expect(progress).toHaveLength(2);
  for (const item of progress) expect(item.closest(`[data-${kind === "cues" ? "cue" : "gate"}-code]`)).not.toBeNull();
  expect(container.querySelector("section[inert]")).toBeNull();
});

it.each(["cues", "gates"] as const)("does not show another session's %s overlay on the same finding code", async kind => {
  const ack = vi.fn(() => new Promise<never>(() => {}));
  const client: IqWorkerClient = { ackCue: ack, ackGate: ack, loadReport: vi.fn().mockResolvedValue(resource) };
  const props = { apiGatewayUrl: "x", authToken: "token", retryIntervalMs: 1, retryLimit: 0, callbacks: {}, workerClient: client };
  const view = render(<IqPanel {...props} session="s" />);
  await screen.findAllByText("90%");
  fireEvent.click(screen.getByRole("tab", { name: kind === "cues" ? "Quality" : "Compliance" }));
  fireEvent.click(screen.getAllByRole("button", { name: kind === "cues" ? "Dismiss cue" : "Clear gate" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  view.rerender(<IqPanel {...props} session="other" />);
  await waitFor(() => expect(iqStoreApi.getState()).toMatchObject({ activeSession: "other", status: "success" }));
  expect(screen.queryByRole("progressbar", { name: "Processing acknowledgment" })).toBeNull();
  expect(screen.getAllByRole("button", { name: kind === "cues" ? "Dismiss cue" : "Clear gate" })[0]).toBeEnabled();
});
