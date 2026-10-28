export type SessionChoices = {
  items: { service: string; level: number }[];
  jurisdiction: string | null;
};

export type ChoicesBackendData = {
  items: SessionChoices["items"];
  jurisdiction?: string | null;
} | null;

export type ChoicesWorkerConfig = {
  apiBaseUrl: string;
};

export type ChoicesWorkerCommand = {
  type: "load";
  token: string;
  session: string;
  config: ChoicesWorkerConfig;
};

export type ChoicesWorkerSuccess<T> = {
  ok: true;
  data: T;
};

export type ChoicesWorkerFailure = {
  ok: false;
  error: string;
  code?: string;
  status?: number;
  details?: unknown;
};

export type ChoicesWorkerResult<T> = ChoicesWorkerSuccess<T> | ChoicesWorkerFailure;

export type ChoicesWorkerClient = {
  load(token: string, session: string): Promise<ChoicesBackendData>;
};

