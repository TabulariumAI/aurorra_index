import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { IqView } from "../component/IqView";
import { prepareIqReport } from "../data/iqData";
import type { IqReportView } from "../type/iq.types";

afterEach(cleanup);

it("renders prepared values and order without sorting, relabeling, or deriving clear eligibility", () => {
  const prepared = prepareIqReport({
    iq_doc: 90,
    gates: [{ code: "pass", status: "PASS", description: "Prepared requirement" }],
    segments: [
      { segment_name: "party", expected_weight: 1, actual_weight: 1, iq: 100, explanations: [] },
      { segment_name: "sides", expected_weight: 2, actual_weight: 2, iq: 100, explanations: [] },
    ],
  });
  const view: IqReportView = {
    ...prepared,
    segments: { data: [...prepared.segments.data!].reverse(), error: null },
    gates: { data: { ...prepared.gates.data!, displayPercent: 42, total: 7, items: [{ ...prepared.gates.data!.items[0], label: "Prepared label", clearable: true }] }, error: null },
  };
  render(<IqView view={view} ackingCodes={new Set()} onAck={vi.fn()} />);
  expect(screen.getByText("42%")).toBeVisible();
  expect(screen.getByText("out of 7 gates")).toBeVisible();
  expect(screen.getByText("Prepared label")).toBeVisible();
  expect(screen.getByRole("button", { name: "Clear gate" })).toBeEnabled();
  expect(within(screen.getByRole("table")).getAllByRole("row").slice(1).map(row => within(row).getAllByRole("cell")[0].textContent)).toEqual(["Party", "Sides"]);
});

it("renders INFO descriptions only in Notes alongside existing notes", () => {
  const view = prepareIqReport({
    gates: [
      { code: "pass", status: "PASS", description: "Passed requirement" },
      { code: "info", status: "INFO", description: "Missing address" },
    ],
    explanation: ["Existing note"],
  });
  render(<IqView view={view} ackingCodes={new Set()} onAck={vi.fn()} />);
  expect(screen.getByText("Compliance Gates (1)")).toBeVisible();
  expect(screen.getByText("100%")).toBeVisible();
  expect(document.querySelector("[data-gate-code='info']")).toBeNull();
  expect(screen.queryByText("INFO", { exact: true })).toBeNull();
  const notes = screen.getByText("Notes").nextElementSibling!;
  expect(within(notes as HTMLElement).getAllByRole("listitem").map(item => item.textContent)).toEqual(["Existing note", "Missing address"]);
});

it("renders prepared section errors without hiding other report content and recovers on replacement", () => {
  const view = prepareIqReport({ iq_doc: 90, explanation: ["Healthy notes"] });
  const rendered = render(<IqView view={{ ...view, segments: { data: null, error: "Segments failed" } }} ackingCodes={new Set()} onAck={vi.fn()} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Segments failed");
  expect(screen.getByText("90%")).toBeVisible();
  expect(screen.getByText("Healthy notes")).toBeVisible();
  expect(screen.getByText("Compliance Gates (0)")).toBeVisible();
  rendered.rerender(<IqView view={view} ackingCodes={new Set()} onAck={vi.fn()} />);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText("Indexing Segments (0)")).toBeVisible();
});

it("forwards a section retry without calculating or changing prepared content", () => {
  const onRetry = vi.fn();
  const view = prepareIqReport({ iq_doc: 90, explanation: ["Healthy notes"] });
  render(<IqView view={{ ...view, gates: { data: null, error: "Gate conversion failed" } }} ackingCodes={new Set()} onAck={vi.fn()} onRetry={onRetry} />);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("alert")).toHaveTextContent("Gate conversion failed");
  expect(screen.getByText("90%")).toBeVisible();
  expect(screen.getByText("Healthy notes")).toBeVisible();
});
