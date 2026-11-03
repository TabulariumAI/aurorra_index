import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { IqSegments } from "../component/IqSegments";
import type { IqSegmentView } from "../type/iq.types";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("contains one segment's explanation failure without losing other segment rows or explanations", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const segment = { id: "party", displayId: "Party", expectedWeight: 2, expectedDisplay: "2", actualDisplay: "1", iqDisplay: "50", explanations: null } as unknown as IqSegmentView;
  render(<IqSegments view={{ segments: [segment, { ...segment, id: "reference", displayId: "Reference", explanations: ["Healthy notes"] }] }} />);
  expect(screen.getByRole("button", { name: "Party error" })).toBeVisible();
  expect(screen.getByRole("cell", { name: "Reference" })).toBeVisible();
  expect(screen.getByText("Healthy notes")).toBeVisible();
});
