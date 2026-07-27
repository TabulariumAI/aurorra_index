import * as Tooltip from "@radix-ui/react-tooltip";
import { type JSX, type ReactNode } from "react";
import { legalSummaryStyle, metadataStyles, rowStyles, segmentStyles } from "../style/metadataStyles";
import type {
  IndexActionPayload,
  IndexChoice,
  IndexMetadataCallbacks,
  IndexSelected,
  IndexSegmentValues,
  MetadataPanelActions,
  MetadataIndex,
  MetadataPayload,
  MetadataPanelData,
  MetadataPanelSections,
  MetadataStatus,
} from "../type/metadata.types";
import {
  ActionButton,
  EmptyRow,
  Icon,
  IndexValue,
  MetadataRow,
  cleanText,
  copyIndexValue,
  formatLabel,
  openMetadataImage,
} from "./MetadataRows";
import { MetadataSegment } from "./MetadataSegment";

const choiceSections = {
  acknowledgment: "AcknowledgmentIndexing",
  endorsement: "EndorsementIndexing",
  legal: "LegalEnrichment",
  monetary: "MonetaryInfoIndexing",
  party: "PartyClauseIndexing",
  property: "ExhibitIndexing",
  reference: "RecitalIndexing",
  secrets: "ConfidentialIndexing",
  transaction: "TransactionIndexing",
  vital: "VitalIndexing",
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
  "court",
  "vital",
]);

export type MetadataPanelProps = {
  actions: MetadataPanelActions;
  callbacks: IndexMetadataCallbacks;
  choices: IndexChoice[] | string | null;
  children?: ReactNode;
  metadata: MetadataPayload | null;
  onConfirm?: (payload: IndexActionPayload) => Promise<void> | void;
  onDrop?: (payload: IndexActionPayload) => Promise<void> | void;
  onReprocess?: (segment: string) => Promise<void> | void;
  confirmedCodes: Set<string>;
  openSegment: string | null;
  removedCodes: Set<string>;
  sections: MetadataPanelSections;
  selectedIndex: IndexSelected | null;
  segments: IndexSegmentValues;
  session: string;
  setSectionOpen: (segment: string, open: boolean) => void;
  shortcuts: ReadonlyMap<string, string> | null;
  status: MetadataStatus;
  panelData: MetadataPanelData | null;
};

function getChoiceLevel(choices: MetadataPanelProps["choices"], name: string): number {
  try {
    let parsed: unknown = choices;
    while (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    if (!Array.isArray(parsed)) return 0;
    const match = parsed.find((choice) => choice && typeof choice === "object" && (choice as { service?: unknown }).service === name);
    return match ? Number((match as { level?: unknown }).level) : 0;
  } catch {
    return 0;
  }
}

function choiceSegmentVisible(choices: MetadataPanelProps["choices"], segment: keyof typeof choiceSections): boolean {
  return getChoiceLevel(choices, choiceSections[segment]) > 0;
}

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
  ];
}

function fiscalItems(metadata: MetadataPayload, key: "fee_factors" | "fees" | "funds") {
  const items = metadata[key] || [];
  return items.filter((item) => Number((item as { amount?: unknown }).amount || 0) !== 0 || Boolean((item as { explanation?: unknown }).explanation));
}

function SectionAction({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => Promise<void> | void;
}) {
  return (
    <a
      href="#"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void onClick();
      }}
      style={segmentStyles.actionLink}
    >
      {children}
    </a>
  );
}

