import { describe, it, expect } from 'vitest';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  detectPdfCharacteristics,
  compressPdfDocument,
  COMPRESSION_PROFILES,
} from '@/lib/pdf';
import { validateSingleFile, validateBatch } from '@/lib/utils/file';
import { COMPRESS_PDF_CONFIG } from '@/constants/file';

// Minimal valid 1x1 baseline grayscale JPEG (134 bytes)
const MINIMAL_1X1_JPG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x03, 0x02, 0x02, 0x02, 0x02, 0x02, 0x03, 0x02, 0x02, 0x02, 0x03,
  0x03, 0x03, 0x03, 0x04, 0x06, 0x04, 0x04, 0x04, 0x04, 0x04, 0x08, 0x06,
  0x06, 0x05, 0x06, 0x09, 0x08, 0x0a, 0x0a, 0x09, 0x08, 0x09, 0x09, 0x0a,
  0x0c, 0x0f, 0x0c, 0x0a, 0x0b, 0x0e, 0x0b, 0x09, 0x09, 0x0d, 0x11, 0x0d,
  0x0e, 0x0f, 0x10, 0x10, 0x11, 0x10, 0x0a, 0x0c, 0x12, 0x13, 0x12, 0x10,
  0x13, 0x0f, 0x10, 0x10, 0x10, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
  0x00, 0xbf, 0x00, 0xff, 0xd9,
]);

// Valid minimal encrypted PDF structure to test encryption rejection
const ENCRYPTED_PDF_FIXTURE = new TextEncoder().encode(
  '%PDF-1.4\n' +
  '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
  '2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n' +
  '3 0 obj\n<< /Filter /Standard /V 1 /R 2 /P -4 >>\nendobj\n' +
  'trailer\n<< /Root 1 0 R /Encrypt 3 0 R >>\n%%EOF'
);

/**
 * Creates a synthetic PDF containing text and optional embedded images.
 */
