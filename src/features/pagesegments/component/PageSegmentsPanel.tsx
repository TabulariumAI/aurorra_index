import * as Checkbox from "@radix-ui/react-checkbox";
import { useEffect, useMemo, type JSX } from "react";
import {
  getChoiceLevel,
  normalizePageSegments,
  PAGE_SEGMENT_CHOICES,
  PAGE_SEGMENT_LABELS,
  PAGE_SEGMENT_ORDER,
  updateCachedPageSegments,
} from "../data/pageSegmentsData";
import { pageSegmentsStyles } from "../style/pageSegmentsStyles";
import { pageSegmentsStoreApi, usePageSegmentsStore } from "../store/pageSegmentsStore";
import type { PageSegmentsPanelProps, PageSegmentsWorkerError } from "../type/pageSegments.types";
import { createPageSegmentsWorkerClient } from "../worker/pageSegmentsWorkerClient";

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toWorkerError(error: unknown): PageSegmentsWorkerError {
  const candidate = error as { code?: string; details?: unknown; error?: string; message?: string; status?: number };
  return {
    code: candidate.code,
    details: candidate.details,
    error: candidate.error ?? candidate.message ?? "Page segment update failed.",
    status: candidate.status,
  };
}

function sameSegments(left: string[], right: string[]): boolean {
  return left.join("|") === right.join("|");
}

function CheckboxIndicator(): JSX.Element {
  return (
    <Checkbox.Indicator style={pageSegmentsStyles.checkboxIndicator}>
      <svg aria-hidden="true" fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 16 16" width="12">
        <path d="m3 8 3 3 7-7" />
      </svg>
    </Checkbox.Indicator>
  );
}

export function PageSegmentsPanel({
  apiGatewayUrl,
  authToken,
  choices,
  onClose,
  onComplete,
  onError,
  onJobEvent,
  onReadyChange,
  pageClass,
  pageCode,
  segments,
  session,
  workerClient,
}: PageSegmentsPanelProps): JSX.Element {
  const committed = usePageSegmentsStore((state) => state.committed);
  const error = usePageSegmentsStore((state) => state.error);
  const selected = usePageSegmentsStore((state) => state.selected);
  const status = usePageSegmentsStore((state) => state.status);
  const client = useMemo(() => workerClient ?? createPageSegmentsWorkerClient({ apiBaseUrl: apiGatewayUrl }), [apiGatewayUrl, workerClient]);
  const normalizedInputKey = normalizePageSegments(segments).join("|");
  const isDirty = !sameSegments(committed, selected);
  const blankChecked = pageClass === "blank" && selected.length === 0;

  useEffect(() => {
    onReadyChange(status !== "saving");
  }, [onReadyChange, status]);

  useEffect(() => {
    pageSegmentsStoreApi.getState().reset(normalizedInputKey ? normalizedInputKey.split("|") : []);
    return () => {
      pageSegmentsStoreApi.getState().reset([]);
    };
  }, [normalizedInputKey, pageCode]);

  const setSegmentChecked = (segment: string, checked: boolean) => {
    const next = checked
      ? normalizePageSegments([...selected, segment])
      : selected.filter((value) => value !== segment);
    pageSegmentsStoreApi.getState().setSelected(next);
  };

  const submit = async () => {
    const submitted = [...selected];
    pageSegmentsStoreApi.getState().setSaving();
    const jobId = crypto.randomUUID();
    onJobEvent({ jobId, message: "Updating page segments", phase: "started", session });
    try {
      await client.updatePageSegments(authToken, session, pageCode, submitted);
      updateCachedPageSegments(session, pageCode, submitted);
      pageSegmentsStoreApi.getState().setSaved(submitted);
      onComplete({ pageCode, segments: submitted, session });
    } catch (submitError) {
      const workerError = toWorkerError(submitError);
      onJobEvent({ error: workerError.error, jobId, message: "Page segment update failed", phase: "failed", session });
      pageSegmentsStoreApi.getState().setError(workerError);
      onError({ error: workerError, pageCode, session });
      return;
    }
    onJobEvent({ jobId, message: "Page segments updated", phase: "completed", session });
  };

  return (
    <section aria-label="Page Segments" style={pageSegmentsStyles.root}>
      <h2 id="pageSegmentsTitle" style={pageSegmentsStyles.title}>{formatLabel(pageClass)} page</h2>
      <label htmlFor="pageBlankToggle" style={pageSegmentsStyles.blankRow}>
        <Checkbox.Root
          checked={blankChecked}
          id="pageBlankToggle"
          onCheckedChange={(checked) => {
            if (checked === true) {
              pageSegmentsStoreApi.getState().setSelected([]);
            }
          }}
          style={pageSegmentsStyles.checkboxRoot(false)}
        >
          <CheckboxIndicator />
        </Checkbox.Root>
        <span>This page is blank</span>
      </label>
      <span id="pageSegmentsSectionTitle" style={pageSegmentsStyles.sectionTitle}>Segments</span>
      <div style={pageSegmentsStyles.grid}>
        {PAGE_SEGMENT_ORDER.map((segment) => {
          const disabled = getChoiceLevel(choices, PAGE_SEGMENT_CHOICES[segment]) <= 0;
          return (
            <label htmlFor={`segment-${segment}`} key={segment} style={pageSegmentsStyles.item}>
              <Checkbox.Root
                checked={selected.includes(segment)}
                disabled={disabled}
                id={`segment-${segment}`}
                onCheckedChange={(checked) => setSegmentChecked(segment, checked === true)}
                style={pageSegmentsStyles.checkboxRoot(disabled)}
                value={segment}
              >
                <CheckboxIndicator />
              </Checkbox.Root>
              <span style={pageSegmentsStyles.itemText(disabled)}>{PAGE_SEGMENT_LABELS[segment]}</span>
            </label>
          );
        })}
      </div>
      {status === "success" ? (
        <div id="pageSegmentsMessage" style={pageSegmentsStyles.message("success")}>Page segment changes saved.</div>
      ) : null}
      {status === "error" && error ? (
        <div id="pageSegmentsMessage" style={pageSegmentsStyles.message("error")}>{`Page segment update failed. ${error.error}`.trim()}</div>
      ) : null}
      <footer id="pageSegmentsFooter" style={pageSegmentsStyles.footer}>
        {isDirty || status === "error" ? (
          <button disabled={status === "saving"} id="pageSegmentsSubmitBtn" onClick={() => void submit()} style={pageSegmentsStyles.button("primary")} type="button">
            Submit
          </button>
        ) : null}
        {status === "idle" || status === "success" ? (
          <button id="pageSegmentsCloseBtn" onClick={onClose} style={pageSegmentsStyles.button("secondary")} type="button">
            Close
          </button>
        ) : null}
        {isDirty || status === "error" ? (
          <button id="pageSegmentsCancelBtn" onClick={() => pageSegmentsStoreApi.getState().restore()} style={pageSegmentsStyles.button("secondary")} type="button">
            Cancel
          </button>
        ) : null}
      </footer>
    </section>
  );
}
