import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';
import type { PdfCharacteristics, PdfContentType } from './types';

/**
 * Rapidly inspects the PDF object graph to detect document characteristics
 * (page count, embedded image count, total image bytes, and content profile).
 * Does not render or rasterize pages, ensuring minimal latency and memory overhead.
 */
export async function detectPdfCharacteristics(
  pdfBytes: Uint8Array,
): Promise<PdfCharacteristics> {
  const { PDFDocument, PDFName } = await getPdfLib();

  let doc;
  try {
    doc = await PDFDocument.load(pdfBytes);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('encrypt') || msg.toLowerCase().includes('password')) {
      throw new PdfOperationError(
        'ENCRYPTED_PDF',
        'Cannot inspect encrypted or password-protected PDF files.',
      );
    }
    throw new PdfOperationError(
      'INVALID_PDF',
      'The provided file is not a valid PDF document.',
      msg,
    );
  }

  const pageCount = doc.getPageCount();
  const fileSizeBytes = pdfBytes.length;

  let imageCount = 0;
  let totalImageBytes = 0;

  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (obj && typeof obj === 'object' && 'dict' in obj) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dict = (obj as any).dict;
      if (dict && typeof dict.get === 'function') {
        const subtype = dict.get(PDFName.of('Subtype'));
        if (subtype && subtype.toString() === '/Image') {
          imageCount++;
          if ('getContents' in obj && typeof (obj as { getContents?: () => Uint8Array }).getContents === 'function') {
            const stream = (obj as { getContents: () => Uint8Array }).getContents();
            if (stream && stream.length) {
              totalImageBytes += stream.length;
            }
          }
        }
      }
    }
  }

  let contentType: PdfContentType = 'text-vector';
  if (imageCount > 0 && totalImageBytes > fileSizeBytes * 0.4) {
    contentType = 'image-heavy';
  } else if (imageCount > 0) {
    contentType = 'mixed';
  }

  return {
    pageCount,
    imageCount,
    totalImageBytes,
    fileSizeBytes,
    contentType,
  };
}