export function MetadataPanel(props: MetadataPanelProps): JSX.Element | null {
  const {
    callbacks,
    children,
    choices,
    confirmedCodes,
    actions,
    metadata,
    onConfirm,
    onDrop,
    onReprocess,
    openSegment,
    removedCodes,
    sections,
    segments,
    selectedIndex,
    session,
    setSectionOpen,
    shortcuts,
    status,
    panelData,
  } = props;

  const hidden = sections.hiddenSegments;
  const isVisible = (segment: string) => !hidden.has(segment);
  const choiceVisible = (segment: string, choice: keyof typeof choiceSections) =>
    isVisible(segment) && (!sections.filterByChoices || choiceSegmentVisible(choices, choice));
  const sectionShortcut = (segment: string) => shortcuts?.get(segment) ?? null;

  const rows = (items: MetadataIndex[], segment: string, emptyMessage: string, type = "index") => {
    const visibleItems = items.filter((item) => !removedCodes.has(String(item.code || "")));
    if (visibleItems.length === 0) return <EmptyRow message={emptyMessage} />;
    return visibleItems.map((item, index) => {
      const code = String(item.code || "");
      return (
        <MetadataRow
          callbacks={callbacks}
          confirmed={confirmedCodes.has(code)}
          item={item}
          key={`${code}-${index}`}
          onConfirm={actions.confirm ? onConfirm : undefined}
          onDrop={actions.drop ? onDrop : undefined}
          onAddressClick={callbacks.onAddressClick}
          selected={Boolean(code && selectedIndex?.code === code && (!selectedIndex.segment || selectedIndex.segment === segment))}
          segment={segment}
          session={session}
          type={type}
        />
      );
    });
  };

  const renderSegment = (
    segment: string,
    title: string,
    count: number,
    content: ReactNode,
    actionSegment: string | null = segment,
  ) => (
    <MetadataSegment
      action={
        actionSegment ? (
          <div style={metadataStyles.actionGroup}>
            {actions.reprocess && actionSegment && onReprocess ? (
              <SectionAction
                onClick={async () => {
                  await onReprocess(actionSegment);
                }}
              >
                Reprocess
              </SectionAction>
            ) : null}
            {actions.reprocess && actionSegment && onReprocess && actions.refine && callbacks.onEditPage ? <span aria-hidden="true" style={segmentStyles.actionDivider}>|</span> : null}
            {actions.refine && callbacks.onEditPage ? (
              <SectionAction
                onClick={() =>
                  callbacks.onEditPage?.({
                    code: "",
                    page: 0,
                    segment: actionSegment,
                    session,
                    type: "segment",
                  })
                }
                >
                Refine or Chat
              </SectionAction>
            ) : null}
          </div>
        ) : null
      }
      count={count}
      onOpenChange={(open) => setSectionOpen(segment, open)}
      open={openSegment === segment}
      shortcutKey={sectionShortcut(segment)}
      title={title}
    >
      {content}
    </MetadataSegment>
  );

  if (status === "loading" && !metadata) {
    return null;
  }

  if (status === "error") {
    return null;
  }

  if (!metadata || !panelData) {
    return (
      <section aria-label="Metadata" style={metadataStyles.sectionShell}>
        <EmptyRow message="No metadata found." />
      </section>
    );
  }

  const titleItems = titles(metadata);
  const pageItems = pages(metadata);
  const legalGroups = (metadata.legals?.groups || metadata.legals?.legalGroups || metadata.legals?.LegalGroups || metadata.legals?.items || []).filter((group) => Array.isArray(group.elements) && group.elements.length > 0);
  const secretItems = (metadata.secrets || []).filter((item) => cleanText(item.value) && !cleanText(item.value).startsWith("xxx") && !cleanText(item.value).includes("Not explicitly provided"));
  const fiscal = {
    factors: fiscalItems(metadata, "fee_factors"),
    fees: fiscalItems(metadata, "fees"),
    funds: fiscalItems(metadata, "funds"),
  };

  return (
    <Tooltip.Provider delayDuration={250}>
      <section aria-label="Metadata" style={metadataStyles.root}>
        <header style={metadataStyles.header}>
          <div>
            <h2 style={metadataStyles.title}>{formatLabel(metadata.heading?.class || "")}</h2>
            <span style={metadataStyles.session}>{session}</span>
          </div>
        </header>
        {isVisible(segments.PAGE) ? renderSegment(
          segments.PAGE,
          "Pages",
          pageItems.length,
          pageItems.length ? pageItems.map(({ page, recordable }, index) => {
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
              value: `${pageNum} : ${pageNum === "1" ? "Title" : formatLabel(pageClass)} page`,
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
                selected={Boolean(code && selectedIndex?.code === code)}
                segment={segments.PAGE}
                session={session}
                type="page"
              />
            );
          }) : <EmptyRow message="No recordables pages found." />,
          null,
        ) : null}
        {choiceVisible(segments.SECRETS, "secrets") ? renderSegment(segments.SECRETS, "Confidential", secretItems.length, rows(secretItems, segments.SECRETS, "No confidential info found.", "secret")) : null}
        {isVisible(segments.TITLE) ? renderSegment(
          segments.TITLE,
          "Titles",
          titleItems.length,
          titleItems.length ? titleItems.map((item, index) => (
            <article key={`${item.title}-${index}`} style={metadataStyles.article}>
              <strong>{item.title}</strong>
              {item.explanation ? <div style={metadataStyles.muted}>{item.explanation}</div> : null}
            </article>
          )) : <EmptyRow message="No titles found." />,
          null,
        ) : null}
        {choiceVisible(segments.ENDORSEMENT, "endorsement") ? renderSegment(segments.ENDORSEMENT, "Record Endorsements", panelData.endorsements.length, rows(panelData.endorsements, segments.ENDORSEMENT, "No endorsements found.")) : null}
        {choiceVisible(segments.PARTY, "party") ? renderSegment(segments.PARTY, "Parties(Party Clause)", panelData.parties.length, rows(panelData.parties, segments.PARTY, "No parties found.")) : null}
        {choiceVisible(segments.REFERENCE, "reference") ? renderSegment(segments.REFERENCE, "References(Recital)", panelData.references.length, rows(panelData.references, segments.REFERENCE, "No references found.")) : null}
        {choiceVisible(segments.PROPERTY, "property") ? renderSegment(segments.PROPERTY, "Property Terms(Exhibits)", panelData.properties.length, rows(panelData.properties, segments.PROPERTY, "No property Info found.")) : null}
        {choiceVisible(segments.LEGAL, "legal") ? renderSegment(
          segments.LEGAL,
          "Legal Description",
          legalGroups.length,
          <div>
            {metadata.legals?.summary ? <p style={legalSummaryStyle()}>{metadata.legals.summary}</p> : null}
            {legalGroups.length ? (
              <div style={metadataStyles.legalGroupList}>
                {legalGroups.map((group, index) => {
                  const code = String(group.code || "");
                  const page = Number(group.page || 0);
                  const isLegalRowSelected = Boolean(code && selectedIndex?.code === code && (!selectedIndex.segment || selectedIndex.segment === segments.LEGAL));
                  const payload = { code, page, segment: segments.LEGAL, session, type: String(group.type || "legal"), value: formatLabel(group.type || "") } satisfies IndexActionPayload;
                  const onPageClick = page && code ? callbacks.onPageClick : undefined;
                  return (
                    <article
                      data-active={isLegalRowSelected ? "true" : "false"}
                      data-index-code={code || undefined}
                      data-index-segment={segments.LEGAL}
                      style={rowStyles.row(isLegalRowSelected, "forestgreen")}
                      key={`${code}-${index}`}
                    >
                      <div style={rowStyles.header}>
                        <div style={rowStyles.valueWithViewer}>
                          {String(group.type || "").trim() === "lot_block" ? (
                            <ActionButton
                              label="Open legal view"
                              lineAligned
                              onClick={() => {
                                callbacks.onLegalView?.(payload);
                              }}
                            >
                              <Icon name="address" />
                            </ActionButton>
                          ) : null}
                          <IndexValue value={payload.value} onClick={onPageClick ? () => openMetadataImage(onPageClick, payload) : undefined} />
                        </div>
                        <div style={rowStyles.actionGroup}>
                          {payload.value ? (
                            <ActionButton label={`Copy value ${payload.value}`} lineAligned={false} onClick={() => copyIndexValue(payload.value)}>
                              <Icon name="copy" />
                            </ActionButton>
                          ) : null}
                        </div>
                      </div>
                      {(group.elements || []).map((element, elementIndex) => (
                        <div key={`${element.aspect}-${elementIndex}`} style={metadataStyles.legalElement}>
                          <strong>{formatLabel(element.aspect || "")}:</strong> {cleanText(element.value)}
                          {element.explanation ? <div style={metadataStyles.muted}>{element.explanation}</div> : null}
                        </div>
                      ))}
                    </article>
                  );
                })}
              </div>
            ) : <EmptyRow message="No legal descriptions found." />}
          </div>,
        ) : null}
        {choiceVisible(segments.MONETARY, "monetary") ? renderSegment(segments.MONETARY, "Monetary Terms", panelData.monetarys.length, rows(panelData.monetarys, segments.MONETARY, "No monetary info found.")) : null}
        {choiceVisible(segments.ACKNOWLEDGMENT, "acknowledgment") ? renderSegment(segments.ACKNOWLEDGMENT, "Notarial Acknowledgment", panelData.notary.length, rows(panelData.notary, segments.ACKNOWLEDGMENT, "No notary Info found.")) : null}
        {choiceVisible(segments.TRANSACTION, "transaction") ? renderSegment(segments.TRANSACTION, "Transactional", panelData.transactions.length, rows(panelData.transactions, segments.TRANSACTION, "No Transaction indexes found.")) : null}
        {choiceVisible(segments.VITAL, "vital") ? renderSegment(segments.VITAL, "Vital", panelData.vitals.length, rows(panelData.vitals, segments.VITAL, "Vital information not found.")) : null}
        {isVisible(segments.FEEFACTOR) && (fiscal.factors.length || sections.showEmpty) ? renderSegment(segments.FEEFACTOR, "Fee Factors", fiscal.factors.length, fiscal.factors.length ? fiscal.factors.map((item, index) => <pre key={index} style={metadataStyles.pre}>{JSON.stringify(item, null, 2)}</pre>) : <EmptyRow message="No fee factors found." />, null) : null}
        {isVisible(segments.FEE) && (fiscal.fees.length || sections.showEmpty) ? renderSegment(segments.FEE, "Fees", fiscal.fees.length, fiscal.fees.length ? fiscal.fees.map((item, index) => <pre key={index} style={metadataStyles.pre}>{JSON.stringify(item, null, 2)}</pre>) : <EmptyRow message="No fees found." />, null) : null}
        {isVisible(segments.FUND) && (fiscal.funds.length || sections.showEmpty) ? renderSegment(segments.FUND, "Funds", fiscal.funds.length, fiscal.funds.length ? fiscal.funds.map((item, index) => <pre key={index} style={metadataStyles.pre}>{JSON.stringify(item, null, 2)}</pre>) : <EmptyRow message="No fund distributions found." />, null) : null}
        {isVisible(segments.CHAIN) && (Array.isArray(metadata.chain) && metadata.chain.length || sections.showEmpty) ? renderSegment(segments.CHAIN, "Chain", Array.isArray(metadata.chain) ? metadata.chain.length : 0, Array.isArray(metadata.chain) && metadata.chain.length ? metadata.chain.map((item, index) => <pre key={index} style={metadataStyles.pre}>{JSON.stringify(item, null, 2)}</pre>) : <EmptyRow message="No data found." />, null) : null}
        {isVisible(segments.HISTORY) && (metadata.history && Object.keys(metadata.history).length || sections.showEmpty) ? renderSegment(segments.HISTORY, "History", metadata.history ? Object.keys(metadata.history).length : 0, metadata.history && Object.keys(metadata.history).length ? <pre style={metadataStyles.pre}>{JSON.stringify(metadata.history, null, 2)}</pre> : <EmptyRow message="No history found." />, null) : null}
        {children}
      </section>
    </Tooltip.Provider>
  );
}
