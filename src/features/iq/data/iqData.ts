import type { IqBucket, IqDecision, IqGate, IqGateStatus, IqReport, IqReportView, IqSegment, IqUiStatus, IqWorkerError } from "../type/iq.types";

export function toIqError(error: unknown): IqWorkerError {
  const candidate = error as { code?: unknown; details?: unknown; error?: unknown; message?: unknown; status?: unknown };
  return {
    ...(error instanceof ErrorEvent ? { cause: error } : {}),
    code: typeof candidate?.code === "string" ? candidate.code : undefined,
    details: candidate?.details,
    error: typeof candidate?.error === "string"
      ? candidate.error
      : typeof candidate?.message === "string"
        ? candidate.message
        : "IQ request failed.",
    status: typeof candidate?.status === "number" ? candidate.status : undefined,
  };
}

export const GATE_PASS = "PASS";
export const GATE_FAIL = "FAIL";
export const GATE_WARNING = "WARNING";
export const GATE_INFO = "INFO";
export const UI_PASS = "success";
export const UI_FAIL = "fail";
export const UI_WARNING = "warning";
export const UI_INFO = "info";

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function clampPercent(value: unknown): number {
  return Math.min(100, Math.max(0, num(value)));
}

function bucketForScore(value: unknown): IqBucket {
  const pct = clampPercent(value);
  if (pct >= 96) return "green";
  if (pct >= 82) return "amber";
  return "red";
}

function isDecision(value: unknown): value is IqDecision {
  return value === "Pass" || value === "Review" || value === "Reject";
}

function isKnownGateStatus(status: unknown): status is IqGateStatus {
  return status === GATE_PASS || status === GATE_FAIL || status === GATE_WARNING || status === GATE_INFO;
}

function gateStatus(status: IqGateStatus): IqUiStatus {
  switch (status) {
    case GATE_PASS:
      return UI_PASS;
    case GATE_FAIL:
      return UI_FAIL;
    case GATE_WARNING:
      return UI_WARNING;
    case GATE_INFO:
      return UI_INFO;
  }
}

function formatNumber(value: unknown): string {
  return num(value).toFixed(2);
}

function prettyId(value: unknown): string {
  const text = String(value || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  if (!text) return "";
  return text.replace(/\b([a-z])/g, (_match, char: string) => char.toUpperCase());
}

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function computeGatesDecision(gates: IqReportView["gates"]["items"]): IqDecision {
  let fail = 0;
  let success = 0;
  for (const gate of gates) {
    if (gate.isFailure === true) fail++;
    else if (gate.status === UI_PASS) success++;
  }
  if (fail > 0) return "Reject";
  if (success > 0 && fail === 0) return "Pass";
  return "Review";
}

export function normalizeIqReport(raw: unknown): IqReport {
  const source = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const gates = Array.isArray(source.gates)
    ? source.gates.map((entry) => {
      const gate = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      return {
        code: text(gate.code),
        status: text(gate.status),
        description: typeof gate.description === "string" ? gate.description : "Detailed values are unavailable for this saved result.",
      } satisfies IqGate;
    })
    : [];
  const segments = Array.isArray(source.segments)
    ? source.segments.map((entry) => {
      const segment = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      return {
        segment_name: text(segment.segment_name),
        expected_weight: num(segment.expected_weight),
        actual_weight: num(segment.actual_weight),
        iq: num(segment.iq),
        explanations: Array.isArray(segment.explanations) ? segment.explanations.map(text) : [],
      } satisfies IqSegment;
    })
    : [];

  return {
    iq_doc: num(source.iq_doc),
    decision: isDecision(source.decision) ? source.decision : "Review",
    gates,
    segments,
    explanation: Array.isArray(source.explanation) ? source.explanation.map(text) : [],
  };
}

export function prepareIqReport(raw: unknown): IqReportView {
  const report = normalizeIqReport(raw);
  const iqValue = clampPercent(report.iq_doc);
  const gateItems = report.gates
    .filter((gate): gate is IqGate & { status: IqGateStatus } => isKnownGateStatus(gate.status))
    .map((gate) => ({
      code: gate.code,
      status: gateStatus(gate.status),
      description: gate.description,
      isFailure: gate.status === GATE_FAIL,
    }));
  const gateSuccess = gateItems.filter((gate) => gate.isFailure === false).length;
  const gateRatio = gateItems.length > 0 ? (gateSuccess / gateItems.length) * 100 : 0;
  const gatePercent = clampPercent(gateRatio);

  return {
    iq: {
      value: iqValue,
      displayInt: Math.round(iqValue),
      bucket: bucketForScore(iqValue),
      decision: isDecision(report.decision) ? report.decision : "Review",
    },
    gates: {
      items: gateItems,
      total: gateItems.length,
      success: gateSuccess,
      ratio: gateRatio,
      displayPercent: Math.round(gatePercent),
      bucket: bucketForScore(gatePercent),
      decision: computeGatesDecision(gateItems),
    },
    segments: report.segments.map((segment) => ({
      id: segment.segment_name,
      displayId: prettyId(segment.segment_name),
      expectedWeight: segment.expected_weight,
      expectedDisplay: formatNumber(segment.expected_weight),
      actualWeight: segment.actual_weight,
      actualDisplay: formatNumber(segment.actual_weight),
      iq: segment.iq,
      iqDisplay: formatNumber(segment.iq),
      explanations: segment.explanations.map(text),
    })),
    explanations: report.explanation.map(text),
  };
}
