import * as Collapsible from "@radix-ui/react-collapsible";
import * as Tooltip from "@radix-ui/react-tooltip";
import { ConfButton } from "aurorra-ui";
import { useLayoutEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { isAmbiguous } from "../data/metadataData";
import {
  disclosureButtonStyle,
  detailLabelStyle,
  detailLineStyle,
  detailTextStyle,
  rowStyles,
} from "../style/metadataStyles";
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

function useTextDisclosure(text: string, open: boolean) {
  const textRef = useRef<HTMLElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    if (open) {
      return undefined;
    }

    const textElement = textRef.current;
    if (!textElement) {
      return undefined;
    }

    const readOverflow = () => {
      const lineHeight = Number.parseFloat(window.getComputedStyle(textElement).lineHeight);
      const next = textElement.scrollWidth > textElement.clientWidth ||
        textElement.scrollHeight > textElement.clientHeight ||
        (lineHeight > 0 && textElement.getBoundingClientRect().height > Math.max(lineHeight + 1, 24));
      setIsOverflowing(next);
    };

    readOverflow();
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(readOverflow);
    });

    if (typeof ResizeObserver === "undefined") {
      const handleResize = () => {
        readOverflow();
      };
      window.addEventListener("resize", handleResize);
      return () => {
        window.cancelAnimationFrame(firstFrame);
        if (secondFrame) {
          window.cancelAnimationFrame(secondFrame);
        }
        window.removeEventListener("resize", handleResize);
      };
    }

    const observer = new ResizeObserver(() => {
      readOverflow();
    });
    observer.observe(textElement);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) {
        window.cancelAnimationFrame(secondFrame);
      }
      observer.disconnect();
    };
  }, [open, text]);

  return {
    textRef,
    hasDisclosure: open || isOverflowing,
  };
}

