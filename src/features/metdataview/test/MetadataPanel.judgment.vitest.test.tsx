import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getPanelData, indexSegments } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";

const metadata = { indexes: [{ code: "case-1", segment: "judgment", aspect: "court_case_number", label: "Case number", value: "CV-2026-101", page: "1", ambiguous: "YES" }] };
const props: MetadataPanelProps = {
  actions: { confirm: true, drop: true, reprocess: true }, callbacks: {},
  choices: [{ service: "CourtIndexing", level: 1 }], confirmedCodes: new Set(), removedCodes: new Set(),
  metadata, panelData: getPanelData(metadata), openSegment: "judgment", selectedIndex: null,
  sections: { filterByChoices: true, hiddenSegments: new Set(), showEmpty: false },
  showContext: false, session: "s", setSectionOpen: vi.fn(), shortcuts: null, status: "success",
  segments: { ...indexSegments, TITLE: "title", FEE: "fee", FUND: "fund", FEEFACTOR: "factor" },
};

it("renders Judgment indexes and routes add, reprocess, edit, confirm and remove through existing actions", async () => {
  const add = vi.fn(), reprocess = vi.fn(), edit = vi.fn(), confirm = vi.fn(), drop = vi.fn();
  render(<MetadataPanel {...props} onAddIndex={add} onReprocess={reprocess} onEditIndex={edit} onConfirm={confirm} onDrop={drop} />);
  expect(screen.getByRole("button", { name: "Judgment" })).toBeEnabled();
  expect(screen.getByText("CV-2026-101")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Add Index" }));
  expect(add).toHaveBeenCalledExactlyOnceWith("judgment");
  fireEvent.click(screen.getByRole("button", { name: "Reprocess" }));
  expect(reprocess).toHaveBeenCalledExactlyOnceWith("judgment");
  fireEvent.click(screen.getByRole("button", { name: "Edit index" }));
  expect(edit).toHaveBeenCalledWith(metadata.indexes[0], "judgment", expect.any(HTMLElement));
  fireEvent.click(screen.getByRole("button", { name: "Confirm index and remove ambiguity" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ segment: "judgment", code: "case-1" })));
  fireEvent.click(screen.getByRole("button", { name: "Delete index" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(drop).toHaveBeenCalledWith(expect.objectContaining({ segment: "judgment", code: "case-1" })));
});

it("uses CourtIndexing selection and preserves unfiltered consumers and explicit exclusions", () => {
  const view = render(<MetadataPanel {...props} choices={[]} />);
  expect(screen.getByRole("button", { name: "Judgment" })).toBeDisabled();
  expect(screen.queryByText("CV-2026-101")).not.toBeInTheDocument();
  view.rerender(<MetadataPanel {...props} choices={null} />);
  expect(screen.getByRole("button", { name: "Judgment" })).toBeEnabled();
  expect(screen.getByText("CV-2026-101")).toBeVisible();
  view.rerender(<MetadataPanel {...props} choices={[]} sections={{ ...props.sections, filterByChoices: false }} />);
  expect(screen.getByRole("button", { name: "Judgment" })).toBeEnabled();
  view.rerender(<MetadataPanel {...props} sections={{ ...props.sections, hiddenSegments: new Set(["judgment"]) }} />);
  expect(screen.queryByRole("button", { name: "Judgment" })).not.toBeInTheDocument();
});

it("excludes removed Judgment indexes from rows and counts and retains empty-state behavior", () => {
  render(<MetadataPanel {...props} removedCodes={new Set(["case-1"])} />);
  expect(screen.queryByText("CV-2026-101")).not.toBeInTheDocument();
  expect(screen.getByText("No judgment indexes found.")).toBeVisible();
  const segment = screen.getByRole("button", { name: "Judgment" }).parentElement!;
  expect(segment).toHaveTextContent("0");
});

it("counts only valid Judgment indexes", () => {
  const data = { indexes: [...metadata.indexes, { code: "invalid", segment: "judgment", value: "Missing label" }] };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
  expect(screen.queryByText("Missing label")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Judgment" }).parentElement?.lastElementChild).toHaveTextContent("1");
});

it("uses the shared segment progress and recovery behavior for Judgment", () => {
  const view = render(<MetadataPanel {...props} pendingSegments={new Map([["judgment", { busy: true, actions: null }]])} />);
  expect(screen.getByRole("progressbar", { name: "Reprocessing judgment" })).toBeVisible();
  expect(screen.getByRole("article").closest("[inert]")).not.toBeNull();
  view.rerender(<MetadataPanel {...props} pendingSegments={new Map([["judgment", { busy: false, actions: <button>Retry judgment</button> }]])} />);
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry judgment" }).closest("[inert]")).toBeNull();
});
