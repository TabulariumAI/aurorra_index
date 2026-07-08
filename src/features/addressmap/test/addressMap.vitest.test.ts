import path from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  appendAddressMapZoom,
  buildAddressMapEmbedUrl,
  DEFAULT_ADDRESS_MAP_ZOOM,
} from "../data/addressMap";

describe("addressmap package boundaries", () => {
  it("keeps modal shell symbols out of the package", () => {
    const packageDir = path.dirname(fileURLToPath(import.meta.url));
    const entries = readdirSync(path.join(packageDir, ".."), { recursive: true }) as string[];
    const shellTokens = [`Dia${"log"}`, `AddressMap${"Dia"}log`];
    for (const entry of entries) {
      if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) {
        continue;
      }
      if (!entry.endsWith(".ts") && !entry.endsWith(".tsx")) continue;
      const source = readFileSync(path.join(packageDir, "..", entry), "utf8");
      for (const token of shellTokens) {
        expect(source).not.toContain(token);
      }
    }
  });
});

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
