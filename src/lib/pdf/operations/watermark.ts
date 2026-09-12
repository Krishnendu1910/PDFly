import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';

export type WatermarkPosition = 'center' | 'top' | 'bottom';
export type WatermarkRotation = 'horizontal' | 'diagonal';

export interface AddWatermarkOptions {
  text: string;
  position?: WatermarkPosition;
  opacity?: number; // 0.05 to 1.0
  fontSize?: number;
  rotation?: WatermarkRotation;
  color?: { r: number; g: number; b: number };
  onProgress?: (progressPercent: number) => void;
}

export interface AddWatermarkResult {
  pdfBytes: Uint8Array;
  totalPages: number;
}

/**
 * Applies a semi-transparent text watermark across all pages of a PDF document.
 */
export async function addWatermarkToPdf(
  input: File | Uint8Array,
  options: AddWatermarkOptions,
): Promise<AddWatermarkResult> {
  const {
    text,
    position = 'center',
    opacity = 0.25,
    fontSize = 48,
    rotation = 'diagonal',
    color = { r: 0.5, g: 0.5, b: 0.5 },
    onProgress,
  } = options;

  if (!text || !text.trim()) {
    throw new PdfOperationError('PROCESSING_FAILED', 'Watermark text cannot be empty.');
  }

  const cleanText = text.trim();
  const { PDFDocument, StandardFonts, rgb, degrees } = await getPdfLib();

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

  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const textColor = rgb(color.r, color.g, color.b);
  const textWidth = font.widthOfTextAtSize(cleanText, fontSize);
  const textHeight = font.heightAtSize(fontSize);
  const safeOpacity = Math.max(0.05, Math.min(opacity, 1.0));

  const pages = doc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    let x = 0;
    let y = 0;
    const angle = rotation === 'diagonal' ? 45 : 0;

    if (rotation === 'diagonal') {
      // Rotate around the text center, positioned in center of page
      // In PDF-lib, rotation rotates around (x, y)
      // When rotating by 45 degrees, shift (x,y) by half rotated bounds
      const cos = Math.cos((45 * Math.PI) / 180);
      const sin = Math.sin((45 * Math.PI) / 180);
      const cx = width / 2;
      const cy = height / 2;

      // Center offset
      x = cx - (textWidth / 2) * cos + (textHeight / 2) * sin;
      y = cy - (textWidth / 2) * sin - (textHeight / 2) * cos;
    } else {
      // Horizontal
      x = (width - textWidth) / 2;
      if (position === 'top') {
        y = height - 100;
      } else if (position === 'bottom') {
        y = 100;
      } else {
        // center
        y = (height - textHeight) / 2;
      }
    }

    page.drawText(cleanText, {
      x,
      y,
      size: fontSize,
      font,
      color: textColor,
      opacity: safeOpacity,
      rotate: degrees(angle),
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
