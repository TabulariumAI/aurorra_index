export const DEFAULT_ADDRESS_MAP_ZOOM = 14;

export function buildAddressMapEmbedUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed&maptype=roadmap`;
}

export function appendAddressMapZoom(url: string, zoom: number): string {
  return `${url}&z=${zoom}`;
}
