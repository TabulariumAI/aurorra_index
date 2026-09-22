import { ConfButton } from "aurora-core";
import { useEffect, useMemo, useRef, useState } from "react";
import { IndexInput } from "../../../shared/component/IndexInput";
import { IndexDetails } from "../../../shared/component/IndexDetails";
import { useAspects } from "../../../shared/hook/useAspects";
import { indexStyles } from "../../../shared/style/indexStyles";
import type { IndexFields } from "../../../shared/type/indexFields.types";
import { createIndexWorkerClient } from "../../metdataview/worker/metadataWorkerClient";
import { queueStoreApi } from "../../queue/store/queueStore";
import type { EditIndexPanelProps } from "../type/editIndex.types";

export function EditIndexPanel({ apiGatewayUrl, authToken, batchCode, intervalMs, onQueueChange, retryIntervalMs, retryLimit, request, onClose, onError, onReadyChange, onResource, workerClient }: EditIndexPanelProps) {
  const [fields, setFields] = useState<IndexFields>({ index: "", label: "", page: "", source: "" });
  const [selected, setSelected] = useState<string[]>([]);
  const [allowEnrichment, setAllowEnrichment] = useState(false);
  const { aspects, ready } = useAspects(request, onResource, onReadyChange, onError);
  const client = useMemo(() => workerClient || createIndexWorkerClient({ apiBaseUrl: apiGatewayUrl, retryIntervalMs, retryLimit }), [apiGatewayUrl, retryIntervalMs, retryLimit, workerClient]);

  const pending = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const initial = useMemo(() => {
    const { index, segment } = request;
    return {
      fields: { index: index.value ?? "", label: index.label ?? "", page: String(index.page ?? index.page_number ?? ""), source: index.source ?? "" },
      selected: (index.aspect ?? "").split(",").map((aspect) => aspect.trim()).filter(Boolean).map((aspect) => JSON.stringify([segment, aspect])),
    };
  }, [request]);
  const selectedAspects = selected.map((key) => (JSON.parse(key) as [string, string])[1]);
  const originalAspects = initial.selected.map((key) => (JSON.parse(key) as [string, string])[1]);
  const dirty = fields.index !== initial.fields.index || fields.label !== initial.fields.label
    || fields.source !== initial.fields.source || fields.page.trim() !== initial.fields.page.trim()
    || selectedAspects.slice().sort().join(",") !== originalAspects.slice().sort().join(",");

  useEffect(() => {
    pending.current = false;
    setSubmitting(false);
    setFields(initial.fields);
    setSelected(initial.selected);
    setAllowEnrichment(false);
  }, [initial]);

  async function submit() {
    if (!dirty || !ready || !selected.length || !fields.index.trim() || pending.current) return;
    pending.current = true;
    setSubmitting(true);
    try {
      await queueStoreApi.getState().enqueue({ batch: batchCode, session: request.session, segment: request.segment, data: JSON.stringify([{
        action: "update", allow_enrichment: allowEnrichment, explanation: `P ${fields.page.trim()}  ${fields.source}`,
        new_index_label: fields.label, new_index_aspect: selectedAspects.join(","),
        new_index_value: fields.index, new_index_ambiguous: null,
        old_index_label: request.index.label ?? null, old_index_aspect: request.index.aspect ?? null, old_index_value: request.index.value ?? null,
      }]) }, { authToken, client, intervalMs, onChange: onQueueChange });
      onClose();
    } catch (submitError) {
      const failure = submitError as Error & { code?: string; details?: unknown; status?: number };
      onError({ code: failure.code, details: failure.details, error: failure.message, status: failure.status });
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  return <section aria-label="Edit index form" style={indexStyles.root}>
    <div inert={submitting} style={indexStyles.fields}>
      <IndexInput key={request.session} value={fields.index} aspects={aspects} segment={request.segment} selected={selected} onChange={(index) => setFields({ ...fields, index })} onSelect={setSelected} allowEnrichment={allowEnrichment} onEnrichmentChange={setAllowEnrichment} />
      <IndexDetails fields={fields} onChange={setFields} />
    </div>
    <div style={indexStyles.actions}>
      <ConfButton disabled={!dirty || submitting || !ready || !selected.length || !fields.index.trim()} label="Update" onConfirm={() => void submit()} style={indexStyles.button("primary")} variant="primary" />
    </div>
  </section>;
}
