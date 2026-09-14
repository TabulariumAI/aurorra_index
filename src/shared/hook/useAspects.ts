import type { MetadataError, ResourceRequest } from "aurora-core";
import { useEffect, useState } from "react";
import { aspectGroups } from "../data/aspectGroups";

export function useAspects(request: object, onResource: (request: ResourceRequest) => Promise<unknown>, onReadyChange: (ready: boolean) => void, onError: (error: MetadataError) => void) {
  const [aspects, setAspects] = useState<Record<string, string[]>>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    setReady(false);
    setAspects({});
    onReadyChange(false);
    void onResource({ resource: "aspects" }).then((resource) => {
      if (!active) return;
      setAspects(aspectGroups(resource));
      setReady(true);
      onReadyChange(true);
    }).catch((resourceError) => {
      if (!active) return;
      const failure = resourceError as Error & { code?: string; details?: unknown; status?: number };
      onError({ code: failure.code, details: failure.details, error: failure.message, status: failure.status });
      onReadyChange(true);
    });
    return () => { active = false; };
  }, [onError, onReadyChange, onResource, request]);
  return { aspects, ready };
}
