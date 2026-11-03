import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../hook/useIqReport", () => ({ useIqReport: () => ({ report: {}, status: "success", ackGate: vi.fn(), ackingCodes: new Set(), view: {
  iq: { decision: "Healthy summary", value: 90 }, segments: [], gates: { items: [], total: 0, success: 0, ratio: 0, displayPercent: 0, bucket: "green", decision: "Pass" }, explanations: [],
} }) }));
vi.mock("../component/IqSegments", () => ({ IqSegments: () => { throw new Error("Segments failed"); } }));
vi.mock("../component/IqSummary", () => ({ IqSummary: () => <output>Healthy summary</output> }));
import { IqPanel } from "../component/IqPanel";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("contains IQ segment rendering without removing the summary or gates", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(<IqPanel apiGatewayUrl="url" authToken="token" session="session" callbacks={{}} retryLimit={1} retryIntervalMs={0} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Segments failed");
  expect(screen.getByText("Healthy summary")).toBeVisible();
});
