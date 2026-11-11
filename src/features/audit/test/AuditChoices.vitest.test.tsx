import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuditPanel } from "../component/AuditPanel";
import { auditStoreApi } from "../store/auditStore";
import { indexStoreApi } from "../../metdataview/store/metadataStore";
import { queueStoreApi } from "../../queue/store/queueStore";
import type { ResourceRequest } from "aurora-core";

const choices = { source: "https://storage.test/input.tif", jurisdiction: "Texas, Harris County", items: [
  { service: "Recognition", level: 5 }, { service: "PartyClauseIndexing", level: 1 },
  { service: "Disabled", level: 0 }, { service: "LegalEnrichment", level: 1 },
] };
const loadReport = vi.fn(async () => ({ gaps: [], usage: { services: [] } }));
const onResource = vi.fn((request: ResourceRequest) => request.callback({ ok: true, data: { aspects: {} } }));
const props = { apiGatewayUrl: "https://api", authToken: "token", callbacks: {}, onResource,
  retryLimit: 1, retryIntervalMs: 0, session: "selected", workerClient: { loadReport },
  sourceDownload: <a href="blob:input" download="input.tif">Download input document</a> };

beforeEach(() => {
  auditStoreApi.getState().resetAudit();
  queueStoreApi.setState({ session: "selected" });
  indexStoreApi.setState({ choices: structuredClone(choices) });
  vi.clearAllMocks();
});
afterEach(() => { cleanup(); indexStoreApi.getState().resetMetadata(); });

it("shows saved session choices and the input download only in Choices without requesting defaults", async () => {
  render(<AuditPanel {...props} />);
  await screen.findByText("No gaps found.");
  expect(screen.getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Changes", "Usage", "Choices"]);
  expect(screen.queryByRole("link", { name: "Download input document" })).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "Choices" }));
  expect(screen.getByRole("tabpanel", { name: "Choices" })).toBeVisible();
  expect(screen.getByRole("table", { name: "Indexing choices" })).toHaveTextContent("Recognition5Party Clause IndexingYesLegal EnrichmentYes");
  expect(screen.queryByText("Disabled")).toBeNull();
  expect(screen.getByRole("link", { name: "Download input document" })).toHaveAttribute("download", "input.tif");
  expect(screen.getAllByRole("columnheader").map(cell => cell.textContent)).toEqual(["Service", "Value"]);
  expect(screen.getAllByRole("row")).toHaveLength(4);
  expect(screen.getByRole("link").compareDocumentPosition(screen.getByRole("heading", { name: "Indexing choices" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole("table")).toHaveStyle({ width: "100%", minWidth: "24rem" });
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(indexStoreApi.getState().choices).toEqual(choices);
  fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "Choices" }));
  expect(loadReport).toHaveBeenCalledTimes(1);
  expect(onResource).toHaveBeenCalledTimes(1);
});

it("keeps Choices independent of an audit report failure", async () => {
  render(<AuditPanel {...props} workerClient={{ loadReport: async () => { throw new Error("Audit unavailable"); } }} />);
  await act(async () => {});
  fireEvent.click(screen.getByRole("tab", { name: "Choices" }));
  expect(screen.getByRole("table", { name: "Indexing choices" })).toBeVisible();
  expect(screen.getByRole("link")).toBeVisible();
});

it("clears choices and the download when the selected session changes or is reset", async () => {
  const view = render(<AuditPanel {...props} />);
  await screen.findByText("No gaps found.");
  fireEvent.click(screen.getByRole("tab", { name: "Choices" }));
  view.rerender(<AuditPanel {...props} session="other" />);
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
  act(() => { queueStoreApi.setState({ session: "other" }); indexStoreApi.setState({ choices: { items: [], jurisdiction: null } }); });
  expect(screen.getByRole("table")).toBeVisible();
  expect(screen.getAllByRole("row")).toHaveLength(1);
  act(() => indexStoreApi.setState({ choices: null }));
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.getByText("Session choices are unavailable.")).toBeVisible();
});
