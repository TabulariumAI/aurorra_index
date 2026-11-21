import type { CSSProperties, ReactNode } from "react";
import { Icon } from "aurora-core";
import { legalMapStyles } from "../style/legalMapStyles";

export function MapIssue({ title, issue, compact = false }: { title: string; issue: string; compact?: boolean }) {
  return <section role="note" aria-label={title} className={compact ? "legal-map-notice" : "legal-map-incomplete"} style={compact ? legalMapStyles.notice : legalMapStyles.unavailable}>
    <div style={legalMapStyles.messageContent}>
      {!compact ? <>
        <h3 style={legalMapStyles.messageTitle}>Map preview unavailable</h3>
        <p style={legalMapStyles.messageText}>The extracted description does not contain enough information to draw this property.</p>
      </> : null}
      <details style={{ ...legalMapStyles.messageDetails, ...(compact ? { marginTop: 0 } : {}) }}>
        <summary style={{ ...legalMapStyles.messageSummary, ...(compact ? { color: "inherit", textDecoration: "none" } : {}) }}><span>{compact ? "Map preview is incomplete." : "Details"}</span><Icon name="expand" /></summary>
        <p style={legalMapStyles.messageReason}>{issue}</p>
      </details>
    </div>
  </section>;
}

export function MapSurface({ children, footer, style, drawingStyle, showNorth = true, issues = [] }: {
  children?: ReactNode;
  issues?: { title: string; issue: string }[];
  footer?: ReactNode;
  style?: CSSProperties;
  drawingStyle?: CSSProperties;
  showNorth?: boolean;
}) {
  return <div data-legal-map-surface="true" style={{ ...legalMapStyles.mapSurface, ...style }}>
    {children && issues.length > 0 ? <div style={legalMapStyles.surfaceNotices}>{issues.map((entry, index) => <MapIssue key={index} {...entry} compact />)}</div> : null}
    <div data-legal-map-drawing="true" style={{ ...legalMapStyles.mapDrawing, ...drawingStyle }}>
      {children || <div style={legalMapStyles.surfaceMessages}>{issues.map((entry, index) => <MapIssue key={index} {...entry} />)}</div>}
    </div>
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
