import { ConfButton, formatLabel } from "aurora-core";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useEffect, useId, useMemo, useState, type JSX } from "react";
import { aspectGroups, formatSelection } from "../data/addIndexData";
import { addIndexStyles } from "../style/addIndexStyles";
import type { AddIndexPanelProps } from "../type/addIndex.types";
import { createIndexWorkerClient } from "../../metdataview/worker/metadataWorkerClient";
import { queueStoreApi } from "../../queue/store/queueStore";
import { TypeSelect } from "./TypeSelect";

export function AddIndexPanel({
  apiGatewayUrl,
  authToken,
  intervalMs,
  batchCode,
  retryIntervalMs,
  retryLimit,
  onClose,
  onError,
  onReadyChange,
  onResource,
  segment,
  selection,
  session,
  workerClient,
}: AddIndexPanelProps): JSX.Element {
  const indexInputId = useId();
  const pageInputId = useId();
  const sourceInputId = useId();
  const labelInputId = useId();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [aspects, setAspects] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [fields, setFields] = useState({
    index: "",
    label: "",
    page: "",
    source: "",
  });
  const client = useMemo(
    () => workerClient || createIndexWorkerClient({ apiBaseUrl: apiGatewayUrl, retryIntervalMs, retryLimit }),
    [apiGatewayUrl, retryIntervalMs, retryLimit, workerClient],
  );

  useEffect(() => {
    let active = true;
    const summary = formatSelection(selection);
    setFields({
      index: summary.values,
      label: "",
      page: String(selection.pageNumber),
      source: summary.context,
    });
    setSelected([]);
    onReadyChange(false);
    void onResource({ resource: "aspects" })
      .then((resource) => {
        if (!active) return;
        const groups = aspectGroups(resource);
        setAspects(groups);
        onReadyChange(true);
      })
      .catch((resourceError) => {
        if (!active) return;
        const failure = resourceError as Error & { code?: string; details?: unknown; status?: number };
        onError({ code: failure.code, details: failure.details, error: failure.message, status: failure.status });
        onReadyChange(true);
      });
    return () => {
      active = false;
    };
  }, [onError, onReadyChange, onResource, selection]);

  const submit = async () => {
    try {
      for (const group of Object.keys(aspects)) {
        const types = aspects[group].filter((type) => selected.includes(JSON.stringify([group, type])));
        if (!types.length) continue;
        await queueStoreApi.getState().enqueue({ batch: batchCode, session, segment: group, data: JSON.stringify(types.map((type) => ({
          action: "add", explanation: `P ${fields.page.trim()}  ${fields.source}`,
          new_index_label: fields.label.trim() || formatLabel(type), new_index_aspect: type, new_index_value: fields.index,
          new_index_ambiguous: null, old_index_label: null, old_index_aspect: null, old_index_value: null,
        }))) }, { authToken, client, intervalMs });
      }
      onClose();
    } catch (submitError) {
      const failure = submitError as Error & {
        code?: string;
        details?: unknown;
        status?: number;
      };
      const workerError = {
        code: failure.code,
        details: failure.details,
        error: failure.message,
        status: failure.status,
      };
      onError(workerError);
    }
  };

  return (
    <section aria-label="Add selected index form" style={addIndexStyles.root}>
      <div style={addIndexStyles.fields}>
        <div data-testid="add-index-field" style={addIndexStyles.field}>
          <label htmlFor={indexInputId} style={addIndexStyles.label}>Index</label>
          <input
            id={indexInputId}
            onChange={(event) => setFields({ ...fields, index: event.target.value })}
            style={addIndexStyles.input}
            type="text"
            value={fields.index}
          />
        </div>
        <TypeSelect key={session} aspects={aspects} segment={segment} selected={selected} onChange={setSelected} />
        <Collapsible.Root onOpenChange={setAdvancedOpen} open={advancedOpen} style={addIndexStyles.advanced}>
          <Collapsible.Trigger asChild>
            <button aria-label="Advanced" style={addIndexStyles.advancedTrigger} type="button">
              <span>Advanced</span>
              <span aria-hidden="true">{advancedOpen ? "▴" : "▾"}</span>
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content style={advancedOpen ? addIndexStyles.advancedContent : undefined}>
              <div style={addIndexStyles.advancedRow}>
                <label htmlFor={labelInputId} style={addIndexStyles.control}>
                  <span style={addIndexStyles.label}>Label</span>
                  <input
                    id={labelInputId}
                    onChange={(event) => setFields({ ...fields, label: event.target.value })}
                    style={addIndexStyles.input}
                    type="text"
                    value={fields.label}
                  />
                </label>
                <label htmlFor={pageInputId} style={addIndexStyles.control}>
                  <span style={addIndexStyles.label}>Page Number</span>
                  <input
                    id={pageInputId}
                    onChange={(event) => setFields({ ...fields, page: event.target.value })}
                    style={addIndexStyles.input}
                    type="text"
                    value={fields.page}
                  />
                </label>
              </div>
              <fieldset aria-label="Quote" data-testid="add-quote-field" style={addIndexStyles.quoteField}>
                <label htmlFor={sourceInputId} style={addIndexStyles.control}>
                  <span style={addIndexStyles.label}>Source</span>
                  <textarea
                    id={sourceInputId}
                    onChange={(event) => setFields({ ...fields, source: event.target.value })}
                    rows={3}
                    style={addIndexStyles.textArea}
                    value={fields.source}
                  />
                </label>
              </fieldset>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
      <div data-testid="add-index-actions" style={addIndexStyles.actions}>
        <ConfButton
          disabled={!selected.length}
          label="Confirm"
          onConfirm={() => void submit()}
          style={addIndexStyles.button("primary")}
          variant="primary"
        />
        <ConfButton
          label="Cancel"
          onConfirm={onClose}
          requireConfirmation={false}
          showPrompt={false}
          style={addIndexStyles.button("secondary")}
          variant="secondary"
        />
      </div>
    </section>
  );
}
