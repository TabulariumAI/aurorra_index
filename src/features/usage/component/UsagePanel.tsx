import { formStyles } from "aurora-core";
import * as Checkbox from "@radix-ui/react-checkbox";
import * as Popover from "@radix-ui/react-popover";
import { useId, useMemo, useState } from "react";
import { summarizeUsage, usageNames, usageRange } from "../data/usageData";
import { usageColors, usageStyles as styles } from "../style/usageStyles";
import type { UsageFilters, UsageRecord } from "../type/usage.types";

export function UsagePanel({ records }: { records: readonly UsageRecord[] }) {
  const id = useId();
  const range = usageRange(Date.now());
  const [filters, setFilters] = useState<UsageFilters>(() => ({ ...range, services: Object.keys(usageNames) as UsageRecord["name"][], period: "daily" }));
  const summaries = useMemo(() => summarizeUsage(records, { ...filters, services: Object.keys(usageNames) as UsageRecord["name"][] }), [records, filters]);
  const selected = summaries.filter(summary => filters.services.includes(summary.name));
  const groups = [
    selected.filter(summary => summary.name === "extraction" || summary.name === "iq_refinement"),
    ...selected.filter(summary => summary.name === "refinement" || summary.name === "model_generation").map(summary => [summary]),
  ].filter(group => group.length > 0);
  return (
    <div style={styles.root}>
      <div style={styles.filters}>
        <div style={styles.label}>
          <label htmlFor={id}>Service</label>
          <Popover.Root>
            <Popover.Trigger asChild>
              <button id={id} aria-label="Service" type="button" style={{ ...styles.input, ...styles.select }}>
                <span>{filters.services.length === Object.keys(usageNames).length ? "All services" : filters.services.length === 1 ? usageNames[filters.services[0]] : `${filters.services.length} services`}</span>
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m4 6 4 4 4-4" /></svg>
              </button>
            </Popover.Trigger>
            <Popover.Content aria-label="Services" role="group" align="start" sideOffset={6} collisionPadding={8} style={styles.options}>
              {(Object.keys(usageNames) as UsageRecord["name"][]).map(name => {
                const checked = filters.services.includes(name);
                const disabled = checked && filters.services.length === 1;
                return <label key={name} htmlFor={`${id}-${name}`} style={styles.option}>
                  <Checkbox.Root id={`${id}-${name}`} checked={checked} disabled={disabled} style={formStyles.checkbox(disabled, checked)}
                    onCheckedChange={value => setFilters({ ...filters, services: value === true ? [...filters.services, name] : filters.services.filter(service => service !== name) })}>
                    <Checkbox.Indicator aria-hidden style={{ fontSize: "0.75rem", lineHeight: 1 }}>✓</Checkbox.Indicator>
                  </Checkbox.Root>
                  {usageNames[name]}
                </label>;
              })}
            </Popover.Content>
          </Popover.Root>
        </div>
        <label style={styles.label}>From
          <input aria-label="From" type="date" style={styles.input} min={range.from} max={filters.to} value={filters.from} onChange={event => setFilters({ ...filters, from: event.target.value })} />
        </label>
        <label style={styles.label}>To
          <input aria-label="To" type="date" style={styles.input} min={filters.from} max={range.to} value={filters.to} onChange={event => setFilters({ ...filters, to: event.target.value })} />
        </label>
        <label style={styles.label}>Period
          <select aria-label="Period" style={styles.input} value={filters.period} onChange={event => setFilters({ ...filters, period: event.target.value as UsageFilters["period"] })}>
            <option value="daily">Daily</option><option value="weekly">Weekly</option>
          </select>
        </label>
        <span style={styles.caption}>UTC</span>
      </div>
      {groups.length === 0 ? <div style={styles.empty}>No usage in the selected period.</div> : groups.map(group => {
        const combined = group.some(summary => summary.name === "extraction" || summary.name === "iq_refinement");
        const label = combined ? "Extraction and IQ refinement" : usageNames[group[0].name];
        const points = [...new Set(group.flatMap(summary => summary.points.map(point => point.date)))].sort().map(date => {
          const values = group.map(summary => summary.points.reduce((value, point) => point.date === date ? { cost: value.cost + point.cost, pages: value.pages + point.pages } : value, { cost: 0, pages: 0 }));
          return { date, values: combined ? [{ cost: values.reduce((total, value) => total + value.cost, 0), pages: null }, ...values] : values };
        });
        const series = [...(combined ? [{ label: "Total", color: usageColors.total }] : []), ...group.map(summary => ({ label: usageNames[summary.name], color: usageColors[summary.name] }))];
        const max = Math.max(...points.flatMap(point => point.values.map(value => value.cost)));
        const step = 600 / points.length;
        return <section aria-label={`${label} usage`} key={label} style={styles.card}>
          <div style={styles.chart}>
            <svg role="img" aria-label={`${label} ${filters.period} cost chart`} viewBox="0 0 680 210" style={styles.svg}>
              <text x="0" y="14" fill="#64748b" fontSize="12">${max.toFixed(4)}</text>
              <line x1="60" x2="660" y1="24" y2="24" stroke="#e2e8f0" />
              <line x1="60" x2="660" y1="178" y2="178" stroke="#cbd5e1" />
              {points.map((point, index) => <g key={point.date}>
                {point.values.map((value, position) => {
                  const height = max === 0 ? 0 : value.cost / max * 146;
                  const width = step * 0.7;
                  return <rect key={series[position].label} x={60 + index * step + (step - width) / 2} y={178 - height} width={width} height={height} rx="2" fill={series[position].color}>
                    <title>{`${series[position].label} ${point.date}: $${value.cost.toFixed(4)}${value.pages === null ? "" : `, ${value.pages} pages`}`}</title>
                  </rect>;
                })}
                {index % Math.ceil(points.length / 8) === 0 ? <text x={60 + index * step + step / 2} y="199" textAnchor="middle" fill="#64748b" fontSize="12">{point.date.slice(5)}</text> : null}
              </g>)}
              <text x="16" y="181" fill="#64748b" fontSize="12">$0</text>
            </svg>
          </div>
          <div style={styles.summaries}>
            {combined && <section aria-label="Totals usage" style={styles.total}>
              <h3 style={styles.title}>Totals</h3>
              <dl style={styles.metrics}>
                <div style={styles.metric}><dt style={styles.caption}>Service cost</dt><dd style={styles.value}>${group.reduce((total, summary) => total + summary.cost, 0).toFixed(4)}</dd></div>
                <div style={styles.metric}><dt style={styles.caption}>Average page cost</dt><dd style={styles.value}>{group.every(summary => summary.average === null) ? "No pages used" : `$${group.reduce((total, summary) => summary.average === null ? total : total + summary.average, 0).toFixed(4)}`}</dd></div>
              </dl>
            </section>}
            {group.map(summary => <section aria-label={combined ? `${usageNames[summary.name]} usage` : undefined} key={summary.name} style={styles.serviceSummary}>
              <h3 style={styles.title}><span aria-hidden="true" style={{ ...styles.swatch, background: usageColors[summary.name] }} />{usageNames[summary.name]}</h3>
              <dl style={styles.metrics}>
                <div style={styles.metric}><dt style={styles.caption}>Service cost</dt><dd style={styles.value}>${summary.cost.toFixed(4)}</dd></div>
                {summary.name !== "model_generation" && <>
                  <div style={styles.metric}><dt style={styles.caption}>Sessions</dt><dd style={styles.value}>{summary.sessions}</dd></div>
                  <div style={styles.metric}><dt style={styles.caption}>Pages used</dt><dd style={styles.value}>{summary.pages}</dd></div>
                  <div style={styles.metric}><dt style={styles.caption}>Average page cost</dt><dd style={styles.value}>{summary.average === null ? "No pages used" : `$${summary.average.toFixed(4)}`}</dd></div>
                </>}
              </dl>
            </section>)}
          </div>
        </section>;
      })}
      <section aria-label="Total Service Costs" style={{ ...styles.metrics, alignItems: "baseline" }}>
        <h3 style={{ ...styles.title, margin: 0 }}>Total Service Costs</h3>
        <p style={styles.value}>${summaries.reduce((total, summary) => total + summary.cost, 0).toFixed(4)}</p>
      </section>
    </div>
  );
}
