import * as Tooltip from "@radix-ui/react-tooltip";
import { ConfButton } from "aurora-core";

export function IqAckButton({ label, disabled, onConfirm }: {
  label: string;
  disabled: boolean;
  onConfirm(): void;
}) {
  return <Tooltip.Provider delayDuration={250}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <ConfButton aria-label={label} disabled={disabled} onConfirm={onConfirm} size="icon" variant="danger"
          label={<svg aria-hidden="true" viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 3 5 5a2 2 0 0 1 0 3l-9 9H7l-4-4a2 2 0 0 1 0-3L13 3a2 2 0 0 1 3 0Z" />
            <path d="m8 8 8 8M12 20h9" />
          </svg>} />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content sideOffset={6} style={{ background: "#0f172a", borderRadius: "0.2rem", color: "#fff", fontSize: "0.75rem", padding: "0.35rem 0.5rem", zIndex: 60 }}>
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>;
}
