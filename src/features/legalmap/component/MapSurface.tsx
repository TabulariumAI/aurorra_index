import type { CSSProperties, ReactNode } from "react";
import { legalMapStyles } from "../style/legalMapStyles";

export function MapSurface({ children, controls, annotation, footer, style }: {
  children: ReactNode;
  controls?: ReactNode;
  annotation?: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
}) {
  return <div data-legal-map-surface="true" style={{ ...legalMapStyles.mapSurface, ...style }}>
    {controls || annotation ? <div className="legal-map-header" style={legalMapStyles.mapHeader}>
      {annotation}
      {controls}
    </div> : null}
    <div data-legal-map-drawing="true" style={legalMapStyles.mapDrawing}>{children}</div>
    <div data-legal-map-north="true" aria-hidden="true" style={{ ...legalMapStyles.northMarker, ...legalMapStyles.mapNorth }}>
      <svg width="16" height="20" viewBox="0 0 24 28" fill="currentColor">
        <path d="M12 1 3 24l9-5 9 5z" />
      </svg>
      <span>N</span>
    </div>
    {footer ? <div data-legal-map-footer="true" style={legalMapStyles.mapFooter}>{footer}</div> : null}
  </div>;
}
