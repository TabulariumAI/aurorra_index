import { describe, expect, it } from "vitest";
import { indexStyles } from "../../../shared/style/indexStyles";
import { auditStyles } from "../../audit/style/auditStyles";
import { imageViewerStyles } from "../../imageviewer/style/imageViewerStyles";
import { iqStyles } from "../../iq/style/iqStyles";
import { legalMapStyles } from "../../legalmap/style/legalMapStyles";
import { pageSegmentsStyles } from "../../pagesegments/style/pageSegmentsStyles";
import { disclosureButtonStyle, metadataStyles, rowStyles, segmentStyles } from "aurora-core";

describe("index styles", () => {
  it("uses the target typography and accordion rhythm", () => {
    expect(metadataStyles.root).toMatchObject({
      color: "var(--title-ink)",
      fontFamily: "var(--font-ui)",
    });
    expect(metadataStyles.header).toMatchObject({
      borderBottom: "1px solid var(--border-card)",
      boxSizing: "border-box",
      flex: "0 0 auto",
      flexWrap: "wrap",
      gap: "var(--panel-header-gap)",
      minHeight: "var(--panel-header-height)",
      padding: "var(--panel-header-padding)",
    });
    expect(metadataStyles).toMatchObject({
      statistic: { display: "flex", flexDirection: "column-reverse" },
      statistics: { display: "flex", flex: "0 0 auto", minWidth: "max-content" },
      statisticLabel: { fontSize: "0.75rem" },
      statisticValue: { fontWeight: 700, margin: 0 },
      title: {
        fontSize: "calc(var(--panel-title-size) * 1.15)",
        fontWeight: "var(--panel-title-weight)",
        letterSpacing: "var(--panel-title-tracking)",
        lineHeight: "var(--panel-title-line-height)",
        minWidth: 0,
        overflowWrap: "anywhere",
        whiteSpace: "normal",
      },
    });
    expect(imageViewerStyles.topToolbar).toMatchObject({
      borderBottom: "1px solid var(--border-card)",
      minHeight: "var(--panel-header-height)",
      padding: "var(--panel-header-padding)",
    });
    expect({ ...imageViewerStyles.topToolbar, ...imageViewerStyles.topToolbarCompact }).toMatchObject({
      borderBottom: "1px solid var(--border-card)",
      minHeight: "var(--panel-header-height)",
      padding: "var(--panel-header-padding)",
    });
    expect(metadataStyles.accordion).toMatchObject({
      boxSizing: "border-box",
      gap: 0,
      padding: "0 var(--panel-content-padding) var(--panel-content-padding)",
    });
    expect(metadataStyles.legalElement).toMatchObject({ borderTop: "1px solid var(--border-card)" });
    expect(disclosureButtonStyle(false, true)).toMatchObject({
      border: 0,
      outline: "none",
    });
    expect(segmentStyles.root).toMatchObject({
      backgroundColor: "transparent",
      borderBottom: "1px solid var(--border-card)",
      borderRadius: "0",
    });
    expect(segmentStyles).toHaveProperty("header");
    expect((segmentStyles as Record<string, unknown>).header).toBeTypeOf("function");
    expect((segmentStyles as Record<string, unknown>).actionGroup).toMatchObject({
      display: "flex",
      gap: "0.25rem",
    });
    expect(segmentStyles.trigger).toMatchObject({
      appearance: "none",
      borderRadius: 0,
      boxShadow: "none",
    });
    expect(segmentStyles.count()).toMatchObject({
      background: "var(--gray-100)",
      border: 0,
      borderRadius: "var(--radius-control)",
      color: "var(--slate-500)",
    });
    expect(segmentStyles).not.toHaveProperty("actionLine");
    expect(segmentStyles).not.toHaveProperty("actionDivider");
    expect(segmentStyles).not.toHaveProperty("actionLink");
    expect(rowStyles.row(true, "#123456")).toMatchObject({ backgroundColor: "var(--accent-surface)" });
    expect(rowStyles.actionButtonHover).toMatchObject({ background: "var(--accent-surface)" });
    expect(legalMapStyles.shell).toMatchObject({ fontFamily: "var(--font-ui)" });
  });

  it("uses aligned cards, fields, and primary controls", () => {
    expect(indexStyles.field).toMatchObject({
      display: "grid",
      gap: "0.55rem",
      margin: 0,
      padding: 0,
    });
    expect(indexStyles.field).not.toHaveProperty("border");
    expect(indexStyles.field).not.toHaveProperty("borderRadius");
    expect(indexStyles.input).toMatchObject({
      border: "1px solid var(--border-card)",
      borderRadius: "var(--radius-control)",
      minHeight: "2.5rem",
    });
    expect(indexStyles.button("primary")).toMatchObject({
      backgroundColor: "var(--primary-dark)",
      borderRadius: "var(--radius-control)",
      height: "2.75rem",
    });
    expect(pageSegmentsStyles.item).toMatchObject({
      border: "1px solid var(--border-card)",
      borderRadius: "var(--radius-card)",
    });
    expect(pageSegmentsStyles.button("primary")).toMatchObject({ height: "2.75rem" });
  });

  it("uses aligned viewer and data surfaces", () => {
    expect(imageViewerStyles.scaleButton).toMatchObject({
      border: 0,
      borderRadius: "var(--radius-control)",
      height: "2rem",
      width: "2rem",
    });
    expect(imageViewerStyles.searchInput).toMatchObject({
      border: "1px solid var(--border-card)",
      borderRadius: "var(--radius-control)",
      minHeight: "2.75rem",
    });
    expect(iqStyles.root).toMatchObject({ fontFamily: "var(--font-ui)" });
    expect(iqStyles.content).toMatchObject({ padding: "0.85rem var(--panel-content-padding)" });
    expect(iqStyles.summaryCard).toMatchObject({
      border: "1px solid var(--border-card)",
      borderRadius: "var(--radius-card)",
      boxShadow: "var(--shadow-card)",
    });
    expect(auditStyles.gapCard).toMatchObject({
      border: "1px solid var(--border-card)",
      borderRadius: "var(--radius-card)",
    });
    expect(auditStyles.body).toMatchObject({
      padding: "0 var(--panel-content-padding) 0.85rem",
    });
    expect(auditStyles.body).not.toHaveProperty("scrollbarColor");
  });
});
