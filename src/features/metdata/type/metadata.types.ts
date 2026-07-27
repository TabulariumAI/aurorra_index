import type { MetadataIndex as LensMetadataIndex } from "@tabulariumai/aurora-lens";
import type { ReactNode } from "react";
import type { JobEventCallback } from "aurora-contracts";

export type IndexSegmentValues = {
  TITLE: string;
  PAGE: string;
  PARTY: string;
  FEE: string;
  FUND: string;
  FEEFACTOR: string;
  ACKNOWLEDGMENT: string;
  TRANSACTION: string;
  SECRETS: string;
  PROPERTY: string;
  REFERENCE: string;
  LEGAL: string;
  MONETARY: string;
  ENDORSEMENT: string;
  CHAIN: string;
  HISTORY: string;
  VITAL: string;
  COURT: string;
};

export type IndexChoice = {
  service: string;
  level: number | string;
};

export type MetadataIndex = {
  aspect?: string;
  ambiguous?: string | boolean | number | null;
  code?: string;
  explanation?: string;
  label?: string;
  name?: string;
  page?: string | number;
  page_number?: string | number;
  segment?: string;
  source?: string;
  value?: string;
};

export type MetadataPage = {
  class?: string;
  code?: string;
  explanation?: string;
  name?: string | number;
  segments?: string[];
};

export type MetadataHeading = {
  class?: string;
  explanation?: string;
  secondary_titles?: string[];
  title?: string;
  total?: number;
};

export type LegalElement = {
  aspect?: string;
  explanation?: string;
  value?: string;
};

export type LegalGroup = {
  code?: string;
  elements?: LegalElement[];
  page?: string | number;
  type?: string;
};

export type LegalPayload = {
  groups?: LegalGroup[];
  legalGroups?: LegalGroup[];
  LegalGroups?: LegalGroup[];
  items?: LegalGroup[];
  location?: Record<string, unknown>;
  plat?: Record<string, unknown>;
  summary?: string;
  text?: string;
};

export type MetadataHeadingJSON = {
  heading?: MetadataHeading;
  tags?: unknown;
  usage?: unknown;
};

export type MetadataSecretsJSON = {
  secrets?: MetadataIndex[];
};

export type MetadataIndexJSON = {
  indexes?: MetadataIndex[];
  parties?: MetadataIndex[];
};

export type MetadataLegalJSON = {
  legals?: LegalPayload;
};

export type MetadataPagesJSON = {
  pages?: MetadataPayload["pages"];
};

export type MetadataChainJSON = {
  chain?: MetadataPayload["chain"];
  history?: MetadataPayload["history"];
};

export type MetadataFinancialJSON = {
  fee_factors?: MetadataPayload["fee_factors"];
  fees?: MetadataPayload["fees"];
  funds?: MetadataPayload["funds"];
};

export type MetadataJSONParts = {
  chainJSON: MetadataChainJSON;
  financialJSON: MetadataFinancialJSON;
  headingJSON: MetadataHeadingJSON;
  indexJSON: MetadataIndexJSON;
  legalJSON: MetadataLegalJSON;
  pagesJSON: MetadataPagesJSON;
  secretsJSON: MetadataSecretsJSON;
};

export type MetadataPayload = {
  chain?: Record<string, unknown>[];
  fee_factors?: Record<string, unknown>[];
  fees?: Record<string, unknown>[];
  funds?: Record<string, unknown>[];
  heading?: MetadataHeading;
  history?: Record<string, unknown>;
  indexes?: MetadataIndex[];
  legals?: LegalPayload;
  pages?: {
    nonrecordables?: MetadataPage[];
    num_of_pages?: number;
    recordables?: MetadataPage[];
  };
  parties?: MetadataIndex[];
  secrets?: MetadataIndex[];
};

export type MetadataPanelData = MetadataPayload & {
  endorsements: MetadataIndex[];
  monetarys: MetadataIndex[];
  notary: MetadataIndex[];
  parties: MetadataIndex[];
  properties: MetadataIndex[];
  references: MetadataIndex[];
  transactions: MetadataIndex[];
  vitals: MetadataIndex[];
};

