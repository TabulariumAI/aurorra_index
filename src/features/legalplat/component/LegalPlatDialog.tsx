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
      anchorElementId="main-container"
      bodyMode="center"
      closeOnOverlay
      draggable
      header={
        <div style={legalPlatDialogStyles.header}>
          <span style={legalPlatDialogStyles.headerTitle}>Plat</span>
        </div>
      }
      heightMode="medium"
      onOpenChange={onOpenChange}
      open={open}
      showCloseButton
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
