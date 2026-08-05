import { useEffect, useState } from "react";
import { appendAddressMapZoom } from "../data/addressMap";
import { addressMapStyles } from "../style/addressMapStyles";
import type { JSX } from "react";

export type AddressMapContentProps = {
  onReadyChange(ready: boolean): void;
  source: string;
  zoom: number;
};

export function AddressMapContent({ onReadyChange, source, zoom }: AddressMapContentProps): JSX.Element {
  const [iframeSource, setIframeSource] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    onReadyChange(false);
    if (!source) {
      setIframeSource(null);
      setIsLoaded(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIframeSource(appendAddressMapZoom(source, zoom));
      setIsLoaded(true);
      onReadyChange(true);
    }, 50);

    return () => {
      clearTimeout(timer);
      setIframeSource(null);
      setIsLoaded(false);
      onReadyChange(false);
    };
  }, [onReadyChange, source, zoom]);

  return (
    <div style={addressMapStyles.contentShell}>
      <iframe
        allowFullScreen
        data-address-map-iframe="true"
        data-testid="address-map-iframe"
        loading="lazy"
        referrerPolicy="no-referrer"
        src={iframeSource || undefined}
        frameBorder="0"
        style={{ ...addressMapStyles.iframe, display: isLoaded ? "block" : "none" }}
      />
    </div>
  );
}
