import { useId } from "react";
import { indexStyles } from "../style/indexStyles";
import { TypeSelect } from "./TypeSelect";

export function IndexInput({ value, aspects, segment, selected, onChange, onSelect }: {
  value: string;
  aspects: Record<string, string[]>;
  segment: string;
  selected: string[];
  onChange(value: string): void;
  onSelect(selected: string[]): void;
}) {
  const id = useId();
  return <>
    <div data-testid="add-index-field" style={indexStyles.field}>
      <label htmlFor={id} style={indexStyles.label}>Index</label>
      <input id={id} onChange={(event) => onChange(event.target.value)} style={indexStyles.input} type="text" value={value} />
    </div>
    <TypeSelect aspects={aspects} segment={segment} selected={selected} onChange={onSelect} />
  </>;
}
