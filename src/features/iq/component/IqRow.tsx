import { rowStyles } from "aurora-core";
import type { ReactNode } from "react";
import type { IqPending } from "../type/iq.types";
import { iqStyles } from "../style/iqStyles";
import { IqAckButton } from "./IqAckButton";

export function IqRow({ code, cue, pending, status, children, onAck }: {
  code: string;
  cue: boolean;
  pending: IqPending | undefined;
  status?: ReactNode;
  children: ReactNode;
  onAck?: (code: string) => void;
}) {
  const disabled = Boolean(pending);
  return <li data-cue-code={cue ? code : undefined} data-gate-code={cue ? undefined : code}
    aria-busy={pending?.busy === true} aria-disabled={pending ? "true" : undefined}
    style={{ ...(cue ? iqStyles.cueRow : iqStyles.gateRow), position: "relative",
      ...(pending ? rowStyles.disabledRow : {}), ...(pending?.actions ? rowStyles.failedRow : {}) }}>
    {status ? <div inert={disabled} style={{ ...iqStyles.gateStatus, ...(pending ? rowStyles.disabledContent : {}) }}>{status}</div> : null}
    <span inert={disabled} style={{ ...iqStyles.gateText, ...(pending ? rowStyles.disabledContent : {}) }}>{children}</span>
    <div inert={disabled && !pending?.actions} style={{ ...iqStyles.gateAction,
      ...(pending?.actions ? iqStyles.recovery : pending ? rowStyles.disabledContent : {}) }}>
      {pending?.actions ?? (onAck ? <IqAckButton label={cue ? "Dismiss cue" : "Clear gate"} disabled={disabled} onConfirm={() => onAck(code)} /> : null)}
    </div>
    {pending?.busy ? <div role="progressbar" aria-label="Processing acknowledgment" style={rowStyles.progress}>
      <span className="metadata-row-progress" style={rowStyles.progressFill} />
    </div> : null}
  </li>;
}
