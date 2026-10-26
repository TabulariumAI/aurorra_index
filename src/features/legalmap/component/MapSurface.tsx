import type { CSSProperties, ReactNode } from "react";
import { Icon } from "aurora-core";
import { legalMapStyles } from "../style/legalMapStyles";

export function MapIssue({ title, issue }: { title: string; issue: string }) {
  return <div className="legal-map-incomplete" style={legalMapStyles.incomplete}>
    <div style={legalMapStyles.errorArea}>
      <div role="alert" aria-label={title}>
        <p style={legalMapStyles.mapError}><Icon name="alert" /><span>{issue}</span></p>
      </div>
    </div>
  </div>;
}

export function MapSurface({ children, footer, style, drawingStyle, showNorth = true }: {
  children: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
  drawingStyle?: CSSProperties;
  showNorth?: boolean;
}) {
  return <div data-legal-map-surface="true" style={{ ...legalMapStyles.mapSurface, ...style }}>
    <div data-legal-map-drawing="true" style={{ ...legalMapStyles.mapDrawing, ...drawingStyle }}>{children}</div>
    {showNorth || footer ? <div data-legal-map-footer="true" style={legalMapStyles.mapFooter}>
      {showNorth ? <div data-legal-map-north="true" aria-hidden="true" style={legalMapStyles.northMarker}>
        <svg width="16" height="20" viewBox="0 0 24 28" fill="currentColor">
          <path d="M12 1 3 24l9-5 9 5z" />
        </svg>
        <span>N</span>
      </div> : null}
      {footer ? <div style={legalMapStyles.legendFrame}>{footer}</div> : null}
    </div> : null}
  </div>;
}
