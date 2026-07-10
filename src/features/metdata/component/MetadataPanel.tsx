import * as Tooltip from "@radix-ui/react-tooltip";
import { type JSX, type ReactNode } from "react";
import { legalSummaryStyle, metadataStyles, rowStyles, segmentStyles } from "../style/metadataStyles";
import type {
  IndexActionPayload,
  IndexChoice,
  IndexMetadataCallbacks,
  IndexSelected,
  IndexStoreState,
  IndexSegmentValues,
  MetadataIndex,
  MetadataPayload,
  MetadataPanelData,
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
  "recital",
  "exhibit",
  "endorsement",
  "transaction",
  "party_clause",
  "confidential",
  "monetaryinfo",
  "acknowledgment",
  "court",
  "vital",
]);

export type MetadataPanelProps = {
  callbacks: IndexMetadataCallbacks;
  choices: IndexChoice[] | string | null;
  children?: ReactNode;
  metadata: MetadataPayload | null;
  onConfirm: (payload: IndexActionPayload) => void;
  onDrop: (payload: IndexActionPayload) => void;
  confirmedCodes: Set<string>;
  openSegment: string | null;
  removedCodes: Set<string>;
  selectedIndex: IndexSelected | null;
  segments: IndexSegmentValues;
  session: string;
  setSectionOpen: (segment: string, open: boolean) => void;
  store: Pick<IndexStoreState, "error" | "status">;
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

function segmentVisible(choices: MetadataPanelProps["choices"], segment: keyof typeof choiceSections): boolean {
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
    metadata,
    onConfirm,
    onDrop,
    openSegment,
    removedCodes,
    segments,
    selectedIndex,
    session,
    setSectionOpen,
    store,
    panelData,
  } = props;

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
          onConfirm={onConfirm}
          onDrop={onDrop}
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
            {callbacks.onReprocessSegment ? (
              <SectionAction
                onClick={async () => {
                  const complete = await callbacks.onReprocessSegment?.(actionSegment);
                  if (complete) callbacks.onReprocessComplete?.(actionSegment);
                }}
              >
                Reprocess
              </SectionAction>
            ) : null}
            {callbacks.onReprocessSegment && callbacks.onEditPage ? <span aria-hidden="true" style={segmentStyles.actionDivider}>|</span> : null}
            {callbacks.onEditPage ? (
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
      title={title}
    >
      {content}
    </MetadataSegment>
  );

  if (store.status === "loading" && !metadata) {
    return null;
  }

  if (store.status === "error") {
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
        {renderSegment(
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
              onConfirm={onConfirm}
              onDrop={onDrop}
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
        )}
        {segmentVisible(choices, "secrets") ? renderSegment(segments.SECRETS, "Confidential", secretItems.length, rows(secretItems, segments.SECRETS, "No confidential info found.", "secret")) : null}
        {renderSegment(
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
        )}
        {segmentVisible(choices, "endorsement") ? renderSegment(segments.ENDORSEMENT, "Record Endorsements", panelData.endorsements.length, rows(panelData.endorsements, segments.ENDORSEMENT, "No endorsements found.")) : null}
        {segmentVisible(choices, "party") ? renderSegment(segments.PARTY, "Parties(Party Clause)", panelData.parties.length, rows(panelData.parties, segments.PARTY, "No parties found.")) : null}
        {segmentVisible(choices, "reference") ? renderSegment(segments.REFERENCE, "References(Recital)", panelData.references.length, rows(panelData.references, segments.REFERENCE, "No references found.")) : null}
        {segmentVisible(choices, "property") ? renderSegment(segments.PROPERTY, "Property Terms(Exhibits)", panelData.properties.length, rows(panelData.properties, segments.PROPERTY, "No property Info found.")) : null}
        {segmentVisible(choices, "legal") ? renderSegment(
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
                        <IndexValue value={payload.value} onClick={onPageClick ? () => openMetadataImage(onPageClick, payload) : undefined} />
                        <div style={rowStyles.actionGroup}>
                          {payload.value ? (
                            <ActionButton label={`Copy value ${payload.value}`} onClick={() => copyIndexValue(payload.value)}>
                              <Icon name="copy" />
                            </ActionButton>
                          ) : null}
                          {String(group.type || "").trim() === "lot_block" ? (
                            <ActionButton
                              label="Open legal view"
                              onClick={() => {
                                callbacks.onLegalView?.(payload);
                              }}
                            >
                              <Icon name="address" />
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
        {segmentVisible(choices, "monetary") ? renderSegment(segments.MONETARY, "Monetary Terms", panelData.monetarys.length, rows(panelData.monetarys, segments.MONETARY, "No monetary info found.")) : null}
        {segmentVisible(choices, "acknowledgment") ? renderSegment(segments.ACKNOWLEDGMENT, "Notarial Acknowledgment", panelData.notary.length, rows(panelData.notary, segments.ACKNOWLEDGMENT, "No notary Info found.")) : null}
        {segmentVisible(choices, "transaction") ? renderSegment(segments.TRANSACTION, "Transactional", panelData.transactions.length, rows(panelData.transactions, segments.TRANSACTION, "No Transaction indexes found.")) : null}
        {segmentVisible(choices, "vital") ? renderSegment(segments.VITAL, "Vital", panelData.vitals.length, rows(panelData.vitals, segments.VITAL, "Vital information not found.")) : null}
        {fiscal.factors.length ? renderSegment(segments.FEEFACTOR, "Fee Factors", fiscal.factors.length, fiscal.factors.map((item, index) => <pre key={index} style={metadataStyles.pre}>{JSON.stringify(item, null, 2)}</pre>), null) : null}
        {fiscal.fees.length ? renderSegment(segments.FEE, "Fees", fiscal.fees.length, fiscal.fees.map((item, index) => <pre key={index} style={metadataStyles.pre}>{JSON.stringify(item, null, 2)}</pre>), null) : null}
        {fiscal.funds.length ? renderSegment(segments.FUND, "Funds", fiscal.funds.length, fiscal.funds.map((item, index) => <pre key={index} style={metadataStyles.pre}>{JSON.stringify(item, null, 2)}</pre>), null) : null}
        {Array.isArray(metadata.chain) && metadata.chain.length ? renderSegment(segments.CHAIN, "Chain", metadata.chain.length, metadata.chain.map((item, index) => <pre key={index} style={metadataStyles.pre}>{JSON.stringify(item, null, 2)}</pre>), null) : null}
        {metadata.history ? renderSegment(segments.HISTORY, "History", Object.keys(metadata.history).length, <pre style={metadataStyles.pre}>{JSON.stringify(metadata.history, null, 2)}</pre>, null) : null}
        {children}
      </section>
    </Tooltip.Provider>
  );
}
