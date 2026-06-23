import { Dialog } from "aurorra-ui";
import type { JSX } from "react";
import type { LegalPayload } from "../../metdata/type/metadata.types";
import { legalPlatDialogStyles } from "../style/legalPlatDialogStyles";
import { LegalPlatContent } from "./LegalPlatContent";

export type LegalPlatDialogProps = {
  legal: LegalPayload | null | undefined;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function LegalPlatDialog({ legal, onOpenChange, open }: LegalPlatDialogProps): JSX.Element {
  return (
    <Dialog
      bodyMode="center"
      closeOnOverlay
      draggable
      header={
        <div style={legalPlatDialogStyles.header}>
          <span style={legalPlatDialogStyles.headerTitle}>Legal Plat</span>
          <div
            aria-hidden="true"
            data-legal-drag-handle="true"
            style={legalPlatDialogStyles.dragHeader}
          />
        </div>
      }
      heightMode="wide"
      onOpenChange={onOpenChange}
      open={open}
      showCloseButton={false}
      showHeader
      theme="default"
      zIndex={9999}
    >
      <div style={legalPlatDialogStyles.content}>
        <div style={legalPlatDialogStyles.plat}>
          <LegalPlatContent legal={legal} />
        </div>
        <div style={legalPlatDialogStyles.footer}>
          <button
            onClick={() => onOpenChange(false)}
            style={legalPlatDialogStyles.closeButton}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
