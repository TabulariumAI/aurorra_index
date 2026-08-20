import { ConfButton } from "aurorra-ui";
import { useEffect, useId, useMemo, useState, type JSX } from "react";
import { formatSelection } from "../data/addIndexData";
import { addIndexStyles } from "../style/addIndexStyles";
import type { AddIndexPanelProps, AddIndexResponse, AddIndexWorkerClient, AddIndexWorkerError } from "../type/addIndex.types";
import { createAddIndexWorkerClient } from "../worker/addIndexWorkerClient";

async function waitForPatch(client: AddIndexWorkerClient, authToken: string, session: string, intervalMs: number, result: AddIndexResponse): Promise<void> {
  let patch = result;
  while (patch.status === "pending" || patch.status === "processing") {
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
    patch = await client.patchStatus(authToken, session, patch.version);
  }
  if (patch.status === "error") throw new Error(patch.data || "The refinement patch failed.");
}

export function AddIndexPanel({
  apiGatewayUrl,
  authToken,
  intervalMs,
  onClose,
  onComplete,
  onError,
  onReadyChange,
  segment,
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
    const request = {
      aspect: fields.type.trim(),
      explanation: `P ${fields.page.trim()}  ${fields.source}`,
      label: fields.type.trim(),
      segment,
      value: fields.index,
    };
    onClose();
    try {
      const result = await client.addIndex(authToken, session, request);
      await waitForPatch(client, authToken, session, intervalMs, result);
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
