import { useState, type JSX } from "react";
import { LoadPlaceholder } from "aurora-core";
import type { AuditGapView } from "../type/audit.types";
import { auditStyles } from "../style/auditStyles";

type CollapseState = Record<string, boolean>;

const PREVIEW_LENGTH = 200;

type AuditGapsProps = {
  gaps: AuditGapView[] | null;
};

function buildKey(gap: AuditGapView, index: number): string {
  return `${gap.aspect}|${gap.page}|${gap.date}|${index}`;
}

function MessageText({ isOpen, message, onToggle }: {
  isOpen: boolean;
  message: string;
  onToggle: () => void;
}): JSX.Element {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (normalized.length <= PREVIEW_LENGTH) {
    return <div style={auditStyles.gapMessage}>{normalized}</div>;
  }

  return (
    <div style={auditStyles.gapMessage}>
      {isOpen ? normalized : `${normalized.slice(0, PREVIEW_LENGTH)}...`}
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
        style={{ ...auditStyles.toggle, whiteSpace: "nowrap", marginLeft: "0.25rem" }}
      >
        {isOpen ? "[Show less]" : "[Show more]"}
      </a>
    </div>
  );
}

export function AuditGaps({ gaps }: AuditGapsProps): JSX.Element {
  const [expanded, setExpanded] = useState<CollapseState>({});

  function toggle(messageKey: string): void {
    setExpanded((state) => ({ ...state, [messageKey]: !state[messageKey] }));
  }

  if (gaps === null) return <LoadPlaceholder label="Loading audit gaps" />;

  if (gaps.length === 0) {
    return <div style={auditStyles.empty}>No gaps found.</div>;
  }

  return (
    <section aria-label="Audit gaps" style={auditStyles.gaps}>
      {gaps.map((gap, index) => {
        const key = buildKey(gap, index);
        const isOpen = expanded[key] === true;
        const patch = gap.patch;
        const hasIndex = patch?.value != null && patch.value.trim() !== "";
        const details = [
          ["Target label", patch?.identifier?.label],
          ["Target aspect", patch?.identifier?.aspect],
          ["Target index", patch?.identifier?.value],
          ["Index", hasIndex && patch?.field.trim() ? `${patch.value} (${patch.field})` : patch?.value],
          ["Field", hasIndex ? null : patch?.field],
          ["Page", gap.page],
          ["Source", patch?.source],
        ].filter(([, value]) => value != null && String(value).trim() !== "");

        return (
          <article key={key} style={auditStyles.gapCard}>
            <div style={auditStyles.gapHeader}>
              <div style={auditStyles.gapAspect}>{gap.aspectLabel}</div>
              <div style={auditStyles.gapDate}>{gap.dateLabel}</div>
            </div>
            {details.length > 0 && (
              <dl style={auditStyles.details}>
                {details.map(([label, value]) => (
                  <div key={label} style={auditStyles.detailRow}>
                    <dt style={auditStyles.detailLabel}>{label}</dt>
                    <dd style={auditStyles.detailValue}>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <MessageText
              isOpen={isOpen}
              message={gap.message}
              onToggle={() => toggle(key)}
            />
            <div style={auditStyles.gapFooter}>
              <div style={auditStyles.gapProcess}>{gap.processLabel}</div>
              {gap.segment && <div style={auditStyles.gapSegment}>{gap.segment}</div>}
            </div>
          </article>
        );
      })}
    </section>
  );
}
