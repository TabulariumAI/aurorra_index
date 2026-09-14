import * as Collapsible from "@radix-ui/react-collapsible";
import { useId, useState } from "react";
import { indexDetailsStyles } from "../style/indexDetailsStyles";
import { indexStyles } from "../style/indexStyles";
import type { IndexFields } from "../type/indexFields.types";

export function IndexDetails({ fields, onChange }: { fields: IndexFields; onChange(fields: IndexFields): void }) {
  const labelId = useId();
  const pageId = useId();
  const sourceId = useId();
  const [open, setOpen] = useState(false);
  return <Collapsible.Root onOpenChange={setOpen} open={open} style={indexDetailsStyles.root}>
    <Collapsible.Trigger asChild>
      <button aria-label="Additional details" style={indexDetailsStyles.trigger} type="button">
        <span>Additional details</span><span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
    </Collapsible.Trigger>
    <Collapsible.Content>
      <div style={indexDetailsStyles.content}>
        <label htmlFor={labelId} style={indexStyles.control}>
          <span style={indexStyles.label}>Label</span>
          <input id={labelId} onChange={(event) => onChange({ ...fields, label: event.target.value })} style={indexStyles.input} type="text" value={fields.label} />
        </label>
        <fieldset aria-label="Quote" data-testid="add-quote-field" style={indexDetailsStyles.quote}>
          <label htmlFor={sourceId} style={indexStyles.control}>
            <span style={indexStyles.label}>Source</span>
            <textarea id={sourceId} onChange={(event) => onChange({ ...fields, source: event.target.value })} rows={3} style={indexDetailsStyles.source} value={fields.source} />
          </label>
          <label htmlFor={pageId} style={indexStyles.control}>
            <span style={indexStyles.label}>Page Number</span>
            <input id={pageId} onChange={(event) => onChange({ ...fields, page: event.target.value })} style={indexStyles.input} type="text" value={fields.page} />
          </label>
        </fieldset>
      </div>
    </Collapsible.Content>
  </Collapsible.Root>;
}
