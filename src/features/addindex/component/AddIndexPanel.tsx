import { ConfButton } from "aurorra-ui";
import { useEffect, useId, useMemo, useState, type JSX } from "react";
import { formatSelection } from "../data/addIndexData";
import { addIndexStyles } from "../style/addIndexStyles";
import type { AddIndexPanelProps, AddIndexWorkerError } from "../type/addIndex.types";
import { createAddIndexWorkerClient } from "../worker/addIndexWorkerClient";

export function AddIndexPanel({
  apiGatewayUrl,
  authToken,
  onClose,
  onComplete,
  onError,
  onJobEvent,
  onReadyChange,
  selection,
  session,
  workerClient,
}: AddIndexPanelProps): JSX.Element {
  const indexInputId = useId();
  const pageInputId = useId();
  const sourceInputId = useId();
  const typeInputId = useId();
  const [fields, setFields] = useState({
    index: "",
    page: "",
    source: "",
    type: "",
  });
  const client = useMemo(
    () => workerClient || createAddIndexWorkerClient({ apiBaseUrl: apiGatewayUrl }),
    [apiGatewayUrl, workerClient],
  );

  useEffect(() => {
    const summary = formatSelection(selection);
    setFields({
      index: summary.values,
      page: String(selection.pageNumber),
      source: summary.context,
      type: "",
    });
    onReadyChange(true);
  }, [onReadyChange, selection]);

  const submit = async () => {
    const jobId = crypto.randomUUID();
    const request = {
      aspect: fields.type.trim(),
      source: `P ${fields.page.trim()}  ${fields.source}`,
      value: fields.index,
    };
    onClose();
    onJobEvent({ jobId, message: "Adding index", phase: "started", session });
    try {
      await client.addIndex(authToken, session, request);
      onJobEvent({ jobId, message: "Index added", phase: "completed", session });
      onComplete({ ...request, session });
    } catch (submitError) {
      const failure = submitError as Error & {
        code?: string;
        details?: unknown;
        status?: number;
      };
      const workerError: AddIndexWorkerError = {
        code: failure.code,
        details: failure.details,
        error: failure.message,
        status: failure.status,
      };
      onJobEvent({ error: workerError.error, jobId, message: "Index add failed", phase: "failed", session });
      onError(workerError);
    }
  };

  return (
    <section aria-label="Add selected index form" style={addIndexStyles.root}>
      <h2 style={addIndexStyles.title}>Add selected index</h2>
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
        <fieldset data-testid="add-quote-field" style={addIndexStyles.quoteField}>
          <legend style={addIndexStyles.legend}>Quote</legend>
          <div style={addIndexStyles.quoteControls}>
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
            <label htmlFor={sourceInputId} style={addIndexStyles.control}>
              <span style={addIndexStyles.label}>Source</span>
              <textarea
                id={sourceInputId}
                onChange={(event) => setFields({ ...fields, source: event.target.value })}
                rows={5}
                style={addIndexStyles.textArea}
                value={fields.source}
              />
            </label>
          </div>
        </fieldset>
        <div data-testid="add-type-field" style={addIndexStyles.field}>
          <label htmlFor={typeInputId} style={addIndexStyles.label}>Type</label>
          <input
            id={typeInputId}
            onChange={(event) => setFields({ ...fields, type: event.target.value })}
            required
            style={addIndexStyles.input}
            type="text"
            value={fields.type}
          />
        </div>
      </div>
      <div data-testid="add-index-actions" style={addIndexStyles.actions}>
        <ConfButton
          disabled={!fields.type.trim()}
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
