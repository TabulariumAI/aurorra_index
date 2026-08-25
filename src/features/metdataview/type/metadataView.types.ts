import type { MetadataIndex as LensMetadataIndex } from "@tabulariumai/aurora-lens";
import type { ReactNode } from "react";

export type MetdataSegmentValues = {
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
  VITAL: string;
  COURT: string;
};

export type MetdataChoice = {
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

export type MetadataFeeFactor = {
  ambiguous?: string;
  amount: string;
  code?: string;
  explanation?: string;
  name: string;
};

export type MetadataFeeItem = {
  amount: string;
  code?: string;
  explanation?: string;
  formula: string;
  name: string;
};

export type MetadataChainId = {
  key: string;
  value?: string;
};

export type MetadataChainRecord = {
  address?: string;
  class: string;
  code?: string;
  date?: string;
  docsref?: string;
  explanation?: string;
  identifiers?: MetadataChainId[];
  lotblocks?: string;
  metesbounds?: string;
  number?: string;
  page?: string;
  platsref?: string;
  plss?: string;
  required: string;
  role: string;
  session?: string;
  source?: string;
  status?: string;
  title: string;
};

export type MetadataConveyance = {
  amount?: string;
  date?: string;
  explanation?: string;
  grantees?: string;
  grantors?: string;
  title_company?: string;
};

export type MetadataMortgage = {
  amount?: string;
  borrowers?: string;
  date?: string;
  explanation?: string;
  lender?: string;
  status?: string;
};

export type MetadataEncumbrance = {
  amount?: string;
  date?: string;
  enc_type?: string;
  explanation?: string;
  parties?: string;
  status?: string;
};

export type MetadataHistory = {
  conveyance?: MetadataConveyance[];
  encumbrance?: MetadataEncumbrance[];
  mortgage?: MetadataMortgage[];
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
  chain?: MetadataChainRecord[];
  fee_factors?: MetadataFeeFactor[];
  fees?: MetadataFeeItem[];
  funds?: MetadataFeeItem[];
  heading?: MetadataHeading;
  history?: MetadataHistory;
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

export type MetdataSelected = {
  code: string;
  segment: string | null;
};

export type MetdataDeferredState = {
  pageMap: ReadonlyMap<string, string>;
  segment: string | null;
  selectedIndex: MetdataSelected | null;
};

export type MetdataMetadataRefresh = {
  id: number;
  segment: string;
  session: string;
};

export type MetdataActionPayload = {
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
  error: MetdataWorkerError;
};

export type MetdataMetadataCallbacks = {
  onAddressClick?: (address: string) => void;
  onActionComplete?: (event: MetadataAction) => void;
  onActionError?: (event: MetadataActionFailure) => void;
  onEditPage?: (payload: MetdataActionPayload) => void;
  onIndexFocus?: (selected: MetdataSelected | null) => void;
  onLegalView?: (payload: MetdataActionPayload) => void;
  onMetadataError?: (error: MetdataWorkerError) => void;
  onMetadataLoaded?: (metadata: MetadataPayload) => void;
  onPageClick?: (payload: MetdataActionPayload) => void;
  onRefresh?: (metadata: MetadataPayload) => void;
  onSegmentExpand?: (segment: string) => void;
  onView?: (metadata: MetadataPayload) => void;
  onViewCanceled?: () => void;
  onViewError?: (error: MetdataWorkerError) => void;
  onViewStarted?: () => void;
};

export type MetdataWorkerError = {
  code?: string;
  details?: unknown;
  error: string;
  status?: number;
};

export type MetdataWorkerResult<T> =
  | { ok: true; data: T }
  | ({ ok: false } & MetdataWorkerError);

export type MetdataPatchResult = {
  data: string;
  status: "completed" | "error" | "pending" | "processing";
  version: number;
};

export type MetdataReprocessResult = {
  data: string;
  status: "completed";
};

export type MetdataWorkerCommand = ({
  apiBaseUrl: string;
  session: string;
  token: string;
} & (
  | { type: "indexData" }
  | { segment: string; type: "reprocessSegment" }
  | { code: string; type: "confirmIndex" }
  | { code: string; type: "dropIndex" }
  | { type: "patchStatus"; version: number }
));

export type MetdataWorkerClient = {
  confirmIndex(token: string, session: string, code: string): Promise<MetdataPatchResult>;
  dropIndex(token: string, session: string, code: string): Promise<MetdataPatchResult>;
  indexData(token: string, session: string): Promise<MetadataPayload>;
  patchStatus(token: string, session: string, version: number): Promise<MetdataPatchResult>;
  reprocessSegment(token: string, session: string, segment: string): Promise<MetdataReprocessResult>;
};

export type MetdataWorkerConfig = {
  apiBaseUrl: string;
  onRetry?(attempt: number): void;
  retryIntervalMs: number;
  retryLimit: number;
};

export type MetadataStatus = "idle" | "loading" | "success" | "error";

export type MetdataStoreState = {
  activeSession: string | null;
  error: MetdataWorkerError | null;
  refresh: MetdataMetadataRefresh | null;
  refreshId: number;
  retryAttempt: number;
  status: MetadataStatus;
  refreshMetadata(session: string, segment: string): void;
  setError(error: MetdataWorkerError): void;
  setLoaded(session: string): void;
  setLoading(session: string): void;
  setRetryAttempt(attempt: number): void;
  resetMetadata(): void;
  resetView(): void;
  invalidateSession(session: string): void;
};

export type MetdataMetadataProps = {
  authToken: string | null;
  apiGatewayUrl: string;
  batch: string;
  callbacks: MetdataMetadataCallbacks;
  choices: unknown;
  children?: ReactNode;
  deferredState: MetdataDeferredState;
  intervalMs: number;
  onLoaderChange?(lines: readonly string[] | null): void;
  onReadyChange(ready: boolean): void;
  refresh: MetdataMetadataRefresh | null;
  retryLimit: number;
  retryIntervalMs: number;
  segments: MetdataSegmentValues;
  session: string;
  workerClient?: MetdataWorkerClient;
};

export type MetadataPanelActions = {
  confirm: boolean;
  drop: boolean;
  refine: boolean;
  reprocess: boolean;
};

export type MetadataPanelSections = {
  filterByChoices: boolean;
  hiddenSegments: ReadonlySet<string>;
  showEmpty: boolean;
};
