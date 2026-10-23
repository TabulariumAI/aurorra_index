import { useId, useLayoutEffect, useRef, useState } from "react";
import { legalMapStyles } from "../style/legalMapStyles";

export function useMapTabs(tabs: string[], label: string, kind: "view" | "detail") {
  const id = useId();
  const [selected, setSelected] = useState(tabs[0]);
  const focusTab = useRef(false);
  const active = tabs.includes(selected) ? selected : tabs[0];

  useLayoutEffect(() => {
    if (focusTab.current) {
      document.getElementById(`${id}-tab-${tabs.indexOf(active)}`)?.focus();
      focusTab.current = false;
    }
  }, [active, id, tabs]);

  const controls = <div role="tablist" aria-label={label} className={`legal-map-tabs legal-map-${kind}-tabs`} style={kind === "detail" ? legalMapStyles.detailTabs : legalMapStyles.tabs}>
    {tabs.map((tab, index) => <button
      key={tab}
      type="button"
      role="tab"
      id={`${id}-tab-${index}`}
      aria-controls={`${id}-panel`}
      aria-selected={active === tab}
      style={kind === "detail" ? legalMapStyles.detailTab(active === tab) : { ...legalMapStyles.tabButton, color: active === tab ? "var(--primary-dark)" : "var(--body-ink)" }}
      tabIndex={active === tab ? 0 : -1}
      onClick={() => { focusTab.current = active !== tab; setSelected(tab); }}
      onKeyDown={event => {
        let next: number;
        switch (event.key) {
          case "ArrowRight": next = (index + 1) % tabs.length; break;
          case "ArrowLeft": next = (index + tabs.length - 1) % tabs.length; break;
          case "Home": next = 0; break;
          case "End": next = tabs.length - 1; break;
          default: return;
        }
        event.preventDefault();
        focusTab.current = true;
        setSelected(tabs[next]);
      }}
    >{tab}</button>)}
  </div>;

  return {
    active,
    controls,
    panel: { role: "tabpanel" as const, id: `${id}-panel`, "aria-labelledby": `${id}-tab-${tabs.indexOf(active)}`, tabIndex: 0 },
  };
}
