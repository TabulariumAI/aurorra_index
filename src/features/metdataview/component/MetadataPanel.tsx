import * as Tooltip from "@radix-ui/react-tooltip";
import { type JSX, type ReactNode } from "react";
import {
  Icon,
  SuccessIcon,
  metadataRowCss,
  metadataSpinnerCss,
  metadataStyles,
  rowStyles,
  segmentStyles,
  ActionButton,
  EmptyRow,
  IndexValue,
  MetadataRow,
  MetadataList,
  MetadataSegment,
  cleanText,
  formatLabel,
  getParcelOptions,
  isAmbiguous,
} from "aurora-core";
import type {
  MetadataActionPayload,
  MetadataCallbacks,
  MetadataSelected,
  MetadataSegments,
  MetadataIndex,
  MetadataPayload,
  MetadataPanelData,
  MetadataError,
  MetadataStatus,
  PageScope,
} from "aurora-core";
import type { MetadataChoice } from "../type/metadataView.types";
import { getMapGroups } from "../../legalmap/data/surveyData";
import { PAGE_SEGMENT_CHOICES } from "../../pagesegments/data/pageSegmentsData";

export type MetadataPanelActions = {
  confirm: boolean;
  drop: boolean;
  reprocess: boolean;
};

export type MetadataPanelSections = {
  filterByChoices: boolean;
  hiddenSegments: ReadonlySet<string>;
  showEmpty: boolean;
};

const pageSegmentValues = new Set([
  "reference",
  "property",
  "endorsement",
  "transaction",
  "party",
  "secrets",
  "monetary",
  "acknowledgment",
  "judgment",
  "vital",
]);

export type MetadataPanelProps = {
  actions: MetadataPanelActions;
  callbacks: MetadataCallbacks;
  choices: readonly MetadataChoice[] | null;
  jurisdiction?: string | null;
  pageScope?: PageScope | null;
  children?: ReactNode;
  metadata: MetadataPayload | null;
  pageError?: MetadataError | null;
  onConfirm?: (payload: MetadataActionPayload) => Promise<void> | void;
  onDrop?: (payload: MetadataActionPayload) => Promise<void> | void;
  onAddIndex?: (segment: string, anchor: HTMLElement) => void;
  onEditIndex?: (index: MetadataIndex, segment: string, anchor: HTMLElement) => void;
  onReprocess?: (segment: string) => Promise<void> | void;
  confirmedCodes: Set<string>;
  pendingChanges?: ReadonlyMap<string, { kind: "update" | "delete"; busy: boolean; actions: ReactNode }>;
  headerActions?: ReactNode;
  openSegment: string | null;
  removedCodes: Set<string>;
  sections: MetadataPanelSections;
  showContext: boolean;
  selectedIndex: MetadataSelected | null;
  segments: MetadataSegments;
  session: string;
  setSectionOpen: (segment: string, open: boolean) => void;
  shortcuts: ReadonlyMap<string, string> | null;
  status: MetadataStatus;
  panelData: MetadataPanelData | null;
  pendingSegments?: ReadonlyMap<string, { busy: boolean; actions: ReactNode }>;
};

function titles(metadata: MetadataPayload): { explanation?: string; title: string }[] {
  const out: { explanation?: string; title: string }[] = [];
  const main = metadata.heading?.title?.trim();
  if (main) out.push({ explanation: metadata.heading?.explanation, title: main });
  const secondary = Array.isArray(metadata.heading?.secondary_titles) ? metadata.heading.secondary_titles : [];
  for (const title of secondary) {
    if (title?.trim()) out.push({ explanation: metadata.heading?.explanation, title });
  }
  return out;
}

function pages(metadata: MetadataPayload) {
  const recordables = metadata.pages?.recordables || [];
  const nonrecordables = metadata.pages?.nonrecordables || [];
  return [
    ...recordables.map((page) => ({ page, recordable: true })),
    ...nonrecordables.map((page) => ({ page, recordable: false })),
  ].map((item) => ({
    ...item,
    isTitle: item.page.class === "Title" || item.page.class === "TITLE" ||
      Boolean(item.page.class && item.page.class === metadata.heading?.class),
  }));
}

