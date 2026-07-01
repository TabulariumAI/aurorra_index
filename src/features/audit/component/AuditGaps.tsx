import { useState, type JSX } from "react";
import type { AuditGapView } from "../type/audit.types";
import { auditStyles } from "../style/auditStyles";

type CollapseState = Record<string, boolean>;

const PREVIEW_LENGTH = 200;

type AuditGapsProps = {
  gaps: AuditGapView[];
};

function buildKey(gap: AuditGapView, index: number): string {
  return `${gap.aspect}|${gap.page}|${gap.date}|${index}`;
}

function normalizeMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim();
}

function isLongMessage(message: string): boolean {
  return normalizeMessage(message).length > PREVIEW_LENGTH;
}

function MessageText({ isOpen, message, onToggle }: {
  isOpen: boolean;
  message: string;
  onToggle: () => void;
}): JSX.Element {
  const normalized = normalizeMessage(message);
  if (!isLongMessage(normalized)) {
    return <div style={auditStyles.gapMessage}>{normalized}</div>;
  }

  const preview = `${normalized.slice(0, PREVIEW_LENGTH)}...`;
  const full = normalized;

  return (
    <div style={auditStyles.gapMessage}>
      {isOpen ? full : preview}
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

  if (gaps.length === 0) {
    return <div style={auditStyles.empty}>No gaps found.</div>;
  }

  return (
    <section aria-label="Audit gaps" style={auditStyles.gaps}>
      {gaps.map((gap, index) => {
        const key = buildKey(gap, index);
        const isOpen = expanded[key] === true;
        const safeMessage = normalizeMessage(gap.message);

        return (
          <article key={key} style={auditStyles.gapCard}>
            <div style={auditStyles.gapHeader}>
              <div style={auditStyles.gapAspect}>{gap.aspectLabel}</div>
              <div style={auditStyles.gapDate}>{gap.dateLabel}</div>
            </div>
            <MessageText
              isOpen={isOpen}
              message={safeMessage}
              onToggle={() => toggle(key)}
            />
            <div style={auditStyles.gapProcess}>{gap.processLabel}</div>
          </article>
        );
      })}
    </section>
  );
}
