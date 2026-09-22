import { ConfButton, formatLabel } from "aurora-core";
import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { formatSelection } from "../data/addIndexData";
import { indexStyles } from "../../../shared/style/indexStyles";
import type { AddIndexPanelProps } from "../type/addIndex.types";
import { createIndexWorkerClient } from "../../metdataview/worker/metadataWorkerClient";
import { queueStoreApi } from "../../queue/store/queueStore";
import { IndexInput } from "../../../shared/component/IndexInput";
import { IndexDetails } from "../../../shared/component/IndexDetails";
import { useAspects } from "../../../shared/hook/useAspects";

export function AddIndexPanel({
  apiGatewayUrl,
  authToken,
  intervalMs,
  onQueueChange,
  batchCode,
  retryIntervalMs,
  retryLimit,
  onClose,
  onError,
  onReadyChange,
  onResource,
  segment,
  request,
  session,
  workerClient,
}: AddIndexPanelProps): JSX.Element {
  const { aspects, ready } = useAspects(request, onResource, onReadyChange, onError);
  const [selected, setSelected] = useState<string[]>([]);
  const [allowEnrichment, setAllowEnrichment] = useState(false);
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

  const pending = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const initial = useMemo(() => {
    if ("groups" in request) {
      const summary = formatSelection(request);
      return { index: summary.values, label: "", page: String(request.pageNumber), source: summary.context };
    } else {
      return { index: "", label: "", page: "", source: "" };
    }
  }, [request]);

  useEffect(() => {
    pending.current = false;
    setSubmitting(false);
    setFields(initial);
    setSelected([]);
    setAllowEnrichment(false);
  }, [initial]);

  const submit = async () => {
    if (!ready || !selected.length || !fields.index.trim() || pending.current) return;
    pending.current = true;
    setSubmitting(true);
    try {
      for (const group of Object.keys(aspects)) {
        const types = aspects[group].filter((type) => selected.includes(JSON.stringify([group, type])));
        if (!types.length) continue;
        await queueStoreApi.getState().enqueue({ batch: batchCode, session, segment: group, data: JSON.stringify(types.map((type) => ({
          action: "add", allow_enrichment: allowEnrichment, explanation: "Index created by user.",
          new_index_page: fields.page.trim(), new_index_source: fields.source,
          new_index_label: fields.label.trim() || formatLabel(type), new_index_aspect: type, new_index_value: fields.index,
          new_index_ambiguous: null, old_index_label: null, old_index_aspect: null, old_index_value: null,
        }))) }, { authToken, client, intervalMs, onChange: onQueueChange });
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
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };

  return (
    <section aria-label="Add selected index form" style={indexStyles.root}>
      <div inert={submitting} style={indexStyles.fields}>
        <IndexInput key={session} value={fields.index} aspects={aspects} segment={segment} selected={selected} onChange={(index) => setFields({ ...fields, index })} onSelect={setSelected} allowEnrichment={allowEnrichment} onEnrichmentChange={setAllowEnrichment} />
        <IndexDetails fields={fields} onChange={setFields} />
      </div>
      <div data-testid="add-index-actions" style={indexStyles.actions}>
        <ConfButton
          disabled={submitting || !ready || !selected.length || !fields.index.trim()}
          label="Add"
          onConfirm={() => void submit()}
          style={indexStyles.button("primary")}
          variant="primary"
        />
      </div>
    </section>
  );
}
