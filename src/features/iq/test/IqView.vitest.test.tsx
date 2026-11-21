import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { IqView } from "../component/IqView";
import { prepareIqReport } from "../data/iqData";
import type { IqReportView } from "../type/iq.types";

afterEach(cleanup);

it("restores the selected tab after closing and reopening, including the loading view", () => {
  const props = { view: prepareIqReport({}), pendingChanges: new Map(), onAck: vi.fn() };
  const first = render(<IqView {...props}  onAckCue={vi.fn()} />);
  fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
  expect(localStorage.getItem("aurorra-index:iq-tab")).toBe("Notes");
  first.unmount();
  const second = render(<IqView {...props} view={null}  onAckCue={vi.fn()} />);
  expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Notes");
  second.rerender(<IqView {...props}  onAckCue={vi.fn()} />);
  expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Notes");
  fireEvent.keyDown(screen.getByRole("tab", { name: "Notes" }), { key: "ArrowLeft" });
  expect(localStorage.getItem("aurorra-index:iq-tab")).toBe("Compliance");
  second.unmount();
  render(<IqView {...props}  onAckCue={vi.fn()} />);
  expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Compliance");
});

it("falls back to Quality for an invalid stored tab", () => {
  localStorage.setItem("aurorra-index:iq-tab", "Unknown");
  render(<IqView view={null} pendingChanges={new Map()} onAck={vi.fn()}  onAckCue={vi.fn()} />);
  expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Quality");
});

it("keeps tab navigation available when local storage throws", () => {
  const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage blocked"); });
  const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage blocked"); });
  try {
    render(<IqView view={null} pendingChanges={new Map()} onAck={vi.fn()}  onAckCue={vi.fn()} />);
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Quality");
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Notes");
  } finally {
    read.mockRestore();
    write.mockRestore();
  }
});

it("uses Quality, Compliance and Notes tabs with shared keyboard navigation", () => {
  render(<IqView view={prepareIqReport({ iq_doc: 90, gates: [{ code: "gate", status: "FAIL", description: "Failed requirement" }], notes: [{ segment: null, message: "Enrichment assessment" }] })} pendingChanges={new Map()} onAck={vi.fn()}  onAckCue={vi.fn()} />);
  const tabs = screen.getAllByRole("tab");
  expect(tabs.map(tab => tab.textContent)).toEqual(["Quality", "Compliance", "Notes"]);
  expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Quality");
  expect(screen.getByText("90%")).toBeVisible();
  expect(screen.getByText("Failed requirement")).not.toBeVisible();
  fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
  expect(tabs[1]).toHaveFocus();
  expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Compliance");
  expect(screen.getByText("Failed requirement")).toBeVisible();
  expect(screen.getByText("90%")).not.toBeVisible();
  fireEvent.keyDown(tabs[1], { key: "End" });
  expect(tabs[2]).toHaveFocus();
  expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Notes");
  expect(screen.getByText("Enrichment assessment")).toBeVisible();
  expect(screen.getByText("Failed requirement")).not.toBeVisible();
  fireEvent.keyDown(tabs[2], { key: "Home" });
  expect(tabs[0]).toHaveFocus();
});

it("renders prepared values and order without sorting, relabeling, or deriving clear eligibility", () => {
  const prepared = prepareIqReport({
    iq_doc: 90,
    gates: [{ code: "pass", status: "PASS", description: "Prepared requirement" }],
    segments: [
      { cues: [], segment_name: "party", expected_weight: 1, actual_weight: 1, iq: 100, explanations: [] },
      { cues: [], segment_name: "sides", expected_weight: 2, actual_weight: 2, iq: 100, explanations: [] },
    ],
  });
  const view: IqReportView = {
    ...prepared,
    segments: { data: [...prepared.segments.data!].reverse(), error: null },
    gates: { data: { ...prepared.gates.data!, displayPercent: 42, total: 7, items: [{ ...prepared.gates.data!.items[0], label: "Prepared label", clearable: true }] }, error: null },
  };
  render(<IqView view={view} pendingChanges={new Map()} onAck={vi.fn()}  onAckCue={vi.fn()} />);
  expect(within(screen.getByRole("table")).getAllByRole("row").slice(1).map(row => within(row).getAllByRole("cell")[0].textContent)).toEqual(["Party", "Sides"]);
  fireEvent.click(screen.getByRole("tab", { name: "Compliance" }));
  expect(screen.getByText("42%")).toBeVisible();
  expect(screen.getByText("out of 7 gates")).toBeVisible();
  expect(screen.getByText("Prepared label")).toBeVisible();
  expect(screen.getByRole("button", { name: "Clear gate" })).toBeEnabled();
});

