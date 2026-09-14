import * as Checkbox from "@radix-ui/react-checkbox";
import { ConfButton } from "aurora-core";
import { useEffect, useMemo, type JSX } from "react";
import {
  getChoiceLevel,
  normalizePageSegments,
  PAGE_SEGMENT_CHOICES,
  PAGE_SEGMENT_LABELS,
  PAGE_SEGMENT_ORDER,
} from "../data/pageSegmentsData";
import { pageSegmentsStyles } from "../style/pageSegmentsStyles";
import { pageSegmentsStoreApi, usePageSegmentsStore } from "../store/pageSegmentsStore";
import type { PageSegmentsPanelProps, PageSegmentsWorkerError } from "../type/pageSegments.types";
import { createIndexWorkerClient } from "../../metdataview/worker/metadataWorkerClient";
import { queueStoreApi } from "../../queue/store/queueStore";

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
  batchCode,
  intervalMs,
  retryIntervalMs,
  retryLimit,
  onError,
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
  const client = useMemo(() => workerClient ?? createIndexWorkerClient({ apiBaseUrl: apiGatewayUrl, retryIntervalMs, retryLimit }), [apiGatewayUrl, retryIntervalMs, retryLimit, workerClient]);
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
    if (pageSegmentsStoreApi.getState().status === "saving" || !isDirty) return;
    const submitted = [...selected];
    pageSegmentsStoreApi.getState().setSaving();
    try {
      await queueStoreApi.getState().enqueue({ action: "page", code: pageCode, segments: submitted, session, batch: batchCode, segment: "page" }, { authToken, client, intervalMs });
      onClose();
    } catch (submitError) {
      const workerError = toWorkerError(submitError);
      pageSegmentsStoreApi.getState().setError(workerError);
      onError({ error: workerError, pageCode, session });
      return;
    }
  };

  return (
    <section aria-label="Page Segments" style={pageSegmentsStyles.root}>
      <label htmlFor="pageBlankToggle" style={pageSegmentsStyles.blankRow}>
        <Checkbox.Root
          checked={blankChecked}
          disabled={status === "saving"}
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
                disabled={disabled || status === "saving"}
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
      {status === "error" && error ? (
        <div id="pageSegmentsMessage" style={pageSegmentsStyles.message}>Page segment changes could not be saved. Please try again.</div>
      ) : null}
      <footer id="pageSegmentsFooter" style={pageSegmentsStyles.footer}>
        <ConfButton disabled={!isDirty || status === "saving"} id="pageSegmentsSubmitBtn" label="Update" onConfirm={() => void submit()} requireConfirmation={false} style={pageSegmentsStyles.button("primary")} variant="primary" />
      </footer>
    </section>
  );
}
