import { formatLabel } from "aurora-core";
import { useEffect, useId, useRef, useState } from "react";
import { addIndexStyles } from "../style/addIndexStyles";
import { typeSelectStyles as styles } from "../style/typeSelectStyles";

type TypeSelectProps = {
  aspects: Record<string, string[]>;
  segment: string;
  selected: string[];
  onChange(selected: string[]): void;
};

export function TypeSelect({ aspects, segment, selected, onChange }: TypeSelectProps) {
  const id = useId();
  const field = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const activeOption = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const terms = formatLabel(search).toLowerCase().trim().split(/\s+/).filter(Boolean);
  const all = Object.entries(aspects)
    .sort(([left], [right]) => Number(right === segment) - Number(left === segment))
    .flatMap(([group, types]) => types.map((type) => ({ group, type, key: JSON.stringify([group, type]), label: formatLabel(type) })));
  const choices = all.filter((choice) => !selected.includes(choice.key) && terms.every((term) =>
    `${formatLabel(choice.group)} ${choice.label}`.toLowerCase().includes(term),
  ));

  useEffect(() => {
    if (!open) return;
    function dismiss(event: MouseEvent) {
      if (event.target instanceof Node && !field.current?.contains(event.target)) {
        setOpen(false);
        setActive(-1);
      }
    }
    document.addEventListener("click", dismiss, true);
    return () => document.removeEventListener("click", dismiss, true);
  }, [open]);

  useEffect(() => {
    const option = activeOption.current;
    const results = list.current;
    if (!open || !option || !results) return;
    const item = option.getBoundingClientRect();
    const viewport = results.getBoundingClientRect();
    if (item.top < viewport.top) results.scrollTop -= Math.ceil(viewport.top - item.top);
    else if (item.bottom > viewport.bottom) results.scrollTop += Math.ceil(item.bottom - viewport.bottom);
  }, [active, open, search]);

  function choose(key: string) {
    onChange([...selected, key]);
    setSearch("");
    setActive(-1);
    input.current?.focus();
  }

  function remove(key: string) {
    onChange(selected.filter((item) => item !== key));
    setActive(-1);
    input.current?.focus();
  }

  return (
    <div ref={field} data-testid="add-type-field" style={addIndexStyles.field}>
      <label htmlFor={id} style={addIndexStyles.label}>Type</label>
      <div style={{ ...styles.control, ...(open ? styles.focused : {}) }}>
        {selected.length > 0 && <div style={styles.chips}>
          {selected.map((key) => {
            const [group, type] = JSON.parse(key) as [string, string];
            const label = formatLabel(type);
            const duplicate = all.filter((choice) => choice.label === label).length > 1;
            return <span key={key} style={styles.chip}>
              <span style={styles.chipLabel}>{label}{duplicate ? ` (${formatLabel(group)})` : ""}</span>
              <button type="button" aria-label={`Remove ${label} (${formatLabel(group)})`}
                onClick={() => remove(key)} style={styles.remove}><span aria-hidden="true">×</span></button>
            </span>;
          })}
        </div>}
        <input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open}
          aria-controls={open ? `${id}-list` : undefined}
          aria-activedescendant={open && active >= 0 && choices[active] ? `${id}-option-${active}` : undefined}
          autoComplete="off" placeholder={selected.length ? "Add another type…" : "Search types…"}
          style={styles.search} value={search}
          onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
          onChange={(event) => { setSearch(event.target.value); setActive(0); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive(event.key === "ArrowDown" ? Math.min(active + 1, choices.length - 1) : active <= 0 ? choices.length - 1 : active - 1);
            } else if (event.key === "Enter" && open) {
              event.preventDefault();
              if (choices[active]) choose(choices[active].key);
            } else if (event.key === "Escape" && open) {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              setActive(-1);
            } else if (event.key === "Backspace" && !search && selected.length) {
              event.preventDefault();
              remove(selected[selected.length - 1]);
            } else if (event.key === "Tab") {
              setOpen(false);
              setActive(-1);
            }
          }} />
        {open && <div ref={list} id={`${id}-list`} role="listbox" aria-label="Type suggestions" aria-multiselectable="true" style={styles.results}>
          {[...new Set(choices.map((choice) => choice.group))].map((group) => <div key={group} role="group" aria-label={formatLabel(group)}>
            <div aria-hidden="true" style={styles.group}>{formatLabel(group)}</div>
            {choices.map((choice, index) => choice.group === group && <div key={choice.key}
              ref={active === index ? activeOption : undefined} id={`${id}-option-${index}`}
              role="option" aria-selected="false" style={{ ...styles.option, ...(active === index ? styles.active : {}) }}
              onMouseDown={(event) => event.preventDefault()} onMouseMove={() => setActive(index)}
              onClick={() => choose(choice.key)}>{choice.label}</div>)}
          </div>)}
          {!choices.length && <div role="status" style={styles.empty}>{selected.length === all.length && all.length ? "All types selected" : "No matching types"}</div>}
        </div>}
      </div>
    </div>
  );
}
