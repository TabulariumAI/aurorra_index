export type UseAddressMapResult = {
  addressMapOpen: boolean;
  addressMapSource: string;
  addressMapZoom: number;
  closeAddressMap: () => void;
  openAddressMap: (address: string, zoom?: number) => void;
};
