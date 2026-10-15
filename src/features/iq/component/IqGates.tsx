import * as Tooltip from "@radix-ui/react-tooltip";
import { ConfButton, SuccessIcon } from "aurora-core";
import type { JSX } from "react";
import { UI_FAIL, UI_PASS, UI_WARNING } from "../data/iqData";
import { iqStyles } from "../style/iqStyles";
import type { IqBucket, IqReportView, IqUiStatus } from "../type/iq.types";

const metricFg = {
  green: "#065f46",
  amber: "#92400e",
  red: "#991b1b",
} satisfies Record<IqBucket, string>;

function statusLabel(status: IqUiStatus): string {
  return status === UI_PASS ? "PASS" : status.toUpperCase();
}

export function IqGates({
  ackingCodes,
  gates,
  onAck,
}: {
  ackingCodes: ReadonlySet<string>;
  gates: IqReportView["gates"];
  onAck: (code: string) => void;
}): JSX.Element {
  return (
    <Tooltip.Provider delayDuration={250}>
      <div style={{ ...iqStyles.summaryCard, margin: "1rem 0 0.25rem" }}>
        <div>
          <div style={{ ...iqStyles.metricNumber, color: metricFg[gates.bucket] }}>
            {gates.displayPercent}%
          </div>
          <div style={iqStyles.metricSubtext}>out of {gates.total} gates</div>
        </div>
        <div>
          <div style={iqStyles.metricLabel}>Compliance Gates</div>
          <div style={iqStyles.metricTrack}>
            <div style={iqStyles.metricFill(gates.bucket, gates.displayPercent)} />
          </div>
        </div>
      </div>
      <div style={iqStyles.sectionTitle}>Compliance Gates ({gates.items.length})</div>
      {gates.items.length === 0 ? (
        <div style={iqStyles.empty}>None</div>
      ) : (
        <ul style={iqStyles.gateList}>
          {gates.items.map((gate) => (
            <li data-gate-code={gate.code} key={gate.code} style={iqStyles.gateRow}>
              <div style={iqStyles.gateStatus}>
                {gate.status === UI_PASS ? <SuccessIcon /> : <span aria-hidden="true" style={iqStyles.gateFlag(gate.status)} />}
                <span>{statusLabel(gate.status)}</span>
              </div>
              <span style={iqStyles.gateText}>{gate.description}</span>
              <div style={iqStyles.gateAction}>
                {gate.status === UI_FAIL || gate.status === UI_WARNING ? (
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <ConfButton
                        aria-label="Clear gate"
                        disabled={ackingCodes.has(gate.code)}
                        label={
                          <svg aria-hidden="true" viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                            <path d="m16 3 5 5a2 2 0 0 1 0 3l-9 9H7l-4-4a2 2 0 0 1 0-3L13 3a2 2 0 0 1 3 0Z" />
                            <path d="m8 8 8 8M12 20h9" />
                          </svg>
                        }
                        onConfirm={() => onAck(gate.code)}
                        size="icon"
                        variant="danger"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content sideOffset={6} style={{ background: "#0f172a", borderRadius: "0.2rem", color: "#fff", fontSize: "0.75rem", padding: "0.35rem 0.5rem", zIndex: 60 }}>
                        Clear gate
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Tooltip.Provider>
  );
}