async function createSyntheticPdf(options: {
  pageCount: number;
  includeImages?: boolean;
  imagesPerPage?: number;
  useObjectStreams?: boolean;
  landscape?: boolean;
  rotation?: 0 | 90 | 180 | 270;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let embeddedImage;
  if (options.includeImages) {
    embeddedImage = await doc.embedJpg(MINIMAL_1X1_JPG);
  }

  const pageSize: [number, number] = options.landscape ? [700, 500] : [500, 700];

  for (let i = 0; i < options.pageCount; i++) {
    const page = doc.addPage(pageSize);
    if (options.rotation) {
      page.setRotation({ type: 'degrees', angle: options.rotation } as unknown as import('pdf-lib').Rotation);
    }

    page.drawText(`Page content paragraph for page ${i + 1}. Selectable text verification string.`, {
      x: 50,
      y: options.landscape ? 450 : 650,
      size: 14,
      color: rgb(0.1, 0.1, 0.1),
    });

    if (embeddedImage) {
      const imgCount = options.imagesPerPage ?? 1;
      for (let imgIdx = 0; imgIdx < imgCount; imgIdx++) {
        page.drawImage(embeddedImage, {
          x: 50 + imgIdx * 110,
          y: 200,
          width: 100,
          height: 100,
        });
      }
    }
  }

  return doc.save({ useObjectStreams: options.useObjectStreams ?? false });
}

describe('Compression Mode Profiles', () => {
  it('defines distinct parameters for Quality, Balanced, and Strong modes', () => {
    expect(COMPRESSION_PROFILES.quality.maxDimension).toBe(2400);
    expect(COMPRESSION_PROFILES.quality.jpegQuality).toBe(0.85);

    expect(COMPRESSION_PROFILES.balanced.maxDimension).toBe(1600);
    expect(COMPRESSION_PROFILES.balanced.jpegQuality).toBe(0.72);

    expect(COMPRESSION_PROFILES.strong.maxDimension).toBe(1024);
    expect(COMPRESSION_PROFILES.strong.jpegQuality).toBe(0.55);
  });
});

describe('Encryption Handling Audit', () => {
  it('detects encrypted PDF during characteristic detection and throws ENCRYPTED_PDF', async () => {
    await expect(detectPdfCharacteristics(ENCRYPTED_PDF_FIXTURE)).rejects.toMatchObject({
      code: 'ENCRYPTED_PDF',
    });
  });

  it('detects encrypted PDF during compression and throws ENCRYPTED_PDF without modifying file', async () => {
    await expect(compressPdfDocument(ENCRYPTED_PDF_FIXTURE)).rejects.toMatchObject({
      code: 'ENCRYPTED_PDF',
    });
  });
});

describe('PDF Characteristic Detection', () => {
  it('detects text-vector profile on text-only PDFs', async () => {
    const pdfBytes = await createSyntheticPdf({ pageCount: 3, includeImages: false });
    const characteristics = await detectPdfCharacteristics(pdfBytes);

    expect(characteristics.pageCount).toBe(3);
    expect(characteristics.imageCount).toBe(0);
    expect(characteristics.contentType).toBe('text-vector');
    expect(characteristics.fileSizeBytes).toBe(pdfBytes.length);
  });

  it('detects image count on PDFs with embedded images', async () => {
    const pdfBytes = await createSyntheticPdf({ pageCount: 2, includeImages: true });
    const characteristics = await detectPdfCharacteristics(pdfBytes);

    expect(characteristics.pageCount).toBe(2);
    expect(characteristics.imageCount).toBeGreaterThanOrEqual(1);
    expect(characteristics.totalImageBytes).toBeGreaterThan(0);
  });

  it('rejects corrupt binary data during characteristic detection', async () => {
    const corrupted = new Uint8Array([1, 2, 3, 4, 5]);
    await expect(detectPdfCharacteristics(corrupted)).rejects.toThrow(/not a valid PDF document/);
  });
});

describe('PDF Compression Functionality & Integrity (compressPdfDocument)', () => {
  it('compresses a PDF and consolidates object streams', async () => {
    // Create an uncompressed PDF with multiple pages without object streams
    const originalPdf = await createSyntheticPdf({
      pageCount: 5,
      includeImages: false,
      useObjectStreams: false,
    });

    const result = await compressPdfDocument(originalPdf, { mode: 'balanced' });

    expect(result.originalBytes).toBe(originalPdf.length);
    expect(result.mode).toBe('balanced');
    expect(result.characteristics.pageCount).toBe(5);

    // Structural object stream consolidation reduces byte size
    expect(result.compressedBytes).toBeLessThanOrEqual(result.originalBytes);
    expect(result.bytesSaved).toBeGreaterThanOrEqual(0);
    expect(result.percentSaved).toBeGreaterThanOrEqual(0);

    // Verify output integrity: page count and readability
    const outputDoc = await PDFDocument.load(result.outputBytes);
    expect(outputDoc.getPageCount()).toBe(5);
  });

  it('preserves page count, dimensions, and orientation for landscape and portrait pages', async () => {
    const portraitPdf = await createSyntheticPdf({ pageCount: 2, includeImages: true, landscape: false });
    const resPortrait = await compressPdfDocument(portraitPdf, { mode: 'strong' });
    const outPortrait = await PDFDocument.load(resPortrait.outputBytes);
    expect(outPortrait.getPages()[0]!.getWidth()).toBe(500);
    expect(outPortrait.getPages()[0]!.getHeight()).toBe(700);

    const landscapePdf = await createSyntheticPdf({ pageCount: 2, includeImages: true, landscape: true });
    const resLandscape = await compressPdfDocument(landscapePdf, { mode: 'balanced' });
    const outLandscape = await PDFDocument.load(resLandscape.outputBytes);
    expect(outLandscape.getPages()[0]!.getWidth()).toBe(700);
    expect(outLandscape.getPages()[0]!.getHeight()).toBe(500);
  });

  it('preserves multiple images per page without dropping or corrupting any stream', async () => {
    const multiImagePdf = await createSyntheticPdf({
      pageCount: 2,
      includeImages: true,
      imagesPerPage: 3,
    });

    const result = await compressPdfDocument(multiImagePdf, { mode: 'balanced' });
    const outputDoc = await PDFDocument.load(result.outputBytes);
    expect(outputDoc.getPageCount()).toBe(2);

    const pages = outputDoc.getPages();
    expect(pages[0]!.getWidth()).toBe(500);
    expect(pages[0]!.getHeight()).toBe(700);
    const chars = await detectPdfCharacteristics(result.outputBytes);
    expect(chars.imageCount).toBeGreaterThanOrEqual(1);
  });

  it('preserves page rotation metadata across compression', async () => {
    const rotatedPdf = await createSyntheticPdf({
      pageCount: 1,
      includeImages: true,
      rotation: 90,
    });

    const result = await compressPdfDocument(rotatedPdf, { mode: 'balanced' });
    const outputDoc = await PDFDocument.load(result.outputBytes);
    expect(outputDoc.getPages()[0]!.getRotation().angle).toBe(90);
  });

  it('handles already-optimized PDFs without falsely claiming reduction', async () => {
    // Generate an already-compact PDF saved with useObjectStreams: true
    const alreadyOptimized = await createSyntheticPdf({
      pageCount: 1,
      includeImages: false,
      useObjectStreams: true,
    });

    const result = await compressPdfDocument(alreadyOptimized, { mode: 'quality' });

    // When output is not smaller, result must never claim reduction
    if (!result.isReduced) {
      expect(result.bytesSaved).toBe(0);
      expect(result.percentSaved).toBe(0);
      expect(result.compressedBytes).toBe(result.originalBytes);
      // Ensures outputBytes falls back to originalBytes
      expect(result.outputBytes.length).toBe(alreadyOptimized.length);
    }
  });

  it('verifies distinct execution across Quality, Balanced, and Strong modes', async () => {
    const pdf = await createSyntheticPdf({ pageCount: 3, includeImages: true, useObjectStreams: false });

    const qRes = await compressPdfDocument(pdf, { mode: 'quality' });
    const bRes = await compressPdfDocument(pdf, { mode: 'balanced' });
    const sRes = await compressPdfDocument(pdf, { mode: 'strong' });

    expect(qRes.mode).toBe('quality');
    expect(bRes.mode).toBe('balanced');
    expect(sRes.mode).toBe('strong');

    // All must produce valid openable documents with 3 pages
    const qDoc = await PDFDocument.load(qRes.outputBytes);
    const bDoc = await PDFDocument.load(bRes.outputBytes);
    const sDoc = await PDFDocument.load(sRes.outputBytes);

    expect(qDoc.getPageCount()).toBe(3);
    expect(bDoc.getPageCount()).toBe(3);
    expect(sDoc.getPageCount()).toBe(3);
  });

  it('rejects corrupted PDF data during compression', async () => {
    const corrupt = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0x00]);
    await expect(compressPdfDocument(corrupt)).rejects.toThrow();
  });
});

