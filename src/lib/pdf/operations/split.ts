import { getPdfLib } from '../engine/loader';
import { parsePageRange, type ParseRangeOptions } from '../utils/range-parser';
import { PdfOperationError } from '../types';

export interface SplitPdfOptions extends ParseRangeOptions {
  onProgress?: (progressPercent: number) => void;
}

export interface SplitPdfResult {
  pdfBytes: Uint8Array;
  extractedPageNumbers: number[]; // 1-based page numbers extracted
  totalOutputPages: number;
}

/**
 * Extracts specified pages or page ranges from a PDF document into a new PDF.
 *
 * Example ranges: "1", "1-3", "2,4,7", "1-3,6,9-10"
 */
export async function splitPdfDocument(
  input: File | Uint8Array,
  rangeStr: string,
  options: SplitPdfOptions = {},
): Promise<SplitPdfResult> {
  const { PDFDocument } = await getPdfLib();

  const bytes = input instanceof File
    ? new Uint8Array(await input.arrayBuffer())
    : input;

  let srcDoc;
  try {
    srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
      throw new PdfOperationError('ENCRYPTED_PDF', 'The PDF is encrypted or password-protected.');
    }
    throw new PdfOperationError('CORRUPT_PDF', 'Unable to parse the PDF document.', msg);
  }

  const totalPages = srcDoc.getPageCount();
  if (totalPages === 0) {
    throw new PdfOperationError('INVALID_PDF', 'The source document contains no pages.');
  }

  // Parse and validate range expression against totalPages
  const { pages } = parsePageRange(rangeStr, totalPages, options);

  // Convert 1-based page numbers to 0-based page indices
  const zeroBasedIndices = pages.map((p) => p - 1);
  const totalToExtract = zeroBasedIndices.length;

  const outputDoc = await PDFDocument.create();
  const copiedPages = await outputDoc.copyPages(srcDoc, zeroBasedIndices);

  for (let i = 0; i < copiedPages.length; i++) {
    outputDoc.addPage(copiedPages[i]);
    options.onProgress?.(Math.round(((i + 1) / totalToExtract) * 90));
    // Periodically yield to event loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const pdfBytes = await outputDoc.save();
  options.onProgress?.(100);

  return {
    pdfBytes,
    extractedPageNumbers: pages,
    totalOutputPages: outputDoc.getPageCount(),
  };
}