it("renders service notes separately from compliance gates", () => {
  const view = prepareIqReport({
    gates: [
      { code: "pass", status: "PASS", description: "Passed requirement" },
    ],
    notes: [{ segment: null, message: "Indexing quality: complete and consistent." }, { segment: null, message: "Existing note" }, { segment: null, message: "Missing address" }],
  });
  render(<IqView view={view} pendingChanges={new Map()} onAck={vi.fn()}  onAckCue={vi.fn()} />);
  fireEvent.click(screen.getByRole("tab", { name: "Compliance" }));
  expect(screen.queryByText(/^Compliance Gates \(/)).toBeNull();
  expect(screen.getByText("100%")).toBeVisible();
  expect(document.querySelector("[data-gate-code='info']")).toBeNull();
  expect(screen.queryByText("INFO", { exact: true })).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
  const notes = screen.getByRole("tabpanel", { name: "Notes" });
  const cards = Array.from(notes.querySelectorAll("p"));
  expect(cards.map(item => item.textContent)).toEqual(["Missing address", "Existing note"]);
  cards.forEach(card => {
    expect(card.style.borderLeftWidth).toBe("");
    expect(card).toHaveStyle({ padding: "0 1rem", color: "var(--title-ink)" });
  });
  expect(view.notes.data).toEqual([
    { segment: null, message: "Existing note", status: "neutral" },
    { segment: null, message: "Missing address", status: "neutral" },
  ]);
  expect(within(notes).queryByText("Notes", { exact: true })).toBeNull();
  expect(within(notes).queryByRole("list")).toBeNull();
});

it("renders prepared statuses without bars and with consistent text color without reclassifying messages", () => {
  const prepared = prepareIqReport({});
  const view: IqReportView = { ...prepared, notes: { data: [
    { segment: null, message: "Prepared success", status: "success" },
    { segment: null, message: "Prepared warning", status: "warning" },
    { segment: null, message: "Missing indexes: prepared neutral", status: "neutral" },
  ], error: null } };
  render(<IqView view={view} pendingChanges={new Map()} onAck={vi.fn()}  onAckCue={vi.fn()} />);
  fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
  const success = screen.getByText("Prepared success").closest("p")!;
  const warning = screen.getByText("Prepared warning").closest("p")!;
  const neutral = screen.getByText("Missing indexes: prepared neutral").closest("p")!;
  expect(success).toHaveAttribute("data-status", "success");
  expect(success).toHaveStyle({ color: "var(--title-ink)" });
  for (const note of [success, warning, neutral]) expect(note.style.borderLeftWidth).toBe("");
  expect(success.querySelector("[data-status-icon]")).toBeNull();
  expect(within(success).queryByText("success", { exact: true })).toBeNull();
  expect(within(success).queryByRole("img")).toBeNull();
  expect(success).toHaveTextContent(/^Prepared success$/);
  expect(warning).toHaveAttribute("data-status", "warning");
  expect(warning).toHaveStyle({ color: "var(--title-ink)" });
  expect(within(warning).queryByText("warning", { exact: true })).toBeNull();
  expect(within(warning).queryByRole("img")).toBeNull();
  expect(warning).toHaveTextContent(/^Prepared warning$/);
  expect(neutral).toHaveAttribute("data-status", "neutral");
  expect(neutral).toHaveStyle({ color: "var(--title-ink)" });
  expect(neutral).toHaveTextContent(/^Missing indexes: prepared neutral$/);
  expect(view.notes.data?.map(note => note.message)).toEqual(["Prepared success", "Prepared warning", "Missing indexes: prepared neutral"]);
});

it("renders the Warning prefix in warning color and keeps the note body readable", () => {
  const view = prepareIqReport({ notes: [{ segment: null, message: "WARNING: The party segment has ambiguous index values for person." }] });
  render(<IqView view={view} pendingChanges={new Map()} onAck={vi.fn()} onAckCue={vi.fn()} />);
  fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
  const warning = screen.getByText("WARNING:", { exact: true });
  expect(warning).toHaveStyle({ color: "#92400e" });
  expect(warning.closest("p")).toHaveAttribute("data-status", "warning");
  expect(screen.getByText("The party segment has ambiguous index values for person.", { exact: true })).toBeVisible();
});

it("renders no note cards when all summaries are excluded", () => {
  render(<IqView view={prepareIqReport({ notes: [{ segment: null, message: "Compliance gates: satisfied (1 / 1)." }, { segment: null, message: "Indexing quality: complete and consistent." }] })} pendingChanges={new Map()} onAck={vi.fn()}  onAckCue={vi.fn()} />);
  fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
  expect(screen.getByRole("tabpanel", { name: "Notes" }).querySelectorAll("p")).toHaveLength(0);
  expect(screen.queryByText("Indexing quality: complete and consistent.")).toBeNull();
});

it("renders prepared section errors without hiding other report content and recovers on replacement", () => {
  const view = prepareIqReport({ iq_doc: 90, notes: [{ segment: null, message: "Healthy notes" }] });
  const rendered = render(<IqView view={{ ...view, segments: { data: null, error: "Segments failed" } }} pendingChanges={new Map()} onAck={vi.fn()}  onAckCue={vi.fn()} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Segments failed");
  expect(screen.getByText("90%")).toBeVisible();
  expect(screen.getByText("Healthy notes")).toBeInTheDocument();
  expect(screen.getByText("out of 0 gates")).toBeInTheDocument();
  rendered.rerender(<IqView view={view} pendingChanges={new Map()} onAck={vi.fn()}  onAckCue={vi.fn()} />);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("table")).toBeVisible();
  expect(screen.queryByText(/^Indexing Segments/)).toBeNull();
});

it("forwards a section retry without calculating or changing prepared content", () => {
  const onRetry = vi.fn();
  const view = prepareIqReport({ iq_doc: 90, notes: [{ segment: null, message: "Healthy notes" }] });
  render(<IqView view={{ ...view, gates: { data: null, error: "Gate conversion failed" } }} pendingChanges={new Map()} onAck={vi.fn()} onRetry={onRetry}  onAckCue={vi.fn()} />);
  fireEvent.click(screen.getByRole("tab", { name: "Compliance" }));
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("alert")).toHaveTextContent("Gate conversion failed");
  expect(screen.getByText("90%")).toBeInTheDocument();
  expect(screen.getByText("Healthy notes")).toBeInTheDocument();
});


