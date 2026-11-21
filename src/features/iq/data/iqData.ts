import type { IqBucket, IqCue, IqGate, IqGateStatus, IqGateView, IqModel, IqNote, IqNoteView, IqReport, IqReportView, IqSection, IqSegment, IqUiStatus, IqWorkerError } from "../type/iq.types";

export function resolveIqModel(previous: IqModel | null | undefined, current: IqModel | null | undefined, loaded: IqModel | undefined): IqModel | undefined {
  return current && current !== previous && current.class === loaded?.class
    && current.jurisdiction === loaded.jurisdiction ? current : loaded;
}

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

function isKnownGateStatus(status: unknown): status is Exclude<IqGateStatus, "INFO"> {
  return status === GATE_PASS || status === GATE_FAIL || status === GATE_WARNING;
}

function gateStatus(status: Exclude<IqGateStatus, "INFO">): IqUiStatus {
  switch (status) {
    case GATE_PASS:
      return UI_PASS;
    case GATE_FAIL:
      return UI_FAIL;
    case GATE_WARNING:
      return UI_WARNING;
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

export function normalizeIqReport(raw: unknown): IqReport {
  const source = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return {
    get iq_doc() { return num(source.iq_doc); },
    get gates() {
      return Array.isArray(source.gates) ? source.gates.map(entry => {
        const gate = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
        return {
          code: text(gate.code),
          status: text(gate.status),
          description: typeof gate.description === "string" ? gate.description : "Detailed values are unavailable for this saved result.",
        } satisfies IqGate;
      }) : [];
    },
    get segments() {
      return Array.isArray(source.segments) ? source.segments.map(entry => {
        const segment = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
        return {
          segment_name: text(segment.segment_name),
          expected_weight: num(segment.expected_weight),
          actual_weight: num(segment.actual_weight),
          iq: num(segment.iq),
          get cues() {
            if (!Array.isArray(segment.cues)) throw new Error("IQ cue findings are missing.");
            return segment.cues as IqCue[];
          },
          get explanations() {
            const explanations = segment.explanations;
            return Array.isArray(explanations) ? explanations.map(text) : [];
          },
        } satisfies IqSegment;
      }) : [];
    },
    get notes() { return Array.isArray(source.notes) ? source.notes.map((note: IqNote) => ({ segment: note.segment, message: note.message })) : []; },
  };
}

function prepareSection<T>(prepare: () => T): IqSection<T> {
  try {
    return { data: prepare(), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export function prepareIqReport(raw: unknown): IqReportView {
  const report = normalizeIqReport(raw);
  const gates = prepareSection(() => report.gates);
  return {
    iq: prepareSection(() => {
      const value = clampPercent(report.iq_doc);
      return {
        value,
        displayInt: Math.round(value),
        bucket: bucketForScore(value),
      };
    }),
    gates: gates.error !== null ? gates : prepareSection(() => {
      const items = gates.data
        .filter((gate): gate is IqGate & { status: Exclude<IqGateStatus, "INFO"> } => isKnownGateStatus(gate.status))
        .map(gate => ({
          code: gate.code,
          status: gateStatus(gate.status),
          description: gate.description,
          isFailure: gate.status === GATE_FAIL,
          label: gate.status,
          clearable: gate.status === GATE_FAIL || gate.status === GATE_WARNING,
        }));
      const success = items.filter(gate => gate.isFailure === false).length;
      const ratio = items.length > 0 ? (success / items.length) * 100 : 0;
      return {
        items,
        total: items.length,
        success,
        ratio,
        displayPercent: Math.round(ratio),
        bucket: bucketForScore(ratio),
      };
    }),
    segments: prepareSection(() => {
      return report.segments.sort((left, right) => right.expected_weight - left.expected_weight).map(segment => ({
        id: segment.segment_name,
        displayId: prettyId(segment.segment_name),
        expectedWeight: segment.expected_weight,
        expectedDisplay: formatNumber(segment.expected_weight),
        actualWeight: segment.actual_weight,
        actualDisplay: formatNumber(segment.actual_weight),
        iq: segment.iq,
        iqDisplay: `${Math.round(segment.iq)}%`,
        explanations: prepareSection(() => segment.explanations),
        cues: prepareSection(() => segment.cues),
      }));
    }),
    notes: prepareSection(() => report.notes
      .filter(({ message }) => !message.startsWith("Compliance gates") && !message.startsWith("Indexing quality"))
      .map(({ segment, message }): IqNoteView => ({
        segment: segment === null ? null : prettyId(segment),
        message,
        status: /^Unclassified indexes: (Optimal|Satisfied)\b/.test(message)
          ? UI_PASS
          : message.startsWith("WARNING:") || message.startsWith("Unclassified indexes") || message.startsWith("Missing indexes")
            ? UI_WARNING
            : "neutral",
      }))),
  };
}
