import type { MetadataIndex } from "@tabulariumai/aurora-lens";
import type { MetadataActionPayload } from "aurora-core";
import { expectTypeOf, it } from "vitest";

it("keeps the shared page callback compatible with the viewer index contract", () => {
  expectTypeOf<NonNullable<MetadataActionPayload["metadataIndex"]>>().toEqualTypeOf<MetadataIndex>();
});