it("shows disclosure only above 30 words, previews 25 words and preserves full text when expanded", () => {
  const words = Array.from({ length: 31 }, (_, index) => `word${index + 1}`);
  const message = words.join(" ");
  const short = words.slice(0, 26).join(" ");
  const exact = words.slice(0, 30).join(" ");
  const preview = `${words.slice(0, 25).join(" ")}…`;
  const spaced = words.slice(0, 30).join(" \t\n ");
  render(<IqView view={prepareIqReport({ notes: [short, exact, message, spaced].map(message => ({ segment: null, message })) })} pendingChanges={new Map()} onAck={vi.fn()}  onAckCue={vi.fn()} />);
  fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
  const notes = screen.getByRole("tabpanel", { name: "Notes" });
  expect(within(notes).getAllByRole("button")).toHaveLength(1);
  const trigger = within(notes).getByRole("button", { name: "Expand note" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(within(notes).queryByText(message)).toBeNull();
  expect(within(notes).getByText(preview)).toBeVisible();
  expect(within(notes).getAllByText(exact, { exact: true })).toHaveLength(2);
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(trigger).toHaveAccessibleName("Collapse note");
  expect(within(notes).getByText(message)).toBeVisible();
  fireEvent.click(trigger);
  expect(within(notes).queryByText(message)).toBeNull();
  expect(within(notes).getByText(short, { exact: true })).toBeVisible();
});
