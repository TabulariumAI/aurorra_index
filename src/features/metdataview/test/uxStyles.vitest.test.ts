import { describe, expect, it } from "vitest";
import { addIndexStyles } from "../../addindex/style/addIndexStyles";
import { auditStyles } from "../../audit/style/auditStyles";
import { imageViewerStyles } from "../../imageviewer/style/imageViewerStyles";
import { iqStyles } from "../../iq/style/iqStyles";
import { legalMapStyles } from "../../legalmap/style/legalMapStyles";
import { pageSegmentsStyles } from "../../pagesegments/style/pageSegmentsStyles";
import { disclosureButtonStyle, metadataStyles, rowStyles, segmentStyles } from "../style/metadataViewStyles";

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
      batch: {
        fontSize: "0.75rem",
        fontWeight: 700,
        lineHeight: 1.35,
        overflowWrap: "anywhere",
        whiteSpace: "normal",
      },
      headerInfo: {
        alignItems: "flex-end",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      },
      session: {
        fontSize: "0.75rem",
        lineHeight: 1.35,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
      title: {
        fontSize: "calc(var(--panel-title-size) * 1.15)",
        fontWeight: "var(--panel-title-weight)",
        letterSpacing: "var(--panel-title-tracking)",
        lineHeight: "var(--panel-title-line-height)",
        minWidth: "min-content",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    });
    expect(imageViewerStyles.topToolbar).toMatchObject({
      borderBottom: "1px solid var(--border-card)",
      minHeight: "var(--panel-header-height)",
      padding: "var(--panel-header-padding)",
    });
    expect(imageViewerStyles.topToolbarCompact).toMatchObject({
      borderBottom: "1px solid var(--border-card)",
      minHeight: "var(--panel-header-height)",
      padding: "var(--panel-header-padding)",
    });
    expect(metadataStyles.accordion).toMatchObject({
      boxSizing: "border-box",
      gap: "0.75rem",
      padding: "0 1.2rem var(--panel-content-padding)",
    });
    expect(metadataStyles.legalElement).toMatchObject({ borderTop: "1px solid var(--border-card)" });
    expect(disclosureButtonStyle(false, true)).toMatchObject({
      border: "1px solid var(--primary)",
      outline: "2px solid var(--primary)",
    });
    expect(segmentStyles.root).toMatchObject({
      backgroundColor: "var(--white)",
      borderTop: "1px solid var(--border-card)",
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
      background: "var(--white)",
      border: "1px solid var(--border-card)",
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
    expect(addIndexStyles.field).toMatchObject({
      border: "1px solid var(--border-card)",
      borderRadius: "var(--radius-card)",
    });
    expect(addIndexStyles.input).toMatchObject({
      border: "1px solid var(--border-card)",
      borderRadius: "var(--radius-control)",
      minHeight: "2.5rem",
    });
    expect(addIndexStyles.button("primary")).toMatchObject({
      backgroundColor: "var(--primary)",
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
      border: "1px solid var(--border-card)",
      borderRadius: "var(--radius-control)",
      height: "2.5rem",
      width: "2.5rem",
    });
    expect(imageViewerStyles.searchInput).toMatchObject({
      border: "1px solid var(--border-card)",
      borderRadius: "var(--radius-control)",
      minHeight: "2.5rem",
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
      scrollbarColor: "#efefef transparent",
    });
  });
});
