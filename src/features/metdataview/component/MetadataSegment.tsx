import * as Collapsible from "@radix-ui/react-collapsible";
import { useState, type JSX, type ReactNode } from "react";
import { segmentStyles } from "../style/metadataViewStyles";

export function MetadataSegment({
  headerAction,
  children,
  count,
  shortcutKey,
  onOpenChange,
  open,
  title,
}: {
  headerAction?: ReactNode;
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
    <Collapsible.Root onOpenChange={onOpenChange} open={open} style={segmentStyles.root}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={hovered && !open ? { ...segmentStyles.header(open), ...segmentStyles.headerHover } : segmentStyles.header(open)}
      >
        <Collapsible.Trigger asChild>
          <button style={segmentStyles.trigger} type="button">
            <span style={{ flex: "1 1 auto", minWidth: 0 }}>{titleNode}</span>
          </button>
        </Collapsible.Trigger>
        {headerAction}
        <span style={segmentStyles.count()}>{count}</span>
      </div>
      <Collapsible.Content style={segmentStyles.contentShell}>
        <div style={segmentStyles.content}>{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
