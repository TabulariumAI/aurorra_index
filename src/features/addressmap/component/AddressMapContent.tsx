import { useEffect, useRef, useState, type JSX } from "react";
import { appendAddressMapZoom } from "../data/addressMap";
import { addressMapStyles } from "../style/addressMapStyles";

export type AddressMapContentProps = {
  onLoaderChange(lines: readonly string[] | null): void;
  onReadyChange(ready: boolean): void;
  source: string;
  zoom: number;
};

export function AddressMapContent({ onLoaderChange, onReadyChange, source, zoom }: AddressMapContentProps): JSX.Element {
  const [status, setStatus] = useState<"loading" | "loaded" | "timeout">("loading");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setStatus("loading");
    if (!source) return;

    timer.current = window.setTimeout(() => setStatus("timeout"), 10_000);
    return () => window.clearTimeout(timer.current);
  }, [source, zoom]);

  useEffect(() => {
    onReadyChange(Boolean(source) && status !== "loading");
    onLoaderChange(source && status === "loading" ? ["Loading map…"] : null);
  }, [onLoaderChange, onReadyChange, source, status]);

  if (!source) return <div style={addressMapStyles.contentShell} />;

  const iframeSource = appendAddressMapZoom(source, zoom);
  const mapUrl = new URL(source);
  mapUrl.searchParams.delete("output");

  return (
    <div style={addressMapStyles.contentShell}>
      <iframe
        key={iframeSource}
        allowFullScreen
        data-address-map-iframe="true"
        data-testid="address-map-iframe"
        loading="eager"
        onLoad={() => {
          window.clearTimeout(timer.current);
          setStatus("loaded");
        }}
        referrerPolicy="no-referrer"
        src={iframeSource}
        frameBorder="0"
        style={{ ...addressMapStyles.iframe, visibility: status === "loaded" ? "visible" : "hidden" }}
        title="Address map"
      />
      {status === "timeout" ? (
        <div role="status" style={addressMapStyles.timeout}>
          <span>The map is taking longer than expected.</span>
          <a href={mapUrl.href} rel="noopener noreferrer" style={addressMapStyles.link} target="_blank">
            Open Google Maps
          </a>
        </div>
      ) : null}
    </div>
  );
}
