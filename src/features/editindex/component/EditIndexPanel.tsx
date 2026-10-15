import { formStyles, ConfButton } from "aurora-core";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { IndexInput } from "../../../shared/component/IndexInput";
import { IndexDetails } from "../../../shared/component/IndexDetails";
import { useAspects } from "../../../shared/hook/useAspects";
import type { IndexFields } from "../../../shared/type/indexFields.types";
import { createIndexWorkerClient } from "../../metdataview/worker/metadataWorkerClient";
import { queueStoreApi } from "../../queue/store/queueStore";
import type { IndexChange } from "../../queue/type/queue.types";
import type { EditIndexPanelProps } from "../type/editIndex.types";

export function EditIndexPanel({ apiGatewayUrl, authToken, batchCode, intervalMs, onQueueChange, retryIntervalMs, retryLimit, request, onClose, onError, onReadyChange, onResource, workerClient }: EditIndexPanelProps) {
  const [fields, setFields] = useState<IndexFields>({ index: "", label: "", page: "", source: "" });
  const [selected, setSelected] = useState<string[]>([]);
  const [allowEnrichment, setAllowEnrichment] = useState(false);
  const { aspects, ready } = useAspects(request, onResource, onReadyChange, onError);
  const inputFields = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = inputFields.current;
    if (!element) return;
    element.style.height = "auto";
    if (ready) element.style.height = `${element.getBoundingClientRect().height}px`;
  }, [ready, request]);
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
  const change: IndexChange = {
    action: "update", allow_enrichment: allowEnrichment, explanation: `P ${fields.page.trim()}  ${fields.source}`,
    new_index_value: fields.index.trim() && fields.index.trim() !== initial.fields.index.trim() ? fields.index : null,
    new_index_label: fields.label.trim() && fields.label.trim() !== initial.fields.label.trim() ? fields.label : null,
    new_index_aspect: selectedAspects.slice().sort().join(",") !== originalAspects.sort().join(",") ? selectedAspects.join(",") : null,
    new_index_ambiguous: null,
    old_index_label: request.index.label ?? null, old_index_aspect: request.index.aspect ?? null, old_index_value: request.index.value ?? null,
  };
  const dirty = change.new_index_value !== null || change.new_index_label !== null || change.new_index_aspect !== null;

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
      await queueStoreApi.getState().enqueue({ batch: batchCode, session: request.session, segment: request.segment, data: JSON.stringify([change]) }, { authToken, client, intervalMs, onChange: onQueueChange });
      onClose();
    } catch (submitError) {
      const failure = submitError as Error & { code?: string; details?: unknown; status?: number };
      onError({ code: failure.code, details: failure.details, error: failure.message, status: failure.status });
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  return <section aria-label="Edit index form" style={{ ...formStyles.root, flex: "1 1 auto", overflow: "hidden" }}>
    <div inert={submitting} style={{ ...formStyles.fields, alignContent: "start", boxSizing: "border-box", flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "0.35rem" }}>
      <div ref={inputFields} style={{ ...formStyles.fields, alignContent: "start", boxSizing: "border-box", minHeight: 0, overflowY: "auto", padding: "0.35rem" }}>
        <IndexInput key={request.session} value={fields.index} aspects={aspects} segment={request.segment} selected={selected} onChange={(index) => setFields({ ...fields, index })} onSelect={setSelected} allowEnrichment={allowEnrichment} onEnrichmentChange={setAllowEnrichment} />
      </div>
      <IndexDetails fields={fields} onChange={setFields} />
    </div>
    <div style={formStyles.actions}>
      <ConfButton disabled={!dirty || submitting || !ready || !selected.length || !fields.index.trim()} label="Update" onConfirm={() => void submit()} style={formStyles.button} variant="primary" />
    </div>
  </section>;
}
