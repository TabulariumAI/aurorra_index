import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { IqView } from "../component/IqView";
import { prepareIqReport } from "../data/iqData";

afterEach(cleanup);
it.each([[100, "100%"], [0, "0%"], [83.6, "84%"]])("renders segment IQ %s as %s", (iq, display) => {
  const view = prepareIqReport({ segments: [
    { segment_name: "party", expected_weight: 6, actual_weight: 5, iq, explanations: [] },
  ] });
  render(<IqView view={view} ackingCodes={new Set()} onAck={vi.fn()} />);
  expect(screen.getByRole("cell", { name: display })).toBeVisible();
  expect(screen.getByRole("cell", { name: "6.00" })).toBeVisible();
  expect(screen.getByRole("cell", { name: "5.00" })).toBeVisible();
});

it("contains one segment's explanation failure without losing other segment rows or explanations", () => {
  const view = prepareIqReport({ segments: [
    { segment_name: "party", expected_weight: 2, actual_weight: 1, iq: 50, explanations: [] },
    { segment_name: "reference", expected_weight: 1, actual_weight: 1, iq: 100, explanations: ["Healthy notes"] },
  ] });
  view.segments.data![0].explanations = { data: null, error: "Party explanation failed" };
  render(<IqView view={view} ackingCodes={new Set()} onAck={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Party error" })).toBeVisible();
  expect(screen.getByRole("cell", { name: "Party" })).toBeVisible();
  expect(screen.getByRole("cell", { name: "Reference" })).toBeVisible();
  expect(screen.getByText("Healthy notes")).toBeVisible();
});
