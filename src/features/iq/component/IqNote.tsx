import { TextDisclosure } from "aurora-core";
import { iqColors, iqStyles } from "../style/iqStyles";
import type { IqNoteView } from "../type/iq.types";

export function IqNote({ note }: { note: IqNoteView }) {
  const warning = note.message.startsWith("WARNING: ");
  const message = warning ? note.message.slice("WARNING: ".length) : note.message;
  return <TextDisclosure className="iq-note" label="note" text={message} style={iqStyles.noteRow}>
    {text => <p data-status={note.status} style={iqStyles.noteText}>
      {note.segment !== null ? <strong>{note.segment}</strong> : null}
      <span>{warning ? <><span style={{ color: iqColors.amber.fg, fontWeight: 700 }}>WARNING:</span> </> : null}{text}</span>
    </p>}
  </TextDisclosure>;
}
