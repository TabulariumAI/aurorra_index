import * as Tooltip from "@radix-ui/react-tooltip";
import { useState, type JSX, type ReactNode } from "react";
import { isAmbiguous } from "../data/metadataData";
import { rowStyles } from "../style/metadataStyles";
import type { IndexActionPayload, IndexMetadataCallbacks, MetadataIndex } from "../type/metadata.types";

export function formatLabel(value: unknown): string {
  return String(value || "")
    .split("_")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function cleanText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function ActionButton({
  children,
  disabled = false,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
}) {
  const [isInteracting, setInteracting] = useState(false);
  const interactionStyles = isInteracting ? rowStyles.actionButtonHover : null;

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          aria-label={label}
          className="metadata-row-action"
          disabled={disabled}
          onFocus={() => {
            if (!disabled) {
              setInteracting(true);
            }
          }}
          onBlur={() => setInteracting(false)}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClick?.();
          }}
          onMouseEnter={() => {
            if (!disabled) {
              setInteracting(true);
            }
          }}
          onMouseLeave={() => setInteracting(false)}
          style={disabled ? rowStyles.actionButton(disabled) : { ...rowStyles.actionButton(disabled), ...interactionStyles }}
          type="button"
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={6}
          style={rowStyles.tooltip}
        >
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function Icon({ name }: { name: "check" | "edit" | "page" | "remove" | "address" }) {
  const paths = {
    address: <><path d="M4 10.5C6 6.5 9 4.5 12 4.5s6 2 8 6c-2 4-5 6-8 6s-6-2-8-6Z" /><circle cx="12" cy="10.5" r="2.2" /><path d="M8.5 18.5h7" /></>,
    check: <path d="m5 12 4 4 10-10" />,
    edit: <><path d="M4 17.5V20h2.5L18 8.5 15.5 6 4 17.5Z" /><path d="m14.5 7 2.5 2.5" /></>,
    page: <><path d="M4 10.5C6 6.5 9 4.5 12 4.5s6 2 8 6c-2 4-5 6-8 6s-6-2-8-6Z" /><circle cx="12" cy="10.5" r="2.2" /></>,
    remove: <><path d="M5 7h14" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M8 7l1 13h6l1-13" /><path d="M9 7V5h6v2" /></>,
  };
  return (
    <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
      {paths[name]}
    </svg>
  );
}

function isAddressValue(item: MetadataIndex): boolean {
  const aspect = String(item.aspect || "").toLowerCase();
  const value = String(item.value || "");
  return /location|address|mailback/.test(aspect) && /\d{1,6}\s+[A-Za-z0-9.,'&\- ]{5,}/i.test(value);
}

function SourceLine({ label, value }: { label: string; value: unknown }) {
  const text = cleanText(value);
  if (!text) return null;
  return (
    <div style={rowStyles.sourceLine}>
      <b>{label}:</b> {text}
    </div>
  );
}

function AspectLine({ aspect, label }: { aspect: string; label: string }) {
  const parts = aspect
    .split("-")
    .flatMap((part) => part.split(","))
    .map((part) => part.trim())
    .filter(Boolean)
    .map(formatLabel);
  const labels = label && !parts.some((part) => part.toLowerCase() === label.toLowerCase()) ? [label] : [];
  const values = [...parts, ...labels];
  if (values.length === 0) return null;
  return (
    <div style={rowStyles.body}>
      {values.map((value, index) => {
        const lower = value.toLowerCase();
        const style = lower === "direct"
          ? rowStyles.direct
          : lower === "indirect"
            ? rowStyles.indirect
            : lower === "other" || lower === "procedural"
              ? rowStyles.procedural
              : undefined;
        return (
          <span key={`${value}-${index}`}>
            {index > 0 ? ", " : null}
            <span style={style}>{value}</span>
          </span>
        );
      })}
    </div>
  );
}

export function MetadataRow({
  callbacks,
  confirmed,
  item,
  onConfirm,
  onDrop,
  pageClass,
  pageSegments,
  selected,
  segment,
  session,
  type = "index",
}: {
  callbacks: IndexMetadataCallbacks;
  confirmed: boolean;
  item: MetadataIndex;
  onConfirm: (payload: IndexActionPayload) => void;
  onDrop: (payload: IndexActionPayload) => void;
  pageClass?: string;
  pageSegments?: string[];
  selected: boolean;
  segment: string | null;
  session: string;
  type?: string;
}): JSX.Element {
  const code = String(item.code || "");
  const page = Number(item.page || item.page_number || 0);
  const value = cleanText(item.value);
  const label = formatLabel(item.label || item.name || "");
  const aspect = formatLabel(item.aspect || "");
  const ambiguous = isAmbiguous(item.ambiguous);
  const payload: IndexActionPayload = {
    code,
    page,
    pageClass,
    pageSegments,
    segment,
    session,
    type,
    value,
  };
  const status = confirmed ? "success" : ambiguous ? "warning" : "success";
  const borderColor = status === "warning" ? "#f59e0b" : "forestgreen";

  return (
    <article
      data-active={selected ? "true" : "false"}
      data-index-code={code || undefined}
      data-index-segment={segment || undefined}
      data-status={status}
      style={rowStyles.row(selected, borderColor)}
    >
      <div style={rowStyles.header}>
        <div style={rowStyles.value}>
          {value}
        </div>
        <div style={rowStyles.actionGroup}>
          {callbacks.onConfirmIndex && ambiguous ? (
            <ActionButton label="Confirm index and remove ambiguity" onClick={() => onConfirm(payload)}>
              <Icon name="check" />
            </ActionButton>
          ) : null}
          {callbacks.onPageClick && page && code ? (
            <ActionButton label={`Open page image ${page}`} onClick={() => callbacks.onPageClick?.(payload)}>
              <Icon name="page" />
            </ActionButton>
          ) : null}
          {callbacks.onDropIndex && code ? (
            <ActionButton label="Pop the index" onClick={() => onDrop(payload)}>
              <Icon name="remove" />
            </ActionButton>
          ) : null}
          {callbacks.onEditPage && code ? (
            <ActionButton label="Edit index" onClick={() => callbacks.onEditPage?.(payload)}>
              <Icon name="edit" />
            </ActionButton>
          ) : null}
          {callbacks.onAddressClick && isAddressValue(item) ? (
            <ActionButton label={`Open address ${value}`} onClick={() => callbacks.onAddressClick?.(value)}>
              <Icon name="address" />
            </ActionButton>
          ) : null}
        </div>
      </div>
      <AspectLine aspect={aspect} label={label} />
      <SourceLine label="Explanation" value={item.explanation} />
      <SourceLine label="Quote" value={`P:${page || ""}. ${item.source || ""}`} />
    </article>
  );
}

export function EmptyRow({ message }: { message: string }) {
  return (
    <div
      className="no-data-message"
      style={rowStyles.empty}
    >
      {message}
    </div>
  );
}