describe('File Pipeline Constraints for Compression (COMPRESS_PDF_CONFIG)', () => {
  it('accepts a valid PDF file within the 50 MB limit', () => {
    const content = new Uint8Array(1024);
    const file = new File([content as unknown as BlobPart], 'contract.pdf', {
      type: 'application/pdf',
      lastModified: 1700000000000,
    });

    const res = validateSingleFile(file, COMPRESS_PDF_CONFIG);
    expect(res.valid).toBe(true);
  });

  it('rejects non-PDF files', () => {
    const content = new Uint8Array(1024);
    const file = new File([content as unknown as BlobPart], 'photo.jpg', {
      type: 'image/jpeg',
      lastModified: 1700000000000,
    });

    const res = validateSingleFile(file, COMPRESS_PDF_CONFIG);
    expect(res.valid).toBe(false);
    expect(res.errors[0]?.code).toBe('INVALID_TYPE');
  });

  it('enforces maximum limit of 1 file', () => {
    const file1 = new File([new Uint8Array(100) as unknown as BlobPart], 'doc1.pdf', { type: 'application/pdf' });
    const file2 = new File([new Uint8Array(100) as unknown as BlobPart], 'doc2.pdf', { type: 'application/pdf' });

    const res = validateBatch([file1, file2], COMPRESS_PDF_CONFIG);
    expect(res.validFiles.length).toBe(1);
    expect(res.rejectedFiles.length).toBe(1);
    expect(res.rejectedFiles[0]?.errors[0]?.code).toBe('TOO_MANY_FILES');
  });
});