export function MetadataPanel(props: MetadataPanelProps): JSX.Element | null {
  const {
    callbacks,
    children,
    choices,
    jurisdiction,
    pageScope,
    confirmedCodes,
    actions,
    metadata,
    onConfirm,
    onDrop,
    onAddIndex,
    onEditIndex,
    onReprocess,
    openSegment,
    removedCodes,
    sections,
    showContext,
    segments,
    selectedIndex,
    session,
    setSectionOpen,
    shortcuts,
    status,
    panelData,
    pageError,
    pendingSegments,
  } = props;

  const hidden = sections.hiddenSegments;
  const isVisible = (segment: string) => !hidden.has(segment);
  const selectedServices = new Set(choices?.filter(choice => Number(choice.level) > 0).map(choice => choice.service));
  const choiceServices = new Map([
    [segments.ACKNOWLEDGMENT, "AcknowledgmentIndexing"], [segments.ENDORSEMENT, "EndorsementIndexing"],
    [segments.MONETARY, "MonetaryInfoIndexing"], [segments.PARTY, "PartyClauseIndexing"],
    [segments.PROPERTY, "ExhibitIndexing"], [segments.LEGAL, "LegalEnrichment"], [segments.REFERENCE, "RecitalIndexing"],
    [segments.SECRETS, "ConfidentialIndexing"], [segments.TRANSACTION, "TransactionIndexing"],
    [segments.VITAL, "VitalIndexing"], [segments.JUDGMENT, PAGE_SEGMENT_CHOICES.judgment],
  ]);
  const disabledSegments = new Set(sections.filterByChoices && choices !== null
    ? [...choiceServices].filter(([, service]) => !selectedServices.has(service)).map(([segment]) => segment)
    : []);
  const propertyVisible = isVisible(segments.PROPERTY) && !disabledSegments.has(segments.PROPERTY);
  const legalVisible = isVisible(segments.LEGAL) && !disabledSegments.has(segments.LEGAL);
  const sectionShortcut = (segment: string) => shortcuts?.get(segment) ?? null;
  const currentSegment = openSegment === segments.LEGAL ? segments.PROPERTY : openSegment;

  const rows = (items: MetadataIndex[], segment: string, emptyMessage: string, type = "index") => {
    const visibleItems = items.filter((item) => !removedCodes.has(String(item.code || "")));
    const occurrences = new Map<string, number>();
    return <MetadataList key={`${session}-${segment}`} empty={emptyMessage} rows={visibleItems.map((item) => {
      const code = String(item.code || "");
      const occurrence = occurrences.get(code) ?? 0;
      occurrences.set(code, occurrence + 1);
      return (
        <MetadataRow
          callbacks={callbacks}
          confirmed={confirmedCodes.has(code)}
          busy={props.pendingChanges?.get(code)?.busy}
          pending={props.pendingChanges?.get(code)?.kind}
          recovery={props.pendingChanges?.get(code)?.actions}
          item={item}
          key={`${code}-${occurrence}`}
          onConfirm={actions.confirm ? onConfirm : undefined}
          onDrop={actions.drop ? onDrop : undefined}
          onEdit={onEditIndex}
          onAddressClick={item.aspect === "property_address" ? undefined : callbacks.onAddressClick}
          selected={Boolean(code && selectedIndex?.code === code && (!selectedIndex.segment || selectedIndex.segment === segment))}
          segment={segment}
          session={session}
          type={type}
        />
      );
    })} />;
  };

  const renderSegment = (
    segment: string,
    title: string,
    count: number,
    content: ReactNode,
    actionSegment: string | null = segment,
  ) => {
    const disabled = segment === segments.PROPERTY ? !propertyVisible && !legalVisible : disabledSegments.has(segment);
    const note = sections.filterByChoices
      ? choices === null ? "Processing choices are unavailable for this session." : sessionNotes.get(segment)
      : undefined;
    return (
      <MetadataSegment
        collapsible={false}
        disabled={disabled}
        disabledReason="Not selected for this session."
        error={segment === segments.PAGE ? pageError?.error : undefined}
        note={segment === segments.TITLE || choices === null ? undefined : note}
        pending={actionSegment ? pendingSegments?.get(actionSegment) : undefined}
        progressLabel={`Reprocessing ${actionSegment}`}
        headerAction={
          actionSegment && currentSegment === segment ? (
            <div style={segmentStyles.actionGroup}>
              {onAddIndex ? (
                <ActionButton label="Add Index" lineAligned={false} text onClick={event => onAddIndex(actionSegment, event.currentTarget)}>
                  Add Index
                </ActionButton>
              ) : null}
              {actions.reprocess && onReprocess ? (
                <ActionButton label="Reprocess" lineAligned={false} text onClick={() => void onReprocess(actionSegment)}>
                  Reprocess
                </ActionButton>
              ) : null}
            </div>
          ) : null
        }
        count={count}
        onOpenChange={(open) => setSectionOpen(segment, open)}
        open={currentSegment === segment}
        shortcutKey={sectionShortcut(segment)}
        title={title}
      >
        {content}
        {note && (segment === segments.TITLE || choices === null) ? <p role="note" style={metadataStyles.muted}>{note}</p> : null}
      </MetadataSegment>
    );
  };

  if ((status === "loading" || status === "error") && !metadata) {
    return null;
  }

  if (!metadata || !panelData) {
    return (
      <section aria-label="Metadata" style={metadataStyles.sectionShell}>
        <EmptyRow message="No metadata found." />
      </section>
    );
  }

  const indexes = Array.isArray(metadata.parties)
    ? [...(metadata.indexes ?? []).filter((index) => index.segment !== segments.PARTY), ...panelData.parties]
    : metadata.indexes ?? [];
  const countedIndexes = indexes.filter((index) => !removedCodes.has(String(index.code || "")));
  const unclearCount = countedIndexes.filter((index) =>
    !confirmedCodes.has(String(index.code || "")) && isAmbiguous(index.ambiguous),
  ).length;
  const titleItems = titles(metadata);
  const pageItems = pageError ? [] : pages(metadata);
  const titlePage = pageItems.find((item) => item.isTitle)?.page;
  const legalGroups = (metadata.legals?.groups || metadata.legals?.legalGroups || metadata.legals?.LegalGroups || metadata.legals?.items || []).filter((group) => Array.isArray(group.elements) && group.elements.length > 0);
  const propertyItems = propertyVisible ? panelData.properties.filter((item) => !legalGroups.length || item.aspect !== "legal_description") : [];
  const legalCount = legalVisible ? legalGroups.length : 0;
  const hasMap = (legalVisible && getMapGroups(metadata.legals).length > 0) || (propertyVisible && Boolean(getParcelOptions(propertyItems).property_address?.trim()));
  const secretItems = (metadata.secrets || []).filter((item) => cleanText(item.value) && !cleanText(item.value).startsWith("xxx") && !cleanText(item.value).includes("Not explicitly provided"));

  let pageNote = "Processing scope is unavailable for this session.";
  const totalPages = metadata.pages?.num_of_pages;
  if (pageScope && totalPages !== undefined) {
    const pageWord = totalPages === 1 ? "page" : "pages";
    if ("all" in pageScope) pageNote = `Processing scope for this session: all ${totalPages} ${pageWord}.`;
    else {
      const scopeLabel = pageScope.last === 0
        ? pageScope.first === 1 ? "first page" : `first ${pageScope.first} pages`
        : `first ${pageScope.first} and last ${pageScope.last === 1 ? "page" : `${pageScope.last} pages`}`;
      pageNote = `Processing scope for this session: ${scopeLabel} — ${Math.min(totalPages, pageScope.first + pageScope.last)} of ${totalPages} ${pageWord}.`;
    }
  }
  const sessionNotes = new Map([
    [segments.PAGE, pageNote],
    [segments.TITLE, jurisdiction?.trim() ? `Jurisdiction for this session: ${jurisdiction.trim()}.` : "No jurisdiction was selected for this session."],
    [segments.PARTY, selectedServices.has("PartyEnrichment") ? undefined : "Party enrichment was not selected for this session."],
    [segments.PROPERTY, selectedServices.has("LegalEnrichment") ? undefined : "Legal description enrichment was not selected for this session."],
  ]);
  return (
    <Tooltip.Provider delayDuration={250}>
      <section aria-label="Metadata" style={metadataStyles.root}>
        <style>{metadataSpinnerCss}{metadataRowCss}</style>
        {showContext ? (
          <header data-metadata-context="true" style={metadataStyles.header}>
            <h2 style={metadataStyles.title}>{formatLabel(metadata.heading?.class || "")}</h2>
            <dl style={metadataStyles.statistics}>
              <div style={metadataStyles.statistic}>
                <dt title="Indexes" style={metadataStyles.statisticLabel}>Indexes</dt>
                <dd style={metadataStyles.statisticValue}>{countedIndexes.length}</dd>
              </div>
              <div style={metadataStyles.statistic}>
                <dt title="Ambiguous indexes" style={metadataStyles.statisticLabel}>Unclear</dt>
                <dd style={metadataStyles.statisticValue}>{unclearCount}</dd>
              </div>
            </dl>
            {props.headerActions}
          </header>
        ) : null}
        <div aria-label="Metadata accordion" data-panel-scroll="true" role="region" style={metadataStyles.accordion}>
        {isVisible(segments.PAGE) ? renderSegment(
          segments.PAGE,
          "Pages",
          pageItems.length,
          pageError ? null : pageItems.length ? pageItems.map(({ page, recordable, isTitle }, index) => {
            const pageNum = String(page.name || "");
            const code = String(page.code ?? pageNum);
            const pageClass = String(page.class || "").trim().toLowerCase();
            const validSegments = (Array.isArray(page.segments) ? page.segments : []).map((value) => String(value || "").toLowerCase()).filter((value) => pageSegmentValues.has(value));
            const item: MetadataIndex = {
              code,
              explanation: page.explanation,
              label: recordable ? "Recordable" : "Attachment",
              page: pageNum,
              page_number: pageNum,
              segment: segments.PAGE,
              source: validSegments.map(formatLabel).join(", "),
              value: `${pageNum} : ${isTitle ? "Title" : formatLabel(pageClass)} page`,
            };
            return (
              <MetadataRow
                callbacks={callbacks}
                confirmed={false}
                item={item}
                key={`${code}-${index}`}
                onConfirm={actions.confirm ? onConfirm : undefined}
                onDrop={actions.drop ? onDrop : undefined}
                onAddressClick={callbacks.onAddressClick}
                pageClass={pageClass}
                pageSegments={validSegments}
                details={validSegments.length ? [{ label: "Segments", value: item.source }] : undefined}
                selected={Boolean(code && selectedIndex?.code === code)}
                segment={segments.PAGE}
                session={session}
                busy={props.pendingChanges?.get(code)?.busy}
                pending={props.pendingChanges?.get(code)?.kind}
                recovery={props.pendingChanges?.get(code)?.actions}
                type="page"
              />
            );
          }) : <EmptyRow message="No recordables pages found." />,
          null,
        ) : null}
        {isVisible(segments.SECRETS) ? renderSegment(segments.SECRETS, "Confidential", secretItems.length, rows(secretItems, segments.SECRETS, "No confidential info found.", "secret")) : null}
        {isVisible(segments.TITLE) ? renderSegment(
          segments.TITLE,
          "Titles",
          titleItems.length,
          titleItems.length ? titleItems.map((item, index) => (
            <article key={`${item.title}-${index}`} style={metadataStyles.article}>
              <div style={metadataStyles.okHeading}><span aria-label="OK" role="img" title="OK"><SuccessIcon /></span>
                <IndexValue value={item.title} onClick={titlePage?.code && titlePage.name && callbacks.onPageClick
                  ? () => callbacks.onPageClick?.({ code: titlePage.code!, page: titlePage.name!, segment: segments.PAGE, session, type: "title", value: item.title })
                  : undefined} />
              </div>
              {item.explanation ? <div style={metadataStyles.muted}>{item.explanation}</div> : null}
            </article>
          )) : <EmptyRow message="No titles found." />,
          null,
        ) : null}
        {isVisible(segments.ENDORSEMENT) ? renderSegment(segments.ENDORSEMENT, "Endorsements", panelData.endorsements.length, rows(panelData.endorsements, segments.ENDORSEMENT, "No endorsements found.")) : null}
        {isVisible(segments.PARTY) ? renderSegment(segments.PARTY, "Parties(Party Clause)", panelData.parties.length, rows(panelData.parties, segments.PARTY, "No parties found.")) : null}
        {isVisible(segments.REFERENCE) ? renderSegment(segments.REFERENCE, "References(Recital)", panelData.references.length, rows(panelData.references, segments.REFERENCE, "No references found.")) : null}
        {isVisible(segments.PROPERTY) || isVisible(segments.LEGAL) ? renderSegment(
          segments.PROPERTY,
          "Property Info",
          propertyItems.length + legalCount,
          <div className="metadata-property">
            {hasMap || (legalVisible && metadata.legals?.summary) ? (
              <p style={metadataStyles.legalSummary}>
                {hasMap ? (
                  <ActionButton label="Open legal view" lineAligned text onClick={() => callbacks.onLegalView?.()}>
                    <Icon name="address" />
                    Show Map
                  </ActionButton>
                ) : null}
                {legalVisible ? metadata.legals?.summary : null}
              </p>
            ) : null}
            {propertyItems.length ? rows(propertyItems, segments.PROPERTY, "No property info found.") : null}
            {legalCount > 0 ? (
              <div style={metadataStyles.legalGroupList}>
                {legalGroups.map((group, index) => {
                  const code = String(group.code || "");
                  const page = group.page || 0;
                  const isLegalRowSelected = Boolean(code && selectedIndex?.code === code && (!selectedIndex.segment || selectedIndex.segment === segments.LEGAL));
                  const payload = { code, page, segment: segments.LEGAL, session, type: String(group.type || "legal"), value: formatLabel(group.type || "") } satisfies MetadataActionPayload;
                  const onPageClick = page && code ? callbacks.onPageClick : undefined;
                  return (
                    <article
                      className="metadata-row"
                      data-active={isLegalRowSelected ? "true" : "false"}
                      aria-disabled={props.pendingChanges?.has(code) ? "true" : undefined}
                      data-index-code={code || undefined}
                      data-index-segment={segments.LEGAL}
                      style={{ ...rowStyles.row(isLegalRowSelected), ...rowStyles.indexRow }}
                      key={`${code}-${index}`}
                    >
                      <span aria-label="OK" role="img" title="OK" style={rowStyles.statusIcon}><SuccessIcon /></span>
                      <div inert={props.pendingChanges?.has(code)} style={{ ...rowStyles.aspects, ...rowStyles.body }}>
                        Legal Description
                      </div>
                      <div className="metadata-row-value" inert={props.pendingChanges?.has(code)} style={{ ...rowStyles.valueWithViewer, ...rowStyles.indexValueWithViewer }}>
                        <IndexValue plain value={payload.value} onClick={onPageClick ? () => onPageClick(payload) : undefined} />
                      </div>
                      {(group.elements || []).map((element, elementIndex) => (
                        <div inert={props.pendingChanges?.has(code)} key={`${element.aspect}-${elementIndex}`} style={metadataStyles.legalElement}>
                          <div style={rowStyles.content}>
                            <div><strong>{formatLabel(element.aspect || "")}:</strong> {cleanText(element.value)}</div>
                            {element.explanation ? <div style={metadataStyles.muted}>{element.explanation}</div> : null}
                          </div>
                        </div>
                      ))}
                      {props.pendingChanges?.get(code)?.actions ? <div aria-disabled="false" style={rowStyles.recovery}>{props.pendingChanges.get(code)?.actions}</div> : null}
                    </article>
                  );
                })}
              </div>
            ) : null}
            {!propertyItems.length && !legalCount ? <EmptyRow message="No property info found." /> : null}
          </div>,
        ) : null}
        {isVisible(segments.MONETARY) ? renderSegment(segments.MONETARY, "Monetary", panelData.monetarys.length, rows(panelData.monetarys, segments.MONETARY, "No monetary info found.")) : null}
        {isVisible(segments.ACKNOWLEDGMENT) ? renderSegment(segments.ACKNOWLEDGMENT, "Acknowledgment", panelData.notary.length, rows(panelData.notary, segments.ACKNOWLEDGMENT, "No notary Info found.")) : null}
        {isVisible(segments.TRANSACTION) ? renderSegment(segments.TRANSACTION, "Transactional", panelData.transactions.length, rows(panelData.transactions, segments.TRANSACTION, "No Transaction indexes found.")) : null}
        {isVisible(segments.VITAL) ? renderSegment(segments.VITAL, "Vital", panelData.vitals.length, rows(panelData.vitals, segments.VITAL, "Vital information not found.")) : null}
        {isVisible(segments.JUDGMENT) ? renderSegment(segments.JUDGMENT, "Judgment", panelData.judgments.filter(item => !removedCodes.has(String(item.code || ""))).length, rows(panelData.judgments, segments.JUDGMENT, "No judgment indexes found.")) : null}
        {children}
        </div>
        <footer aria-label="Metadata actions" data-metadata-footer="true" style={metadataStyles.footerEmpty} />
      </section>
    </Tooltip.Provider>
  );
}