export type IndexSelected = {
  code: string;
  segment: string | null;
};

export type IndexDeferredState = {
  pageMap: ReadonlyMap<string, string>;
  segment: string | null;
  selectedIndex: IndexSelected | null;
};

export type IndexMetadataRefresh = {
  id: number;
  segment: string;
  session: string;
};

export type IndexActionPayload = {
  code: string;
  highlightOptions?: { scroll: boolean };
  metadataIndex?: LensMetadataIndex | null;
  page: number;
  pageClass?: string;
  pageSegments?: string[];
  quote?: string;
  segment: string | null;
  session: string;
  type: string;
  value?: string;
};

export type MetadataAction =
  | { action: "reprocess"; segment: string; session: string }
  | { action: "confirm"; code: string; session: string }
  | { action: "drop"; code: string; session: string };

export type MetadataActionFailure = {
  action: MetadataAction;
  error: IndexWorkerError;
};

export type IndexMetadataCallbacks = {
  onAddressClick?: (address: string) => void;
  onActionComplete?: (event: MetadataAction) => void;
  onActionError?: (event: MetadataActionFailure) => void;
  onEditPage?: (payload: IndexActionPayload) => void;
  onIndexFocus?: (selected: IndexSelected | null) => void;
  onJobEvent?: JobEventCallback;
  onLegalView?: (payload: IndexActionPayload) => void;
  onMetadataError?: (error: IndexWorkerError) => void;
  onMetadataLoaded?: (metadata: MetadataPayload) => void;
  onPageClick?: (payload: IndexActionPayload) => void;
  onRefresh?: (metadata: MetadataPayload) => void;
  onSegmentExpand?: (segment: string) => void;
  onView?: (metadata: MetadataPayload) => void;
  onViewCanceled?: () => void;
  onViewError?: (error: IndexWorkerError) => void;
  onViewStarted?: () => void;
};

export type IndexWorkerError = {
  code?: string;
  details?: unknown;
  error: string;
  status?: number;
};

export type IndexWorkerResult<T> =
  | { ok: true; data: T }
  | ({ ok: false } & IndexWorkerError);

export type IndexApplyResult = {
  applied: true;
  patches: number;
};

export type IndexReprocessResult = {
  data: string;
  status: "completed";
};

export type IndexWorkerCommand = ({
  apiBaseUrl: string;
  session: string;
  token: string;
} & (
  | { type: "indexData" }
  | { segment: string; type: "reprocessSegment" }
  | { code: string; type: "confirmIndex" }
  | { code: string; type: "dropIndex" }
));

export type IndexWorkerClient = {
  confirmIndex(token: string, session: string, code: string): Promise<IndexApplyResult>;
  dropIndex(token: string, session: string, code: string): Promise<IndexApplyResult>;
  indexData(token: string, session: string): Promise<MetadataPayload>;
  reprocessSegment(token: string, session: string, segment: string): Promise<IndexReprocessResult>;
};

export type IndexWorkerConfig = {
  apiBaseUrl: string;
};

export type MetadataStatus = "idle" | "loading" | "success" | "error";

export type IndexStoreState = {
  activeSession: string | null;
  error: IndexWorkerError | null;
  status: MetadataStatus;
  setError(error: IndexWorkerError): void;
  setLoaded(session: string): void;
  setLoading(session: string): void;
  resetMetadata(): void;
  invalidateSession(session: string): void;
};

export type IndexMetadataProps = {
  authToken: string | null;
  apiGatewayUrl: string;
  callbacks: IndexMetadataCallbacks;
  choices: IndexChoice[] | string | null;
  children?: ReactNode;
  deferredState: IndexDeferredState;
  refresh: IndexMetadataRefresh | null;
  segments: IndexSegmentValues;
  session: string;
  workerClient?: IndexWorkerClient;
};
