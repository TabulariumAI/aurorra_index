import { Dialog } from "aurorra-ui";
import type { JSX } from "react";
import { AddressMapContent } from "./AddressMapContent";
import { addressMapDialogStyles } from "../style/addressMapDialogStyles";

export type AddressMapDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  source: string;
  zoom: number;
};

export function AddressMapDialog({ onOpenChange, open, source, zoom }: AddressMapDialogProps): JSX.Element {
  return (
    <Dialog
      bodyMode="center"
      closeOnOverlay
      draggable
      header={
        <div style={addressMapDialogStyles.header}>
          <span style={addressMapDialogStyles.headerTitle}>Address Map</span>
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
      <div style={addressMapDialogStyles.content}>
        <div style={addressMapDialogStyles.map}>
          <AddressMapContent source={source} zoom={zoom} />
        </div>
      </div>
    </Dialog>
  );
}
