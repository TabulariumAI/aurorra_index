import type { MetadataError, ResourceRequest } from "aurora-core";
import { useEffect, useState } from "react";
import { aspectGroups } from "../data/aspectGroups";

export function useAspects(request: object, session: string, onResource: (request: ResourceRequest) => void, onReadyChange: (ready: boolean) => void, onError: (error: MetadataError) => void) {
  const [aspects, setAspects] = useState<Record<string, string[]>>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    setReady(false);
    setAspects({});
    onReadyChange(false);
    onResource({ resource: "aspects", session, callback(result) {
      if (!active) return;
      if (!result.ok) {
        onError(result);
        onReadyChange(true);
        return;
      }
      try {
        setAspects(aspectGroups(result.data));
        setReady(true);
        onReadyChange(true);
      } catch (error) {
        onError({ error: (error as Error).message });
        onReadyChange(true);
      }
    } });
    return () => { active = false; };
  }, [onError, onReadyChange, onResource, request, session]);
  return { aspects, ready };
}
