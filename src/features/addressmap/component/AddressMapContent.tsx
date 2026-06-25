import { useEffect, useState } from "react";
import { appendAddressMapZoom } from "../data/addressMap";
import { addressMapStyles } from "../style/addressMapStyles";
import type { JSX } from "react";

type AddressMapContentProps = {
  source: string;
  zoom: number;
};

export function AddressMapContent({ source, zoom }: AddressMapContentProps): JSX.Element {
  const [iframeSource, setIframeSource] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!source) {
      setIframeSource(null);
      setIsLoaded(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIframeSource(appendAddressMapZoom(source, zoom));
      setIsLoaded(true);
    }, 50);

    return () => {
      clearTimeout(timer);
      setIframeSource(null);
      setIsLoaded(false);
    };
  }, [source, zoom]);

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
