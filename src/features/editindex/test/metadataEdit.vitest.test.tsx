import * as Tooltip from "@radix-ui/react-tooltip";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { MetadataRow } from "aurora-core";

it.each(["party", "property", "reference", "endorsement", "monetary", "acknowledgment", "transaction", "vital", "court", "secrets"])("opens the raw %s index without requiring an image page or code", (segment) => {
  const onEdit = vi.fn();
  const index = { aspect: "first,second", label: "raw_label", value: " Original  value ", source: " Source " };
  render(<Tooltip.Provider><MetadataRow callbacks={{}} confirmed={false} item={index} selected={false} segment={segment} session="session" onEdit={onEdit} /></Tooltip.Provider>);
  expect(screen.getByRole("button", { name: "Edit index" })).toHaveStyle({ width: "2rem", minWidth: "2rem", minHeight: "2rem" });
  fireEvent.click(screen.getByRole("button", { name: "Edit index" }));
  expect(onEdit).toHaveBeenCalledExactlyOnceWith(index, segment);
});

it("disables index editing while its queue change is pending", () => {
  const onEdit = vi.fn();
  render(<Tooltip.Provider><MetadataRow callbacks={{}} confirmed={false} item={{ value: "Original" }} selected={false} segment="party" session="session" onEdit={onEdit} pending="update" /></Tooltip.Provider>);
  const edit = screen.getByRole("button", { name: "Edit index" });
  expect(edit).toBeDisabled();
  fireEvent.click(edit);
  expect(onEdit).not.toHaveBeenCalled();
});

it("leaves page editing with the existing page owner", () => {
  const onEdit = vi.fn();
  const onEditPage = vi.fn();
  render(<Tooltip.Provider><MetadataRow callbacks={{ onEditPage }} confirmed={false} item={{ code: "page", page: "2", value: "Page" }} selected={false} segment="page" session="session" type="page" onEdit={onEdit} /></Tooltip.Provider>);
  fireEvent.click(screen.getByRole("button", { name: "Edit index" }));
  expect(onEditPage).toHaveBeenCalledOnce();
  expect(onEdit).not.toHaveBeenCalled();
});

it("keeps read-only rows without an edit action", () => {
  render(<Tooltip.Provider><MetadataRow callbacks={{}} confirmed={false} item={{ value: "Original" }} selected={false} segment="party" session="session" /></Tooltip.Provider>);
  expect(screen.queryByRole("button", { name: "Edit index" })).toBeNull();
});

it("keeps copy, delete confirmation, and edit icons compact without changing confirmation behavior", () => {
  const onDrop = vi.fn();
  render(<Tooltip.Provider><MetadataRow callbacks={{}} confirmed={false} item={{ code: "index", value: "Original" }} selected={false} segment="party" session="session" onEdit={vi.fn()} onDrop={onDrop} /></Tooltip.Provider>);
  for (const label of ["Copy value Original", "Delete index", "Edit index"]) {
    expect(screen.getByRole("button", { name: label })).toHaveStyle({ width: "2rem", minHeight: "2rem" });
  }
  fireEvent.click(screen.getByRole("button", { name: "Delete index" }));
  expect(onDrop).not.toHaveBeenCalled();
  const confirm = screen.getByRole("button", { name: "Confirm" });
  expect(confirm).toHaveStyle({ width: "2rem" });
  fireEvent.click(confirm);
  expect(onDrop).toHaveBeenCalledOnce();
});