export function ActionButton({
  children,
  disabled = false,
  label,
  lineAligned,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  lineAligned: boolean;
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
          style={disabled ? rowStyles.actionButton(disabled, lineAligned) : { ...rowStyles.actionButton(disabled, lineAligned), ...interactionStyles }}
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
export function Icon({ name }: { name: "address" | "check" | "collapse" | "copy" | "edit" | "expand" | "remove" }) {
  const paths = {
    address: <><path d="M4 10.5C6 6.5 9 4.5 12 4.5s6 2 8 6c-2 4-5 6-8 6s-6-2-8-6Z" /><circle cx="12" cy="10.5" r="2.2" /><path d="M8.5 18.5h7" /></>,
    check: <path d="m5 12 4 4 10-10" />,
    collapse: <><rect height="16" rx="2" width="16" x="4" y="4" /><path d="M8 12h8" /></>,
    copy: <><rect height="11" rx="1.5" width="11" x="8" y="8" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></>,
    edit: <><path d="M4 17.5V20h2.5L18 8.5 15.5 6 4 17.5Z" /><path d="m14.5 7 2.5 2.5" /></>,
    expand: <><rect height="16" rx="2" width="16" x="4" y="4" /><path d="M8 12h8" /><path d="M12 8v8" /></>,
    remove: <><path d="M5 7h14" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M8 7l1 13h6l1-13" /><path d="M9 7V5h6v2" /></>,
  };
  return (
    <svg aria-hidden="true" fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
      {paths[name]}
    </svg>
  );
}

function DisclosureButton({ name, open }: { name: string; open: boolean }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const label = `${open ? "Collapse" : "Expand"} ${name}`;
  return (
    <Tooltip.Root>
      <Collapsible.Trigger asChild>
        <Tooltip.Trigger asChild>
          <button
            aria-label={label}
            onBlur={() => setFocused(false)}
            onFocus={() => setFocused(true)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={disclosureButtonStyle(hovered, focused)}
            type="button"
          >
            <Icon name={open ? "collapse" : "expand"} />
          </button>
        </Tooltip.Trigger>
      </Collapsible.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={6} style={rowStyles.tooltip}>
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function copyIndexValue(value: string): Promise<void> {
  return navigator.clipboard.writeText(value);
}

export function openMetadataImage(
  onPageClick: NonNullable<IndexMetadataCallbacks["onPageClick"]>,
  payload: IndexActionPayload,
): void {
  onPageClick(payload);
}

export function IndexValue({ onClick, value }: { onClick?: () => void; value: string }) {
  const [open, setOpen] = useState(false);
  const { textRef, hasDisclosure } = useTextDisclosure(value, open);
  const textStyle = rowStyles.valueText(open, hasDisclosure);
  const content = (
    <div
      ref={(element) => {
        if (!onClick) {
          textRef.current = element;
        }
      }}
      style={onClick ? rowStyles.value : { ...rowStyles.value, ...textStyle }}
    >
      {onClick ? (
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClick();
          }}
          ref={(element) => {
            textRef.current = element;
          }}
          style={{ ...rowStyles.valueLink, ...textStyle }}
        >
          {value}
        </a>
      ) : value}
      {hasDisclosure ? <DisclosureButton name="index value" open={open} /> : null}
    </div>
  );

  return (
    <Collapsible.Root asChild open={open} onOpenChange={setOpen}>
      {content}
    </Collapsible.Root>
  );
}
function isAddressValue(item: MetadataIndex): boolean {
  const aspect = String(item.aspect || "").toLowerCase();
  const value = String(item.value || "");
  return /location|address|mailback/.test(aspect) && /\d{1,6}\s+[A-Za-z0-9.,'&\- ]{5,}/i.test(value);
}

function DetailLine({ label, name, value }: { label: string; name: string; value: unknown }) {
  const text = cleanText(value);
  const [open, setOpen] = useState(false);
  const { textRef, hasDisclosure } = useTextDisclosure(text, open);

  if (!text) return null;

  const content = (
    <div style={detailLineStyle(hasDisclosure)}>
      <span
        ref={(element) => {
          textRef.current = element;
        }}
        style={detailTextStyle(open, hasDisclosure)}
      >
        <strong style={detailLabelStyle}>{label}:</strong> {text}
      </span>
      {hasDisclosure ? <DisclosureButton name={name} open={open} /> : null}
    </div>
  );

  return (
    <Collapsible.Root asChild open={open} onOpenChange={setOpen}>
      {content}
    </Collapsible.Root>
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
  onAddressClick,
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
  onConfirm?: (payload: IndexActionPayload) => Promise<void> | void;
  onDrop?: (payload: IndexActionPayload) => Promise<void> | void;
  onAddressClick?: (address: string) => void;
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
  const quote = cleanText(item.source);
  const label = formatLabel(item.label || item.name || "");
  const metadataIndex = {
    ambiguous: cleanText(item.ambiguous),
    label: cleanText(item.label || item.name),
    source: quote,
    value,
  };
  const aspect = formatLabel(item.aspect || "");
  const ambiguous = isAmbiguous(item.ambiguous);
  const payload: IndexActionPayload = {
    code,
    metadataIndex,
    page,
    pageClass,
    pageSegments,
    quote,
    segment,
    session,
    type,
    value,
  };
  const status = confirmed ? "success" : ambiguous ? "warning" : "success";
  const borderColor = status === "warning" ? "#f59e0b" : "forestgreen";
  const onPageClick = page && code ? callbacks.onPageClick : undefined;

  return (
    <article
      data-active={selected ? "true" : "false"}
      data-index-code={code || undefined}
      data-index-segment={segment || undefined}
      data-status={status}
      style={rowStyles.row(selected, borderColor)}
    >
      <div style={rowStyles.header}>
        <div style={rowStyles.valueWithViewer}>
          {isAddressValue(item) && onAddressClick ? (
            <ActionButton label={`Open address ${value}`} lineAligned onClick={() => onAddressClick(value)}>
              <Icon name="address" />
            </ActionButton>
          ) : null}
          <IndexValue value={value} onClick={onPageClick ? () => openMetadataImage(onPageClick, payload) : undefined} />
        </div>
        <div style={rowStyles.actionGroup}>
          {ambiguous && onConfirm ? (
            <ActionButton label="Confirm index and remove ambiguity" lineAligned={false} onClick={() => onConfirm(payload)}>
              <Icon name="check" />
            </ActionButton>
          ) : null}
          {value ? (
            <ActionButton label={`Copy value ${value}`} lineAligned={false} onClick={() => copyIndexValue(value)}>
              <Icon name="copy" />
            </ActionButton>
          ) : null}
          {type !== "page" && code && onDrop ? (
            <ConfButton
              aria-label="Pop the index"
              className="metadata-row-action"
              confirmLabel="Confirm"
              flat
              label={<Icon name="remove" />}
              onConfirm={() => onDrop(payload)}
              size="icon"
              style={rowStyles.confirmActionButton}
              title="Pop the index"
              variant="secondary"
            />
          ) : null}
          {type === "page" && callbacks.onEditPage && code ? (
            <ActionButton label="Edit index" lineAligned={false} onClick={() => callbacks.onEditPage?.(payload)}>
              <Icon name="edit" />
            </ActionButton>
          ) : null}
        </div>
      </div>
      <AspectLine aspect={aspect} label={label} />
      <DetailLine label="Explanation" name="explanation" value={item.explanation} />
      {type !== "page" ? <DetailLine label="Quote" name="quote" value={`P:${page || ""}. ${item.source || ""}`} /> : null}
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
