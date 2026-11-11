import { ChoicesTable } from "aurora-core";
import type { ReactNode } from "react";
import { useIndexStore } from "../../metdataview/store/metadataStore";
import { useQueueStore } from "../../queue/store/queueStore";
import { auditStyles } from "../style/auditStyles";

export function AuditChoices({ session, sourceDownload }: { session: string; sourceDownload?: ReactNode }) {
  const choices = useIndexStore(state => state.choices);
  const selected = useQueueStore(state => state.session);
  if (selected !== session || choices === null) return <p style={auditStyles.empty}>Session choices are unavailable.</p>;
  return <section aria-label="Session choices" style={auditStyles.choices}>
    {sourceDownload}
    <ChoicesTable items={choices.items} columns={1} />
  </section>;
}
