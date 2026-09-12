import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';

export type PageNumberPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type PageNumberFormat =
  | 'n'
  | 'page-n'
  | 'n-of-total'
  | 'page-n-of-total';

export interface AddPageNumbersOptions {
  position?: PageNumberPosition;
  format?: PageNumberFormat;
  startNumber?: number;
  fontSize?: number;
  margin?: number;
  onProgress?: (progressPercent: number) => void;
}

export interface AddPageNumbersResult {
  pdfBytes: Uint8Array;
  totalPages: number;
}

/**
 * Inserts formatted page numbers across all pages of a PDF document.
 * Ensures page numbers respect margins and stay safely within page bounds.
 */
export async function addPageNumbersToPdf(
  input: File | Uint8Array,
  options: AddPageNumbersOptions = {},
): Promise<AddPageNumbersResult> {
  const {
    position = 'bottom-center',
    format = 'n',
    startNumber = 1,
    fontSize = 10,
    margin = 30,
    onProgress,
  } = options;

  const { PDFDocument, StandardFonts, rgb } = await getPdfLib();

  const bytes = input instanceof File
    ? new Uint8Array(await input.arrayBuffer())
    : input;

  let doc;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
      throw new PdfOperationError('ENCRYPTED_PDF', 'The PDF is encrypted or password-protected.');
    }
    throw new PdfOperationError('CORRUPT_PDF', 'Unable to parse the PDF document.', msg);
  }

  const totalPages = doc.getPageCount();
  if (totalPages === 0) {
    throw new PdfOperationError('INVALID_PDF', 'The source document contains no pages.');
  }

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const color = rgb(0.2, 0.2, 0.2);

  const pages = doc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const currentNumber = startNumber + i;

    let text = '';
    switch (format) {
      case 'page-n':
        text = `Page ${currentNumber}`;
        break;
      case 'n-of-total':
        text = `${currentNumber} / ${totalPages}`;
        break;
      case 'page-n-of-total':
        text = `Page ${currentNumber} of ${totalPages}`;
        break;
      case 'n':
      default:
        text = `${currentNumber}`;
        break;
    }

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);
    const { width, height } = page.getSize();

    let x = 0;
    let y = 0;

    // Horizontal positioning
    if (position.includes('center')) {
      x = (width - textWidth) / 2;
    } else if (position.includes('right')) {
      x = width - margin - textWidth;
    } else {
      // left
      x = margin;
    }

    // Vertical positioning
    if (position.startsWith('top')) {
      y = height - margin - textHeight;
    } else {
      // bottom
      y = margin;
    }

    // Clamp coordinates within visible page boundaries
    x = Math.max(margin / 2, Math.min(x, width - textWidth - margin / 2));
    y = Math.max(margin / 2, Math.min(y, height - textHeight - margin / 2));

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color,
    });

    onProgress?.(Math.round(((i + 1) / pages.length) * 90));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const pdfBytes = await doc.save();
  onProgress?.(100);

  return {
    pdfBytes,
    totalPages,
  };
}

