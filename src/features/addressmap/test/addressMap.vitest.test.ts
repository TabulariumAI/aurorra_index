import { describe, expect, it } from "vitest";
import {
  appendAddressMapZoom,
  buildAddressMapEmbedUrl,
  DEFAULT_ADDRESS_MAP_ZOOM,
} from "../data/addressMap";

describe("address map data helpers", () => {
  const address = "123 Main St, Austin, TX 78701";
  const encoded = buildAddressMapEmbedUrl(address);

  it("builds the Google Maps embed URL with maptype and output parameters", () => {
    expect(encoded).toBe(
      "https://www.google.com/maps?q=123%20Main%20St%2C%20Austin%2C%20TX%2078701&output=embed&maptype=roadmap",
    );
  });

  it("appends custom zoom to embed URL", () => {
    expect(appendAddressMapZoom(encoded, 17)).toBe(
      "https://www.google.com/maps?q=123%20Main%20St%2C%20Austin%2C%20TX%2078701&output=embed&maptype=roadmap&z=17",
    );
  });

  it("appends default zoom to embed URL", () => {
    expect(appendAddressMapZoom(encoded, DEFAULT_ADDRESS_MAP_ZOOM)).toBe(
      "https://www.google.com/maps?q=123%20Main%20St%2C%20Austin%2C%20TX%2078701&output=embed&maptype=roadmap&z=14",
    );
  });
});
