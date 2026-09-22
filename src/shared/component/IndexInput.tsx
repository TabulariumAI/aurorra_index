import * as Checkbox from "@radix-ui/react-checkbox";
import { useEffect, useId } from "react";
import { indexStyles } from "../style/indexStyles";
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
    <div data-testid="add-index-field" style={indexStyles.field}>
      <label htmlFor={id} style={indexStyles.label}>Index</label>
      <input id={id} onChange={(event) => onChange(event.target.value)} style={indexStyles.input} type="text" value={value} />
    </div>
    <TypeSelect aspects={aspects} segment={segment} selected={selected} onChange={onSelect} />
    <label htmlFor={`${id}-enrichment`} style={indexStyles.checkboxRow}>
      <Checkbox.Root id={`${id}-enrichment`} checked={eligible && allowEnrichment} disabled={!eligible}
        onCheckedChange={(checked) => onEnrichmentChange(checked === true)} style={indexStyles.checkbox(!eligible, allowEnrichment)}>
        <Checkbox.Indicator aria-hidden style={{ fontSize: "0.75rem", lineHeight: 1 }}>{"\u2713"}</Checkbox.Indicator>
      </Checkbox.Root>
      Enhancement
    </label>
  </>;
}
