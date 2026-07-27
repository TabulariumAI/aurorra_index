import * as Collapsible from "@radix-ui/react-collapsible";
import { useState, type JSX, type ReactNode } from "react";
import { segmentStyles } from "../style/metadataStyles";

export function MetadataSegment({
  action,
  children,
  count,
  shortcutKey,
  onOpenChange,
  open,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  count: number;
  shortcutKey?: string | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}): JSX.Element {
  const [hovered, setHovered] = useState(false);
  const shortcutIndex = shortcutKey
    ? title.toLowerCase().indexOf(shortcutKey.toLowerCase())
    : -1;
  const titleNode = shortcutIndex >= 0 ? (
    <>
      {title.slice(0, shortcutIndex)}
      <u>{title.slice(shortcutIndex, shortcutIndex + 1)}</u>
      {title.slice(shortcutIndex + 1)}
    </>
  ) : title;

  return (
    <Collapsible.Root onOpenChange={onOpenChange} open={open} style={segmentStyles.root(open)}>
      <Collapsible.Trigger asChild>
        <button
          onBlur={() => setHovered(false)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={hovered && !open ? { ...segmentStyles.trigger(open), ...segmentStyles.triggerHover } : segmentStyles.trigger(open)}
          type="button"
        >
          <span style={{ flex: "1 1 auto", minWidth: 0 }}>{titleNode}</span>
          <span style={segmentStyles.count(open)}>{count}</span>
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content style={segmentStyles.contentShell}>
        {action ? <div style={segmentStyles.actionLine(open)}>{action}</div> : null}
        <div style={segmentStyles.content}>{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
