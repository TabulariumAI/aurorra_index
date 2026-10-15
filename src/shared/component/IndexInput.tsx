import { formStyles } from "aurora-core";
import * as Checkbox from "@radix-ui/react-checkbox";
import { useEffect, useId } from "react";
import { TypeSelect } from "./TypeSelect";

export function IndexInput({ value, aspects, segment, selected, onChange, onSelect, allowEnrichment, onEnrichmentChange }: {
  value: string;
  aspects: Record<string, string[]>;
  segment: string;
  selected: string[];
  onChange(value: string): void;
  onSelect(selected: string[]): void;
  allowEnrichment: boolean;
  onEnrichmentChange(checked: boolean): void;
}) {
  const id = useId();
  const eligible = ["party", "property"].includes(segment.toLowerCase());
  useEffect(() => {
    if (!eligible) onEnrichmentChange(false);
  }, [eligible, onEnrichmentChange]);
  return <>
    <div data-testid="add-index-field" style={formStyles.field}>
      <label htmlFor={id} style={formStyles.label}>Index</label>
      <input id={id} onChange={(event) => onChange(event.target.value)} style={formStyles.input} type="text" value={value} />
    </div>
    <TypeSelect aspects={aspects} segment={segment} selected={selected} onChange={onSelect} />
    <label htmlFor={`${id}-enrichment`} style={formStyles.checkboxRow}>
      <Checkbox.Root id={`${id}-enrichment`} checked={eligible && allowEnrichment} disabled={!eligible}
        onCheckedChange={(checked) => onEnrichmentChange(checked === true)} style={formStyles.checkbox(!eligible, allowEnrichment)}>
        <Checkbox.Indicator aria-hidden style={{ fontSize: "0.75rem", lineHeight: 1 }}>{"\u2713"}</Checkbox.Indicator>
      </Checkbox.Root>
      Enhancement
    </label>
  </>;
}
