import type { IqBucket, IqDecision, IqGate, IqGateStatus, IqReport, IqReportView, IqSegment, IqUiStatus } from "../type/iq.types";

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

function titleWords(value: string): string {
  const words = value
    .split(/[_\s]+/)
    .filter((part) => part.trim() !== "")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  return words.length > 0 ? words.join(" ") : value.trim();
}

function humanizeExpr(value: string): string {
  const coalesced = value.replace(
    /coalesce\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?)\s*\)/gi,
    (_match, left: string, right: string) => {
      const rightText = /^[0-9.]+$/.test(right) ? right : titleWords(right);
      return `${titleWords(left)} or ${rightText}`;
    },
  );
  return coalesced.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (token) => {
    if (/^(coalesce|true|false|or|and)$/i.test(token)) return token;
    return titleWords(token);
  });
}

function joinOr(items: string[]): string {
  return items.map((item) => item.trim()).filter(Boolean).join(" or ");
}

function joinAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function formatCount(value: unknown): string {
  const n = num(value);
  return Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : String(n);
}

function humanizeValue(value: unknown): string {
  const raw = text(value).trim();
  if (!raw) return "";
  const parsed = Number.parseInt(raw, 10);
  if (String(parsed) === raw && parsed >= 0 && parsed <= 10) {
    return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][parsed];
  }
  return titleWords(raw);
}

function bindingsText(bindings: unknown): string {
  if (!Array.isArray(bindings)) return "";
  return bindings
    .map((entry) => {
      const binding = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      const field = text(binding.field).trim();
      const value = text(binding.value).trim();
      if (!field || value.toLowerCase() === "not available") return "";
      const valueText = Number.isFinite(Number(value)) ? value : titleWords(value);
      return `${titleWords(field)}=${valueText}`;
    })
    .filter(Boolean)
    .join("; ");
}

function positiveBindings(bindings: unknown, fields: string[]): string[] {
  if (!Array.isArray(bindings)) return [];
  return bindings
    .map((entry) => {
      const binding = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      const field = text(binding.field).trim();
      if (!fields.some((allowed) => allowed === field)) return "";
      const value = num(binding.value);
      if (!Number.isFinite(value) || value <= 0) return "";
      return `${titleWords(field)}(${formatCount(value)})`;
    })
    .filter(Boolean);
}

function storedGateDescription(gate: Record<string, unknown>): string {
  const kind = text(gate.kind);
  const status = text(gate.status);
  const tested = formatCount(gate.combinations_tested);
  const fields = Array.isArray(gate.fields) ? gate.fields.map(text) : [];
  const aspects = Array.isArray(gate.aspects) ? gate.aspects.map(text) : [];
  const bindingText = bindingsText(gate.bindings);

  if (kind === "Generic") {
    const expr = humanizeExpr(text(gate.human_expr));
    if (status === GATE_PASS) {
      return bindingText ? `${expr} - satisfied with ${bindingText}.` : `${expr} - satisfied.`;
    }
    return bindingText
      ? `${expr} - condition not satisfied by any available values. Values: ${bindingText}. Tested ${tested} combination(s).`
      : `${expr} - condition not satisfied by any available values. Tested ${tested} combination(s).`;
  }

  if (kind === "CoalescePresence") {
    const prefix = `At least ${humanizeValue(gate.min_required)} of the following index fields must be present: ${fields.map(titleWords).join(", ")}`;
    const found = positiveBindings(gate.bindings, fields);
    if (status === GATE_PASS) {
      return found.length > 0
        ? `${prefix} - satisfied with ${found.join("; ")}. Tested ${tested} combination(s). Rule: coalesce.`
        : `${prefix} - satisfied. Tested ${tested} combination(s). Rule: coalesce.`;
    }
    return found.length > 0
      ? `${prefix} - found ${found.join("; ")} but fewer than required. Tested ${tested} combination(s). Rule: coalesce.`
      : `${prefix} - none were found in the available values. Tested ${tested} combination(s). Rule: coalesce.`;
  }

  if (kind === "CoalesceOnOrBefore") {
    const prefix = `${titleWords(text(gate.left_field))} must be on or before ${titleWords(text(gate.right_field))}`;
    if (status === GATE_PASS) {
      return bindingText
        ? `${prefix} - satisfied with ${bindingText}. Tested ${tested} combination(s). Rule: coalesce.`
        : `${prefix} - satisfied. Tested ${tested} combination(s). Rule: coalesce.`;
    }
    return bindingText
      ? `${prefix} - condition not satisfied by the available values. Values: ${bindingText}. Tested ${tested} combination(s). Rule: coalesce.`
      : `${prefix} - condition not satisfied by the available values. Tested ${tested} combination(s). Rule: coalesce.`;
  }

  if (kind === "MissingIndexes") {
    return `Missing indexes: ${joinOr(fields.map(titleWords))}. Cue verification did not confirm the existence of required indexes.`;
  }

  if (kind === "NoGates") {
    return "No Compliance gates defined for this document class.";
  }

  if (kind === "JoinError") {
    return "<join_error> - evaluation failed.";
  }

  if (kind === "AmbiguousIndexes") {
    return `The ${titleWords(text(gate.segment)).toLowerCase()} segment has ambiguous index values for ${joinAnd(aspects.map((aspect) => titleWords(aspect).toLowerCase()))}.`;
  }

  return "";
}

function gateDescription(gate: Record<string, unknown>): string {
  return typeof gate.description === "string" ? gate.description : storedGateDescription(gate);
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
        description: gateDescription(gate),
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
