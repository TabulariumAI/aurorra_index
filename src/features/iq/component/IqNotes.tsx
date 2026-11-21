import { ErrorBoundary, LoadError } from "aurora-core";
import { iqStyles } from "../style/iqStyles";
import type { IqReportView } from "../type/iq.types";
import { IqNote } from "./IqNote";

export function IqNotes({ notes, onRetry }: { notes: IqReportView["notes"]; onRetry?: () => void }) {
  return <ErrorBoundary title="IQ notes" resetKey={notes}>
    {notes.error !== null ? <LoadError title="IQ notes" detail={notes.error} onRetry={onRetry} /> : notes.data.length > 0 ? (
      <div style={iqStyles.notes}>{[...notes.data].reverse().map((note, index) => <IqNote key={index} note={note} />)}</div>
    ) : null}
  </ErrorBoundary>;
}
