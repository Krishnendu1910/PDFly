import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';

export interface MergePdfOptions {
  onProgress?: (progressPercent: number) => void;
}

/**
 * Merges two or more PDF documents into a single PDF, strictly preserving
 * the order of the inputs and all internal pages.
 */
export async function mergePdfDocuments(
  inputs: (File | Uint8Array)[],
  options: MergePdfOptions = {},
): Promise<Uint8Array> {
  if (!inputs || inputs.length < 2) {
    throw new PdfOperationError(
      'PROCESSING_FAILED',
      'At least two PDF documents are required to perform a merge.',
    );
  }

  const { PDFDocument } = await getPdfLib();
  const mergedPdf = await PDFDocument.create();
  const totalInputs = inputs.length;

  for (let i = 0; i < totalInputs; i++) {
    const input = inputs[i];
    if (!input) continue;

    const bytes = input instanceof File
      ? new Uint8Array(await input.arrayBuffer())
      : input;

    let srcDoc;
    try {
      srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const filename = input instanceof File ? input.name : `File #${i + 1}`;

      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
        throw new PdfOperationError(
          'ENCRYPTED_PDF',
          `"${filename}" is password-protected or encrypted and cannot be merged.`,
        );
      }

      throw new PdfOperationError(
        'CORRUPT_PDF',
        `"${filename}" could not be parsed. It may be corrupt or not a valid PDF.`,
        msg,
      );
    }

    const pageCount = srcDoc.getPageCount();
    if (pageCount > 0) {
      const pageIndices = srcDoc.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    }

    options.onProgress?.(Math.round(((i + 1) / totalInputs) * 100));

    // Periodically yield to the browser event loop to reduce long uninterrupted main-thread blocking
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  if (mergedPdf.getPageCount() === 0) {
    throw new PdfOperationError(
      'PROCESSING_FAILED',
      'The selected documents contained zero usable pages.',
    );
  }

  return mergedPdf.save();
}

