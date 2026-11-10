import { ErrorBadge, ErrorBoundary, LoadPlaceholder, getPanelData, isAmbiguous, progressStyles, skeletonStyle } from "aurora-core";
import type { MetadataPayload } from "aurora-core";
import { prepareAuditReport } from "../../audit/data/auditData";
import { prepareIqReport } from "../../iq/data/iqData";
import { iqColors } from "../../iq/style/iqStyles";
import type { IqBucket } from "../../iq/type/iq.types";
import { uniqueIndexes } from "../../metdataview/data/uniqueIndexes";
import { summaryCss, summaryStyles } from "../style/summaryStyles";

type SummaryValue = { data: unknown; error: string | null };
export type IndexSummaryProps = Record<"metadata" | "audit" | "iq", SummaryValue>;

function SummaryMetric({ label, value, error, score, bucket }: { label: string; value: number | null; error: string | null; score?: boolean; bucket?: IqBucket }) {
  return <div className="index-summary-metric" style={{ ...summaryStyles.metric, ...(score ? summaryStyles.score : {}) }}>
    <dt style={summaryStyles.label}>{label}</dt>
    <dd style={{ ...summaryStyles.value, ...(score ? summaryStyles.percent : {}), ...(bucket ? { color: iqColors[bucket].fg } : {}) }}>
      {error !== null ? <ErrorBadge label={label} error={error} /> : value === null ? <LoadPlaceholder label={`Loading ${label}`}><span aria-hidden="true" style={{ ...skeletonStyle, height: "1em", width: "3ch" }} /></LoadPlaceholder> : <>
        {value}{score ? "%" : null}
        {score ? <span role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-valuetext={`${value}%`} style={{ ...progressStyles.bar, ...summaryStyles.meter }}><span style={{ ...progressStyles.fill, ...(bucket ? { backgroundColor: iqColors[bucket].bar } : {}), width: `${value}%` }} /></span> : null}
      </>}
    </dd>
  </div>;
}

function MetadataCounts({ data, error }: SummaryValue) {
  const metadata = data as MetadataPayload | null;
  const panel = metadata ? getPanelData(metadata) : null;
  const indexes = metadata && panel ? uniqueIndexes([
    ...(metadata.parties ? panel.parties : []),
    ...(metadata.indexes ?? []),
    ...(panel.execution?.indexes ?? []),
  ]) : null;
  return <>
    <SummaryMetric label="Indexes" value={indexes?.length ?? null} error={error} />
    <SummaryMetric label="Ambiguities" value={indexes ? indexes.filter(index => isAmbiguous(index.ambiguous)).length : null} error={error} />
  </>;
}

function IqScores({ data, error }: SummaryValue) {
  const view = data ? prepareIqReport(data) : null;
  return <>
    <SummaryMetric label="IQ" value={view ? view.iq.displayInt : null} error={error} bucket={view?.iq.bucket} score />
    <SummaryMetric label="Compliance" value={view ? view.gates.displayPercent : null} error={error} bucket={view?.gates.bucket} score />
  </>;
}

function AuditChanges({ data, error }: SummaryValue) {
  const view = data ? prepareAuditReport(data, { changeType: "", process: "", segment: "" }, []) : null;
  return <SummaryMetric label="Audit changes" value={view ? view.total : null} error={error} />;
}

export function IndexSummary({ metadata, audit, iq }: IndexSummaryProps) {
  return <section aria-label="Indexing results" style={summaryStyles.root}>
    <style>{summaryCss}</style>
    <dl className="index-summary-counts" style={summaryStyles.counts}>
      <ErrorBoundary title="Index counts" resetKey={metadata.data} fallback={error => <MetadataCounts data={null} error={error.message} />}>
        <MetadataCounts {...metadata} />
      </ErrorBoundary>
      <ErrorBoundary title="Audit changes" resetKey={audit.data} fallback={error => <AuditChanges data={null} error={error.message} />}>
        <AuditChanges {...audit} />
      </ErrorBoundary>
    </dl>
    <dl style={summaryStyles.scores}>
      <ErrorBoundary title="IQ scores" resetKey={iq.data} fallback={error => <IqScores data={null} error={error.message} />}>
        <IqScores {...iq} />
      </ErrorBoundary>
    </dl>
  </section>;
}
