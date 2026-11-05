import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { prepareIqReport } from "../data/iqData";
import type { IqReport } from "../type/iq.types";

const state = vi.hoisted(() => ({ report: {} as IqReport }));
vi.mock("../hook/useIqReport", () => ({ useIqReport: () => ({ report: state.report, status: "success", ackGate: vi.fn(), ackingCodes: new Set(), view: prepareIqReport(state.report) }) }));
import { IqPanel } from "../component/IqPanel";

const report: IqReport = { iq_doc: 90, decision: "Pass", gates: [], segments: [], explanation: ["Healthy notes"] };
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it.each(["iq_doc", "gates", "segments", "explanation"])("contains %s projection errors and preserves independent IQ sections", field => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  state.report = { ...report };
  Object.defineProperty(state.report, field, { get() { throw new Error(`${field} preparation failed`); } });
  const props = { apiGatewayUrl: "url", authToken: "token", session: "session", callbacks: {}, retryLimit: 1, retryIntervalMs: 0 };
  const view = render(<IqPanel  {...props} />);
  expect(screen.getByRole("alert")).toHaveTextContent(`${field} preparation failed`);
  if (field !== "iq_doc") expect(screen.getByText("90%")).toBeVisible();
  if (field !== "gates") expect(screen.getByText("Compliance Gates (0)")).toBeVisible();
  if (field !== "segments") expect(screen.getByText("Indexing Segments (0)")).toBeVisible();
  if (field !== "explanation") expect(screen.getByText("Healthy notes")).toBeVisible();
  state.report = { ...report };
  view.rerender(<IqPanel  {...props} />);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText("Healthy notes")).toBeVisible();
});
