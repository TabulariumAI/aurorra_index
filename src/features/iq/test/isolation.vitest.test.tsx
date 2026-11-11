import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { prepareIqReport } from "../data/iqData";
import { IqView } from "../component/IqView";

afterEach(cleanup);
it("contains prepared segment errors without removing the summary or gates", () => {
  const view = prepareIqReport({ iq_doc: 90 });
  render(<IqView view={{ ...view, segments: { data: null, error: "Segments failed" } }} ackingCodes={new Set()} onAck={vi.fn()} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Segments failed");
  expect(screen.getByText("90%")).toBeVisible();
  expect(screen.getByText("Compliance Gates (0)")).toBeVisible();
});
