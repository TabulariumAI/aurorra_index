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
      heightMode="wide"
      onOpenChange={onOpenChange}
      open={open}
      theme="default"
      zIndex={9999}
    >
      <div style={legalPlatDialogStyles.content}>
        <div style={legalPlatDialogStyles.plat}>
          <LegalPlatContent legal={legal} />
        </div>
      </div>
    </Dialog>
  );
}
