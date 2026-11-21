import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { iqStoreApi } from "../store/iqStore";
import { IqWorker } from "../worker/IqWorker";
import { render, screen } from "@testing-library/react";
import { IqView } from "../component/IqView";
import { prepareIqReport } from "../data/iqData";
import type { IqResource } from "../type/iq.types";

const code = "e3572180-6877-4716-b2fb-bb9de7b26fa6";
const before: IqResource = { report: { iq_doc: 84, gates: [], notes: [], segments: [
  { segment_name: "acknowledgment", expected_weight: 8, actual_weight: 0, iq: 0, explanations: [],
    cues: [{ code, aspect: "notary_name", description: "Missing Notary Name" }] },
] }, metadataEtag: "metadata", verificationEtag: "model" };
beforeEach(() => iqStoreApi.getState().resetIq());
afterEach(() => { cleanup(); iqStoreApi.getState().resetIq(); vi.unstubAllGlobals(); });

it.each([["iqAck", "gates"], ["iqCueAck", "cues"]] as const)("posts %s without hiding report retrieval inside the mutation worker", async (type, kind) => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ status: "completed", etag: "inputs-after", data: { code, status: "DISMISSED" } }));
  vi.stubGlobal("fetch", fetch);
  const result = await new IqWorker().run({ type, apiBaseUrl: "https://gateway.test", token: "token", session: "a", code });
  expect(fetch.mock.calls[0][0]).toBe(`https://gateway.test/v1/iq/a/${kind}/${code}/ack`);
  expect(fetch.mock.calls[0][1].method).toBe("POST");
  expect(fetch).toHaveBeenCalledOnce();
  expect(result).toEqual({ ok: true, data: { status: "completed", etag: "inputs-after", data: { code, status: "DISMISSED" }, isComplete: true } });
});

it("regenerates reports that predate structured cues without manufacturing empty cues", async () => {
  const old = structuredClone(before.report);
  delete (old.segments[0] as Partial<typeof old.segments[0]>).cues;
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ status: "completed", data: "https://storage.test/old.json" }))
    .mockResolvedValueOnce(Response.json(old))
    .mockResolvedValueOnce(Response.json({ status: "completed", data: "https://storage.test/new.json" }))
    .mockResolvedValueOnce(Response.json(before.report));
  vi.stubGlobal("fetch", fetch);
  const result = await new IqWorker().run({ type: "iqData", apiBaseUrl: "x", token: "t", session: "a", etag: "old" });
  expect(fetch.mock.calls[2][0]).toBe("x/v1/iq/a/data");
  expect(result).toEqual({ ok: true, data: { report: before.report } });
});

it("offers confirmation for structured cues without making other explanations dismissible", () => {
  const report = structuredClone(before.report);
  report.segments[0].explanations = ["A separate quality issue"];
  render(<IqView view={prepareIqReport(report)} pendingChanges={new Map()} onAck={vi.fn()} onAckCue={vi.fn()} />);
  expect(screen.getByText("Missing Notary Name")).toBeVisible();
  expect(screen.getByText("A separate quality issue")).toBeVisible();
  expect(screen.getAllByRole("button", { name: "Dismiss cue" })).toHaveLength(1);
});

for (const type of ["iqAck", "iqCueAck"] as const) it.each(["pending", "processing", "error"])(`${type} rejects an incomplete %s acknowledgment`, async status => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ status, data: "" }));
  vi.stubGlobal("fetch", fetch);
  expect(await new IqWorker().run({ type, apiBaseUrl: "x", token: "t", session: "a", code }))
    .toMatchObject({ ok: false, code: "iq_ack_incomplete" });
  expect(fetch).toHaveBeenCalledOnce();
});

it("stops migration if regeneration still produces an old report", async () => {
  const old = structuredClone(before.report);
  delete (old.segments[0] as Partial<typeof old.segments[0]>).cues;
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ status: "completed", data: "https://storage.test/old.json" }))
    .mockResolvedValueOnce(Response.json(old));
  vi.stubGlobal("fetch", fetch);
  expect(await new IqWorker().run({ type: "iqData", apiBaseUrl: "x", token: "t", session: "a", etag: null }))
    .toMatchObject({ ok: false, code: "cue_report_outdated" });
  expect(fetch).toHaveBeenCalledTimes(2);
});

it.each(["iqAck", "iqCueAck"] as const)("rejects %s completion without the input ETag needed for freshness", async type => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ status: "completed", data: {} })));
  expect(await new IqWorker().run({ type, apiBaseUrl: "x", token: "t", session: "a", code }))
    .toMatchObject({ ok: false, code: "iq_ack_incomplete" });
});
