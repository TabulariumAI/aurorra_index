import { uniqueIndexes } from "../data/uniqueIndexes";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useId, useLayoutEffect, useRef, useState, type JSX, type ReactNode } from "react";
import {
  indexSegments,
  ErrorBoundary,
  ErrorBadge,
  Icon,
  iconButtonStyle,
  SuccessIcon,
  metadataRowCss,
  metadataSpinnerCss,
  metadataStyles,
  rowStyles,
  segmentStyles,
  ActionButton,
  ConfButton,
  EmptyRow,
  IndexValue,
  MetadataRow,
  MetadataList,
  MetadataGroups,
  MetadataSegment,
  cleanText,
  formatLabel,
  getParcelOptions,
  getSegmentItems,
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
import { getMapGroups } from "../../legalmap/data/mapGroups";
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
  pageScope?: PageScope | null;
  children?: ReactNode;
  metadata: MetadataPayload | null;
  pageError?: MetadataError | null;
  onConfirm?: (payload: MetadataActionPayload) => Promise<void> | void;
  onDrop?: (payload: MetadataActionPayload) => Promise<void> | void;
  onAddIndex?: (segment: string, anchor: HTMLElement) => void;
  onEditIndex?: (index: MetadataIndex, segment: string, anchor: HTMLElement) => void;
  onReprocess?: (segment: string) => Promise<void> | void;
  onClear?: (segment: string) => Promise<void> | void;
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
  pendingSegments?: ReadonlyMap<string, { busy: boolean; actions: ReactNode; label: string }>;
};

function headingRows(metadata: MetadataPayload): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const main = metadata.heading?.title?.trim();
  if (main) out.push({ label: "Primary Title", value: main });
  const secondary = Array.isArray(metadata.heading?.secondary_titles) ? metadata.heading.secondary_titles : [];
  for (const title of secondary) {
    if (title?.trim()) out.push({ label: "Secondary Title", value: title });
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

function MetadataActions({ children }: { children: ReactNode }) {
  const id = useId();
  const frame = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ overflow: false, right: false });
  useLayoutEffect(() => {
    const list = viewport.current!;
    const measure = () => setScroll({
      overflow: content.current!.scrollWidth > frame.current!.clientWidth,
      right: list.scrollWidth - list.clientWidth - list.scrollLeft > 1,
    });
    const observer = new ResizeObserver(measure);
    observer.observe(frame.current!);
    observer.observe(list);
    observer.observe(content.current!);
    list.addEventListener("scroll", measure);
    measure();
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", measure);
    };
  }, [scroll.overflow]);
  return <div ref={frame} style={segmentStyles.actionFrame}>
    <div aria-label="Section actions" id={id} ref={viewport} role="group" style={segmentStyles.actionViewport} tabIndex={0}>
      <div ref={content} style={segmentStyles.actionGroup}>{children}</div>
    </div>
    {scroll.overflow ? <button aria-controls={id} aria-label="Scroll section actions right" disabled={!scroll.right}
      onClick={() => viewport.current!.scrollBy({ left: viewport.current!.clientWidth })}
      style={{ ...iconButtonStyle, ...(!scroll.right ? { opacity: 0.56 } : {}) }} type="button">
      <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" style={segmentStyles.chevron(false)}><path d="m9 6 6 6-6 6" /></svg>
    </button> : null}
  </div>;
}

