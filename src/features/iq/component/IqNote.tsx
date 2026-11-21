import * as Collapsible from "@radix-ui/react-collapsible";
import { Icon } from "aurora-core";
import { useState } from "react";
import { iqColors, iqStyles } from "../style/iqStyles";
import type { IqNoteView } from "../type/iq.types";

export function IqNote({ note }: { note: IqNoteView }) {
  const [open, setOpen] = useState(false);
  const warning = note.message.startsWith("WARNING: ");
  const message = warning ? note.message.slice("WARNING: ".length) : note.message;
  const words = message.trim().split(/\s+/);
  const expandable = words.length > 30;
  const text = <p data-status={note.status} style={iqStyles.noteText}>
    {note.segment !== null ? <strong>{note.segment}</strong> : null}
    <span>{warning ? <><span style={{ color: iqColors.amber.fg, fontWeight: 700 }}>WARNING:</span> </> : null}
      {expandable && !open ? `${words.slice(0, 25).join(" ")}…` : message}</span>
  </p>;
  return (
    <Collapsible.Root className="iq-note" open={open} onOpenChange={setOpen} style={iqStyles.noteRow}>
      {expandable ? <Collapsible.Trigger asChild>
        <button aria-label={`${open ? "Collapse" : "Expand"} note`} style={iqStyles.noteButton} type="button">
          <span style={{ display: "flex", transform: open ? "none" : "rotate(-90deg)" }}><Icon name="expand" /></span>
        </button>
      </Collapsible.Trigger> : null}
      {open ? <Collapsible.Content asChild>{text}</Collapsible.Content> : text}
    </Collapsible.Root>
  );
}
