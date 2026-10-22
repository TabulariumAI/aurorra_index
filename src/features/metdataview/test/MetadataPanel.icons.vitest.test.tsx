import * as Tooltip from "@radix-ui/react-tooltip";
import { render, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getPanelData, MetadataRow } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";

const metadata = {
  heading: { title: "Warranty Deed", secondary_titles: ["Addendum"], explanation: "Recorded title" },
  legals: { groups: [{ code: "legal-1", type: "lot_block", elements: [{ aspect: "lot", value: "12" }] }] },
};
const props: MetadataPanelProps = {
  actions: { confirm: false, drop: false, reprocess: false }, callbacks: {}, choices: [],
  confirmedCodes: new Set(), removedCodes: new Set(), metadata, panelData: getPanelData(metadata),
  openSegment: "title", selectedIndex: null, sections: { filterByChoices: false, hiddenSegments: new Set(), showEmpty: true },
  showContext: false, session: "session-1", setSectionOpen: vi.fn(), shortcuts: null, status: "success",
  segments: { ACKNOWLEDGMENT: "acknowledgment", JUDGMENT: "judgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor", FUND: "fund", LEGAL: "legal", MONETARY: "monetary", PAGE: "page", PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title", TRANSACTION: "transaction", VITAL: "vital" },
};

it("uses green dots for titles and legal groups while preserving content and actions", () => {
  const view = render(<MetadataPanel {...props} />);
  for (const title of ["Warranty Deed", "Addendum"]) {
    const article = within(view.container).getByText(title).closest("article")!;
    expect(within(article).getByRole("img", { name: "OK" }).querySelector("svg circle")).toHaveAttribute("r", "12");
    expect(within(article).getByRole("img", { name: "OK" }).querySelector("svg path")).toBeNull();
    expect(article.style.borderLeftColor).not.toBe("var(--primary-dark)");
    expect(article).toHaveTextContent("Recorded title");
  }
  view.rerender(<MetadataPanel {...props} openSegment="legal" />);
  const legal = view.container.querySelector('[data-index-code="legal-1"]')!;
  expect(within(legal as HTMLElement).getByRole("img", { name: "OK" }).querySelector("svg circle")).toHaveAttribute("r", "12");
  expect((legal as HTMLElement).style.borderLeftColor).not.toBe("forestgreen");
  expect(legal).toHaveTextContent("Lot: 12");
  expect(within(legal as HTMLElement).queryByRole("button")).toBeNull();
});

it.each([
  { ambiguous: "NO", confirmed: false, pending: undefined, recovery: null, status: "success", color: "#15803d" },
  { ambiguous: "YES", confirmed: true, pending: undefined, recovery: null, status: "success", color: "#15803d" },
  { ambiguous: "YES", confirmed: false, pending: undefined, recovery: null, status: "warning", color: "#f59e0b" },
  { ambiguous: "NO", confirmed: false, pending: "update" as const, recovery: null, status: "success", color: "#f59e0b" },
  { ambiguous: "NO", confirmed: false, pending: "delete" as const, recovery: null, status: "success", color: "#dc2626" },
  { ambiguous: "YES", confirmed: true, pending: "delete" as const, recovery: null, status: "success", color: "#dc2626" },
  { ambiguous: "NO", confirmed: false, pending: "update" as const, recovery: <button>Retry</button>, status: "error", color: "#dc2626" },
])("uses the dot matching index status: %j", ({ ambiguous, confirmed, pending, recovery, status, color }) => {
  const { container } = render(<Tooltip.Provider><MetadataRow callbacks={{}} confirmed={confirmed}
    item={{ ambiguous, code: "index-1", label: "grantor", value: "Alice" }}
    pending={pending} recovery={recovery} selected={false} segment="party" session="session-1" /></Tooltip.Provider>);
  expect(container.querySelector('svg[data-status-icon="success"]') !== null).toBe(!pending && status === "success");
  expect(container).toHaveTextContent("Alice");
  const row = container.querySelector("article")!;
  expect(row).toHaveAttribute("data-status", status);
  if (!pending && status === "success") expect(row.querySelector('svg[data-status-icon="success"]')).toHaveStyle({ color });
  else expect(row.firstElementChild).toHaveStyle({ backgroundColor: color, borderRadius: "999px", height: "0.7rem", width: "0.7rem" });
});
