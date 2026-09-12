import { sanitizeDownloadFilename } from '@/lib/pdf/utils/download';

export interface SplitFilenameOptions {
  originalFilename?: string;
  index?: number;
  totalOutputs?: number;
  customBaseName?: string;
}

/**
 * Strips any trailing .pdf extension (case-insensitive) from a filename string.
 */
export function stripPdfExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  return filename.trim().replace(/(\.pdf)+$/i, '').trim();
}

/**
 * Ensures a filename ends with a clean single lowercase .pdf extension.
 */
export function ensurePdfExtension(filename: string, fallback: string = 'document.pdf'): string {
  if (!filename || typeof filename !== 'string' || !filename.trim()) {
    const cleanFallback = fallback && fallback.trim() ? fallback.trim() : 'document.pdf';
    return cleanFallback.endsWith('.pdf') ? cleanFallback : `${cleanFallback}.pdf`;
  }
  const stripped = stripPdfExtension(filename);
  if (!stripped) {
    const cleanFallback = fallback && fallback.trim() ? fallback.trim() : 'document.pdf';
    return cleanFallback.endsWith('.pdf') ? cleanFallback : `${cleanFallback}.pdf`;
  }
  return `${stripped}.pdf`;
}

/**
 * Extracts the clean base name of a file, stripping directory paths, traversal, and file extensions.
 */
export function extractBaseName(filename?: string): string {
  if (!filename || typeof filename !== 'string' || !filename.trim()) return '';
  const parts = filename.trim().split(/[/\\]/).filter((p) => p && p !== '.' && p !== '..');
  const clean = parts.pop() || '';
  // First strip .pdf (including multiple duplicate .pdf)
  const withoutPdf = clean.replace(/(\.pdf)+$/i, '');
  if (withoutPdf !== clean) return withoutPdf;
  // If no .pdf was stripped, strip other final extension if present
  return clean.replace(/\.[^/.]+$/, '');
}

/**
 * Returns sensible default filename per tool type.
 */
export function getDefaultDownloadFilename(toolType: string, originalFilename?: string): string {
  const base = extractBaseName(originalFilename);

  switch (toolType.toLowerCase()) {
    case 'merge':
      return base ? `${base}-merged.pdf` : 'merged.pdf';
    case 'split':
      return base ? `${base}-split.pdf` : 'split.pdf';
    case 'reorder':
      return base ? `${base}-reordered.pdf` : 'reordered.pdf';
    case 'rotate':
      return base ? `${base}-rotated.pdf` : 'rotated.pdf';
    case 'remove-pages':
      return base ? `${base}-removed.pdf` : 'removed.pdf';
    case 'extract':
      return base ? `${base}-extracted.pdf` : 'extracted.pdf';
    case 'images-to-pdf':
    case 'images':
      return 'images.pdf';
    case 'pdf-to-images':
      return base ? `${base}-images` : 'images';
    case 'page-numbers':
      return base ? `${base}-numbered.pdf` : 'numbered.pdf';
    case 'watermark':
      return base ? `${base}-watermarked.pdf` : 'watermarked.pdf';
    case 'crop':
      return base ? `${base}-cropped.pdf` : 'cropped.pdf';
    case 'pdf-to-markdown':
      return base ? `${base}.md` : 'document.md';
    case 'sign':
      return base ? `${base}-signed.pdf` : 'signed.pdf';
    case 'compress':
      return base ? `${base}-compressed.pdf` : 'compressed.pdf';
    default:
      return base ? `${base}-processed.pdf` : 'document.pdf';
  }
}

/**
 * Generates deterministic filenames for split outputs.
 * - When customBaseName is supplied: `Quarterly Report-1.pdf`, `Quarterly Report-2.pdf`
 * - When originalFilename is supplied (multi-output): `invoice-1.pdf`, `invoice-2.pdf`
 * - When originalFilename is supplied (single output): `invoice-split.pdf`
 * - When both missing: `split-1.pdf` (or `split.pdf` for single output)
 */
export function getSplitDefaultFilename(options: SplitFilenameOptions): string;
export function getSplitDefaultFilename(
  originalFilename?: string,
  index?: number,
  totalOutputs?: number,
  customBaseName?: string,
): string;
export function getSplitDefaultFilename(
  arg1?: string | SplitFilenameOptions,
  arg2?: number,
  arg3?: number,
  arg4?: string,
): string {
  let originalFilename: string | undefined;
  let index = 1;
  let totalOutputs = 1;
  let customBaseName: string | undefined;

  if (typeof arg1 === 'object' && arg1 !== null) {
    originalFilename = arg1.originalFilename;
    index = arg1.index ?? 1;
    totalOutputs = arg1.totalOutputs ?? 1;
    customBaseName = arg1.customBaseName;
  } else {
    originalFilename = arg1;
    index = arg2 ?? 1;
    totalOutputs = arg3 ?? 1;
    customBaseName = arg4;
  }

  // If user provided a custom base name for the batch
  if (customBaseName && customBaseName.trim()) {
    const cleanBase = stripPdfExtension(customBaseName.trim());
    return `${cleanBase}-${index}.pdf`;
  }

  const base = extractBaseName(originalFilename);

  if (!base) {
    return totalOutputs === 1 ? 'split.pdf' : `split-${index}.pdf`;
  }

  if (totalOutputs === 1) {
    return `${base}-split.pdf`;
  }

  return `${base}-split-${index}.pdf`;
}

/**
 * Sanitizes and normalizes user-entered filename to ensure safe browser downloading.
 */
export function prepareSafeDownloadFilename(userInput: string, fallback = 'document.pdf'): string {
  if (!userInput || !userInput.trim()) return fallback;
  return sanitizeDownloadFilename(userInput, fallback);
}

export { sanitizeDownloadFilename };
