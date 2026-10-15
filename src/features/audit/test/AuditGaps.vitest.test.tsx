import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuditGaps } from "../component/AuditGaps";
import { prepareAuditReport } from "../data/auditData";
import { auditGap, auditPatch } from "./auditFixture";

describe("AuditGaps details", () => {
  it("shows added index fields separately from explanation", () => {
    const view = prepareAuditReport({ gaps: [auditGap] }, { changeType: "", process: "", segment: "" }, ["party", "reference", "transaction"]);
    render(<AuditGaps gaps={view.gaps} />);
    const card = within(screen.getByRole("article"));
    for (const text of ["Addition", "2026-001", "7",
      "Recorded as 2026-001", "transaction", "Index created by user.", "User change"]) {
      expect(card.getByText(text, { exact: true })).toBeVisible();
    }
    expect(card.queryByText("RefineManager")).not.toBeInTheDocument();
    expect(card.queryByText("null")).not.toBeInTheDocument();
  });

  it("shows update target and changed fields without losing the identifier", () => {
    const patch = { ...auditPatch, code: "index-1", solution: "update", field: "value",
      identifier: { value: "2025-999", label: "Old label", aspect: "instrument_number" } };
    const view = prepareAuditReport({ gaps: [{ ...auditGap, solution: "update", patch }] }, { changeType: "", process: "", segment: "" }, ["party", "reference", "transaction"]);
    render(<AuditGaps gaps={view.gaps} />);
    for (const text of ["2025-999", "Old label", "instrument_number", "2026-001 (value)"]) {
      expect(screen.getByText(text, { exact: true })).toBeVisible();
    }
  });

  it("hides the code-only removal identifier without fabricating index fields", () => {
    const patch = { ...auditPatch, solution: "remove", code: "index-1", value: null,
      label: null, aspect: null, source: null, page: null, segment: null };
    const view = prepareAuditReport({ gaps: [{ ...auditGap, solution: "remove", page: "", segment: null, patch }] }, { changeType: "", process: "", segment: "" }, ["party", "reference", "transaction"]);
    render(<AuditGaps gaps={view.gaps} />);
    expect(screen.queryByText("index-1")).not.toBeInTheDocument();
    expect(screen.queryByText("Code", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Source", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("Page", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("undefined")).not.toBeInTheDocument();
  });

  it("preserves explanation-only records and displays their recorded page and segment", () => {
    const { patch, ...gap } = auditGap;
    const view = prepareAuditReport({ gaps: [gap] }, { changeType: "", process: "", segment: "" }, ["party", "reference", "transaction"]);
    render(<AuditGaps gaps={view.gaps} />);
    expect(screen.getByText(gap.explanation)).toBeVisible();
    expect(screen.getByText("7")).toBeVisible();
    expect(screen.getByText("transaction")).toBeVisible();
    expect(screen.queryByText("Recording number")).not.toBeInTheDocument();
  });

  it("renders long source as text and preserves line breaks", () => {
    const source = '<script>alert("audit")</script>\n' + "Recorded detail ".repeat(100);
    const view = prepareAuditReport({ gaps: [{ ...auditGap, patch: { ...auditPatch, source } }] }, { changeType: "", process: "", segment: "" }, ["party", "reference", "transaction"]);
    const { container } = render(<AuditGaps gaps={view.gaps} />);
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain(source);
  });
  it("places segment in the footer and hides Code and the standalone Field when Index exists", () => {
    const patch = { ...auditPatch, code: "hidden-code", field: "value" };
    const view = prepareAuditReport({ gaps: [{ ...auditGap, patch }] }, { changeType: "", process: "", segment: "" }, ["transaction"]);
    render(<AuditGaps gaps={view.gaps} />);
    const card = screen.getByRole("article");
    expect(screen.getByText("2026-001 (value)")).toBeVisible();
    expect(within(card.querySelector("dl")!).queryByText("Field")).not.toBeInTheDocument();
    expect(within(card.querySelector("dl")!).queryByText("Segment")).not.toBeInTheDocument();
    expect(screen.queryByText("hidden-code")).not.toBeInTheDocument();
    expect(card.lastElementChild).toContainElement(screen.getByText("transaction"));
    expect(card.lastElementChild).toContainElement(screen.getByText("User change"));
    expect(card.lastElementChild).toHaveStyle({ display: "flex", justifyContent: "space-between" });
  });

  it("retains Field without Index and omits an absent Segment", () => {
    const patch = { ...auditPatch, value: null, field: "label" };
    const view = prepareAuditReport({ gaps: [{ ...auditGap, segment: null, patch }] }, { changeType: "", process: "", segment: "" }, ["transaction"]);
    render(<AuditGaps gaps={view.gaps} />);
    expect(screen.getByText("Field", { exact: true })).toBeVisible();
    expect(screen.getAllByText("label", { exact: true })).toHaveLength(1);
    expect(screen.queryByText("Index", { exact: true })).not.toBeInTheDocument();
    expect(screen.getByRole("article").lastElementChild!.children).toHaveLength(1);
  });

  it.each(["add", "update", "remove", "confirm"])("hides Label, Aspect, and Ambiguous for %s without hiding target details or explanation", (solution) => {
    const patch = { ...auditPatch, solution, ambiguous: "YES",
      identifier: { value: "prior index", label: "Target label value", aspect: "target_aspect" } };
    const explanation = "Label: Recording number; aspect: recording_number; ambiguous: YES.";
    const view = prepareAuditReport({ gaps: [{ ...auditGap, solution, explanation, patch }] },
      { changeType: "", process: "", segment: "" }, ["transaction"]);
    render(<AuditGaps gaps={view.gaps} />);
    const details = within(screen.getByRole("article").querySelector("dl")!);
    for (const text of ["Label", "Aspect", "Ambiguous", "Recording number", "recording_number", "YES"]) {
      expect(details.queryByText(text, { exact: true })).not.toBeInTheDocument();
    }
    for (const text of ["Target label value", "target_aspect", "prior index", "2026-001", "7", "Recorded as 2026-001"]) {
      expect(details.getByText(text, { exact: true })).toBeVisible();
    }
    expect(screen.getByText(explanation, { exact: true })).toBeVisible();
    expect(screen.getByText("transaction", { exact: true })).toBeVisible();
    expect(view.gaps[0].patch).toEqual(patch);
  });

});
