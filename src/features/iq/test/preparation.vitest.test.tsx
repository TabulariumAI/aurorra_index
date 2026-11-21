import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { prepareIqReport } from "../data/iqData";
import type { IqReport } from "../type/iq.types";

const state = vi.hoisted(() => ({ report: {} as IqReport }));
vi.mock("../hook/useIqReport", () => ({ useIqReport: () => ({ report: state.report, status: "success", ackGate: vi.fn(), view: prepareIqReport(state.report) }) }));
import { IqPanel } from "../component/IqPanel";

const report: IqReport = { iq_doc: 90, gates: [], segments: [], notes: [{ segment: null, message: "Healthy notes" }] };
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it.each(["iq_doc", "gates", "segments", "notes"])("contains %s projection errors and preserves independent IQ sections", field => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  state.report = { ...report };
  Object.defineProperty(state.report, field, { get() { throw new Error(`${field} preparation failed`); } });
  const props = { apiGatewayUrl: "url", authToken: "token", session: "session", callbacks: {}, retryLimit: 1, retryIntervalMs: 0 };
  const view = render(<IqPanel  {...props} />);
  fireEvent.click(screen.getByRole("tab", { name: field === "gates" ? "Compliance" : field === "notes" ? "Notes" : "Quality" }));
  expect(screen.getByRole("alert")).toHaveTextContent(`${field} preparation failed`);
  if (field !== "iq_doc") expect(screen.getByText("90%")).toBeInTheDocument();
  if (field !== "gates") expect(screen.getByText("out of 0 gates")).toBeInTheDocument();
  if (field !== "segments") expect(screen.getByRole("table", { hidden: true })).toBeInTheDocument();
  if (field !== "notes") expect(screen.getByText("Healthy notes")).toBeInTheDocument();
  state.report = { ...report };
  view.rerender(<IqPanel  {...props} />);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText("Healthy notes")).toBeInTheDocument();
});
