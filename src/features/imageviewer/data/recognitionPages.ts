import type { ViewerError } from "../type/imageViewer.types";

const recognitionRanges: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [2, 1], [5, 3], [8, 5], [12, 8],
];

export function isRecognitionPageError(error: ViewerError | null): boolean {
  return error?.code === "image_page_unavailable" || error?.code === "invalid_image_page" || error?.code === "invalid_recognition_choice";
}

export function resolveImagePage(page: number, totalPages: number, choices: unknown): number {
  let parsed = choices;
  if (typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } catch { parsed = null; }
  }
  const choice = Array.isArray(parsed)
    ? parsed.find(item => item?.service === "Recognition")
    : null;
  const level = Number(choice?.level);
  if (!Number.isInteger(level) || level < 1 || level > 6) {
    throw { code: "invalid_recognition_choice", error: "Recognition choice is unavailable for this document." } satisfies ViewerError;
  }
  if (!Number.isInteger(totalPages) || totalPages < 1 || !Number.isInteger(page) || page < 1 || page > totalPages) {
    throw { code: "invalid_image_page", error: "The requested document page is invalid." } satisfies ViewerError;
  }
  const [first, last] = recognitionRanges[level - 1] ?? [totalPages, 0];
  if (totalPages <= first + last || page <= first) return page;
  if (page > totalPages - last) return first + page - (totalPages - last);
  throw {
    code: "image_page_unavailable",
    error: `Page ${page} is not included in the selected recognition level.`,
  } satisfies ViewerError;
}