export function MetadataPanel(props: MetadataPanelProps): JSX.Element | null {
  const {
    callbacks,
    children,
    choices,
    pageScope,
    confirmedCodes,
    actions,
    metadata,
    onConfirm,
    onDrop,
    onAddIndex,
    onEditIndex,
    onReprocess,
    onClear,
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

  const rows = (items: MetadataIndex[], segment: string, emptyMessage: string | undefined, type = "index", scope = segment) => {
    const visibleItems = items.filter((item) => !removedCodes.has(String(item.code || "")));
    return <>
      {segment === indexSegments.EXECUTION && visibleItems.length > 0 ? <h4 style={metadataStyles.pageTitle}>Visual Verification</h4> : null}
      <MetadataList key={`${session}-${scope}`} ungrouped={segment === segments.ENDORSEMENT || segment === indexSegments.EXECUTION} empty={emptyMessage} rows={visibleItems.map((item) => {
        const code = String(item.code || "");
        return (
          <MetadataRow
            callbacks={callbacks}
            confirmed={confirmedCodes.has(code)}
            busy={props.pendingChanges?.get(code)?.busy}
            pending={props.pendingChanges?.get(code)?.kind}
            recovery={props.pendingChanges?.get(code)?.actions}
            item={item}
            key={code}
            onConfirm={actions.confirm ? onConfirm : undefined}
            onDrop={actions.drop ? onDrop : undefined}
            onEdit={onEditIndex}
            selected={Boolean(code && selectedIndex?.code === code && (!selectedIndex.segment || selectedIndex.segment === segment))}
            segment={segment}
            session={session}
            type={type}
          />
        );
      })} />
    </>;
  };

  const renderSegment = (
    segment: string,
    title: string,
    render: () => { count: number; children: ReactNode },
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
        progressLabel={actionSegment ? pendingSegments?.get(actionSegment)?.label : undefined}
        headerAction={count =>
          actionSegment && currentSegment === segment && (
            segment === segments.PROPERTY && view.hasMap || onAddIndex ||
            actions.reprocess && onReprocess || actions.drop && onClear
          ) ? (
            <MetadataActions>
              {segment === segments.PROPERTY && view.hasMap ? (
                <ActionButton label="Open legal view" lineAligned={false} text onClick={() => callbacks.onLegalView?.()}>
                  <Icon name="address" />
                  Show Map
                </ActionButton>
              ) : null}
              {onAddIndex ? (
                <ActionButton label="Add Index" lineAligned={false} text onClick={event => onAddIndex(actionSegment, event.currentTarget)}>
                  Add Index
                </ActionButton>
              ) : null}
              {actions.reprocess && onReprocess ? (
                <ConfButton flat size="sm" label="Reprocess" style={rowStyles.actionButton(false, false, true)} onConfirm={() => onReprocess(actionSegment)}>
                  Reprocess
                </ConfButton>
              ) : null}
              {actions.drop && onClear ? (
                <ConfButton disabled={count === 0} flat size="sm" label="Clear indexes" variant="danger" style={rowStyles.actionButton(false, false, true)} onConfirm={() => onClear(actionSegment)} />
              ) : null}
            </MetadataActions>
          ) : null
        }
        resetKey={metadata}
        render={() => {
          const content = render();
          return { ...content, children: <>{content.children}{note && (segment === segments.TITLE || choices === null) ? <p role="note" style={metadataStyles.muted}>{note}</p> : null}</> };
        }}
        onOpenChange={(open) => setSectionOpen(segment, open)}
        open={currentSegment === segment}
        shortcutKey={sectionShortcut(segment)}
        title={title}
      >
        {null}
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

  const view = {
    get sideItems() { return uniqueIndexes(metadata.parties ? panelData.parties : []); },
    get partyItems() {
      const sideItems = view.sideItems;
      return uniqueIndexes([...sideItems, ...getSegmentItems(metadata.indexes, [segments.PARTY])]).slice(sideItems.length);
    },
    get executionIndexes() { return uniqueIndexes(panelData.execution?.indexes ?? []).sort((a, b) => String(a.aspect).localeCompare(String(b.aspect))); },
    get endorsements() { return uniqueIndexes(panelData.endorsements); },
    get references() { return uniqueIndexes(panelData.references); },
    get monetaryItems() { return uniqueIndexes(panelData.monetarys); },
    get notary() { return uniqueIndexes(panelData.notary); },
    get transactions() { return uniqueIndexes(panelData.transactions); },
    get vitals() { return uniqueIndexes(panelData.vitals); },
    get judgments() { return uniqueIndexes(panelData.judgments); },
    get headingItems() { return headingRows(metadata); },
    get pageItems() { return pageError ? [] : pages(metadata); },
    get legalGroups() { return (metadata.legals?.groups || metadata.legals?.legalGroups || metadata.legals?.LegalGroups || metadata.legals?.items || []).filter((group) => Array.isArray(group.elements) && group.elements.length > 0); },
    get propertyItems() { return propertyVisible ? uniqueIndexes(panelData.properties.filter((item) => !view.legalGroups.length || item.aspect !== "legal_description")) : []; },
    get legalCount() { return legalVisible ? view.legalGroups.length : 0; },
    get hasMap() { return (legalVisible && getMapGroups(metadata.legals).length > 0) || (propertyVisible && Boolean(getParcelOptions(view.propertyItems).property_address?.trim())); },
    get secretItems() { return uniqueIndexes((metadata.secrets || []).filter((item) => cleanText(item.value) && !cleanText(item.value).startsWith("xxx") && !cleanText(item.value).includes("Not explicitly provided"))); },
  };

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
    [segments.ACKNOWLEDGMENT, selectedServices.has("ExecutionEnrichment") ? undefined : "Acknowledgment verification was not selected for this session."],
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
            <div style={metadataStyles.statistics}>
              {props.headerActions}
            </div>
          </header>
        ) : null}
        <div aria-label="Metadata accordion" data-panel-scroll="true" role="region" style={metadataStyles.accordion}>
        {isVisible(segments.PAGE) ? renderSegment(
          segments.PAGE,
          "Pages",
          () => ({ count: view.pageItems.length, children: pageError ? null : view.pageItems.length ? view.pageItems.map(({ page, recordable, isTitle }, index) => {
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
          }) : <EmptyRow message="No recordable pages found." /> }),
          null,
        ) : null}
        {isVisible(segments.TITLE) ? renderSegment(
          segments.TITLE,
          "Titles",
          () => {
            const items = view.headingItems;
            const titleRows = items.map((item, index) => {
              const row = { item, metadata, pageError: Boolean(pageError), callbacks, session, segment: segments.TITLE };
              return <ErrorBoundary key={`${item.label}-${item.value}-${index}`} title="Title page" resetKey={metadata}
                fallback={() => <HeadingRow {...row} pageError />}>
                <HeadingRow {...row} />
              </ErrorBoundary>;
            });
            return { count: items.length, children: titleRows.length ? titleRows : <EmptyRow message="No titles found." /> };
          },
          null,
        ) : null}
        {isVisible(segments.ENDORSEMENT) ? renderSegment(segments.ENDORSEMENT, "Endorsements", () => ({ count: view.endorsements.length, children: rows(view.endorsements, segments.ENDORSEMENT, "No endorsements found.") })) : null}
        {isVisible(segments.PARTY) ? renderSegment(segments.PARTY, "Parties(Party Clause)", () => ({ count: view.sideItems.length + view.partyItems.length, children: <>
          {metadata.parties ? rows(view.sideItems, segments.PARTY, view.partyItems.length ? undefined : "No parties found.", "index", "sides") : null}
          {rows(view.partyItems, segments.PARTY, metadata.parties ? undefined : "No parties found.")}
        </> })) : null}
        {isVisible(segments.REFERENCE) ? renderSegment(segments.REFERENCE, "References(Recital)", () => ({ count: view.references.length, children: rows(view.references, segments.REFERENCE, "No references found.") })) : null}
        {isVisible(segments.PROPERTY) || isVisible(segments.LEGAL) ? renderSegment(
          segments.PROPERTY,
          "Property Info",
          () => ({ count: view.propertyItems.length + view.legalCount, children: <div className="metadata-property">
            {view.propertyItems.length ? rows(view.propertyItems, segments.PROPERTY, "No property info found.") : null}
            {view.legalCount > 0 ? (
              <MetadataGroups items={view.legalGroups} page={group => group.page} hidePages>
                {(group, index) => {
                  const code = String(group.code || "");
                  const page = group.page || 0;
                  const isLegalRowSelected = Boolean(code && selectedIndex?.code === code && (!selectedIndex.segment || selectedIndex.segment === segments.LEGAL));
                  const payload = { code, page, segment: segments.LEGAL, session, type: String(group.type || "legal"), value: formatLabel(group.type || ""),
                    ...(group.original != null ? { metadataIndex: { label: "legal", value: group.original, source: cleanText(group.source), ambiguous: "" } } : {}),
                  } satisfies MetadataActionPayload;
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
                      <div
                        className="metadata-legal-header"
                        inert={props.pendingChanges?.has(code)}
                        onClick={onPageClick && !props.pendingChanges?.has(code) ? () => onPageClick(payload) : undefined}
                        style={{ display: "grid", gridColumn: "1 / -1", gridRow: "1", gridTemplateColumns: "subgrid", alignItems: "start", cursor: onPageClick ? "pointer" : undefined }}
                      >
                        <span aria-label="OK" role="img" title="OK" style={rowStyles.statusIcon}><SuccessIcon /></span>
                        <div inert={props.pendingChanges?.has(code)} style={{ ...rowStyles.aspects, ...rowStyles.body }}>
                          Legal Description
                        </div>
                        <div className="metadata-row-value" inert={props.pendingChanges?.has(code)} style={{ ...rowStyles.valueWithViewer, ...rowStyles.indexValueWithViewer }}>
                          <IndexValue plain value={payload.value} onClick={onPageClick ? () => onPageClick(payload) : undefined} />
                        </div>
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
                }}
              </MetadataGroups>
            ) : null}
            {!view.propertyItems.length && !view.legalCount ? <EmptyRow message="No property info found." /> : null}
          </div> }),
        ) : null}
        {isVisible(segments.MONETARY) ? renderSegment(segments.MONETARY, "Monetary", () => ({ count: view.monetaryItems.length, children: rows(view.monetaryItems, segments.MONETARY, "No monetary info found.") })) : null}
        {isVisible(segments.ACKNOWLEDGMENT) ? renderSegment(segments.ACKNOWLEDGMENT, "Acknowledgment", () => ({ count: view.notary.length + view.executionIndexes.length, children: <>
          {view.executionIndexes.length ? rows(view.executionIndexes, indexSegments.EXECUTION, "No execution results found.") : null}
          {view.notary.length || !view.executionIndexes.length ? rows(view.notary, segments.ACKNOWLEDGMENT, "No notary info found.") : null}
        </> })) : null}
        {isVisible(segments.TRANSACTION) ? renderSegment(segments.TRANSACTION, "Transactional", () => ({ count: view.transactions.length, children: rows(view.transactions, segments.TRANSACTION, "No transaction indexes found.") })) : null}
        {isVisible(segments.VITAL) ? renderSegment(segments.VITAL, "Vital", () => ({ count: view.vitals.length, children: rows(view.vitals, segments.VITAL, "Vital information not found.") })) : null}
        {isVisible(segments.JUDGMENT) ? renderSegment(segments.JUDGMENT, "Judgment", () => ({ count: view.judgments.filter(item => !removedCodes.has(String(item.code || ""))).length, children: rows(view.judgments, segments.JUDGMENT, "No judgment indexes found.") })) : null}
        {isVisible(segments.SECRETS) ? renderSegment(segments.SECRETS, "Confidential", () => ({ count: view.secretItems.length, children: rows(view.secretItems, segments.SECRETS, "No confidential info found.", "secret") })) : null}
        {children}
        </div>
        <footer aria-label="Metadata actions" data-metadata-footer="true" style={metadataStyles.footerEmpty} />
      </section>
    </Tooltip.Provider>
  );
}

function HeadingRow({ item, metadata, pageError, callbacks, session, segment }: { item: ReturnType<typeof headingRows>[number]; metadata: MetadataPayload; pageError: boolean; callbacks: MetadataCallbacks; session: string; segment: string }) {
  const page = !pageError ? pages(metadata).find(item => item.isTitle)?.page : undefined;
  return <MetadataRow callbacks={callbacks} confirmed={false} selected={false} session={session} segment={segment} type="title"
    item={{ label: item.label, value: item.value, code: page?.code, page: page?.name }} />;
}
