import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

beforeEach(() => {
  localStorage.removeItem("aurorra-index:iq-tab");
  Object.keys(localStorage).filter(key => key.startsWith("aurorra-index:audit-tab:")).forEach(key => localStorage.removeItem(key));
});

vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});
