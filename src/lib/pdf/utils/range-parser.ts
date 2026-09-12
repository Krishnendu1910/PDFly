import { PdfOperationError, type SplitRangeResult } from '../types';

export interface ParseRangeOptions {
  allowDuplicates?: boolean;
}

/**
 * Parses and validates page range strings like "1", "1-3", "2,4,7", "1-3,6,9-10".
 *
 * Enforces strict validation:
 * - Rejects malformed ranges (e.g. '1--', '3-1', 'abc', ',1')
 * - Rejects page numbers outside [1, totalPages]
 * - Optionally checks and deduplicates pages
 */
export function parsePageRange(
  rangeStr: string,
  totalPages: number,
  options: ParseRangeOptions = {},
): SplitRangeResult {
  const trimmed = rangeStr.trim();
  if (!trimmed) {
    throw new PdfOperationError(
      'INVALID_PAGE_RANGE',
      'Please enter at least one page number or range (e.g. 1-3, 5).',
    );
  }

  if (totalPages < 1) {
    throw new PdfOperationError('INVALID_PDF', 'Document has 0 pages.');
  }

  const parts = trimmed.split(',');
  const collectedPages: number[] = [];
  const segments: { start: number; end: number }[] = [];

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) {
      throw new PdfOperationError(
        'INVALID_PAGE_RANGE',
        'Invalid syntax: empty segment found between commas.',
      );
    }

    if (part.includes('-')) {
      const rangeParts = part.split('-');
      if (rangeParts.length !== 2) {
        throw new PdfOperationError(
          'INVALID_PAGE_RANGE',
          `Invalid range format: "${part}". Expected format "start-end" (e.g. 1-5).`,
        );
      }

      const [startStr, endStr] = rangeParts;
      const start = Number(startStr?.trim());
      const end = Number(endStr?.trim());

      if (!Number.isInteger(start) || !Number.isInteger(end)) {
        throw new PdfOperationError(
          'INVALID_PAGE_RANGE',
          `Invalid range "${part}": page numbers must be whole integers.`,
        );
      }

      if (start < 1) {
        throw new PdfOperationError(
          'OUT_OF_BOUNDS_PAGE',
          `Page ${start} in range "${part}" is invalid. Page numbers start at 1.`,
        );
      }

      if (end > totalPages) {
        throw new PdfOperationError(
          'OUT_OF_BOUNDS_PAGE',
          `End page ${end} in range "${part}" exceeds document total (${totalPages} pages).`,
        );
      }

      if (start > end) {
        throw new PdfOperationError(
          'INVALID_PAGE_RANGE',
          `Invalid range "${part}": start page (${start}) cannot be greater than end page (${end}).`,
        );
      }

      segments.push({ start, end });
      for (let p = start; p <= end; p++) {
        collectedPages.push(p);
      }
    } else {
      const pageNum = Number(part);
      if (!Number.isInteger(pageNum)) {
        throw new PdfOperationError(
          'INVALID_PAGE_RANGE',
          `"${part}" is not a valid page number.`,
        );
      }

      if (pageNum < 1) {
        throw new PdfOperationError(
          'OUT_OF_BOUNDS_PAGE',
          `Page number ${pageNum} is invalid. Page numbers start at 1.`,
        );
      }

      if (pageNum > totalPages) {
        throw new PdfOperationError(
          'OUT_OF_BOUNDS_PAGE',
          `Page ${pageNum} exceeds document total (${totalPages} pages).`,
        );
      }

      segments.push({ start: pageNum, end: pageNum });
      collectedPages.push(pageNum);
    }
  }

  if (collectedPages.length === 0) {
    throw new PdfOperationError(
      'INVALID_PAGE_RANGE',
      'No valid pages were specified in the selection.',
    );
  }

  // Deduplicate if requested (default deduplicate is true for Split)
  const finalPages = options.allowDuplicates
    ? collectedPages
    : Array.from(new Set(collectedPages));

  return {
    pages: finalPages,
    segments,
  };
}

