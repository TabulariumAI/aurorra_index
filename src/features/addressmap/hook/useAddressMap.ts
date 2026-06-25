import { useCallback, useState } from "react";
import { buildAddressMapEmbedUrl, DEFAULT_ADDRESS_MAP_ZOOM } from "../data/addressMap";
import type { UseAddressMapResult } from "../type/addressMap.types";

export function useAddressMap(): UseAddressMapResult {
  const [addressMapOpen, setAddressMapOpen] = useState(false);
  const [addressMapSource, setAddressMapSource] = useState("");
  const [addressMapZoom, setAddressMapZoom] = useState(DEFAULT_ADDRESS_MAP_ZOOM);

  const openAddressMap = useCallback((address: string, zoom = DEFAULT_ADDRESS_MAP_ZOOM) => {
    setAddressMapSource(buildAddressMapEmbedUrl(address));
    setAddressMapZoom(zoom);
    setAddressMapOpen(true);
  }, []);

  const closeAddressMap = useCallback(() => {
    setAddressMapOpen(false);
    setAddressMapSource("");
    setAddressMapZoom(DEFAULT_ADDRESS_MAP_ZOOM);
  }, []);

  return {
    addressMapOpen,
    addressMapSource,
    addressMapZoom,
    closeAddressMap,
    openAddressMap,
  };
}
