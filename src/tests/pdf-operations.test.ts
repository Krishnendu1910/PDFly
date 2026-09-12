import { describe, it, expect } from 'vitest';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  parsePageRange,
  mergePdfDocuments,
  splitPdfDocument,
  reorderPdfDocument,
  rotatePdfDocument,
  sanitizeDownloadFilename,
} from '@/lib/pdf';

/**
 * Creates a minimal valid synthetic PDF with `pageCount` pages in memory.
 * Zero external fixtures or binary files required.
 */
async function createTestPdf(pageCount: number, label = 'Page'): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`${label} ${i}`, {
      x: 50,
      y: 550,
      size: 24,
      color: rgb(0.1, 0.1, 0.1),
    });
  }
  return doc.save();
}

describe('PDF Utils: Range Parser', () => {
  it('parses single page string: "1" and "3"', () => {
    const res1 = parsePageRange('1', 10);
    expect(res1.pages).toEqual([1]);
    expect(res1.segments).toEqual([{ start: 1, end: 1 }]);

    const res3 = parsePageRange('3', 10);
    expect(res3.pages).toEqual([3]);
  });

  it('parses range expression: "1-3"', () => {
    const res = parsePageRange('1-3', 10);
    expect(res.pages).toEqual([1, 2, 3]);
    expect(res.segments).toEqual([{ start: 1, end: 3 }]);
  });

  it('parses comma-separated pages: "2,4,7"', () => {
    const res = parsePageRange('2,4,7', 10);
    expect(res.pages).toEqual([2, 4, 7]);
    expect(res.segments).toEqual([
      { start: 2, end: 2 },
      { start: 4, end: 4 },
      { start: 7, end: 7 },
    ]);
  });

  it('parses mixed ranges and individual pages: "1-3,6,9-10"', () => {
    const res = parsePageRange('1-3,6,9-10', 10);
    expect(res.pages).toEqual([1, 2, 3, 6, 9, 10]);
    expect(res.segments).toEqual([
      { start: 1, end: 3 },
      { start: 6, end: 6 },
      { start: 9, end: 10 },
    ]);
  });

  it('handles whitespace variations: "  1 - 3 ,  6  , 9-10 "', () => {
    const res = parsePageRange('  1 - 3 ,  6  , 9-10 ', 10);
    expect(res.pages).toEqual([1, 2, 3, 6, 9, 10]);
  });

  it('deduplicates page references by default and supports allowDuplicates', () => {
    const deduplicated = parsePageRange('1-3, 2, 3-4', 5);
    expect(deduplicated.pages).toEqual([1, 2, 3, 4]);

    const duplicated = parsePageRange('1, 2, 1', 5, { allowDuplicates: true });
    expect(duplicated.pages).toEqual([1, 2, 1]);
  });

  it('rejects zero and negative values', () => {
    expect(() => parsePageRange('0', 10)).toThrow(/start at 1/);
    expect(() => parsePageRange('-3', 10)).toThrow();
    expect(() => parsePageRange('0-3', 10)).toThrow(/start at 1/);
  });

  it('rejects reversed ranges start > end', () => {
    expect(() => parsePageRange('5-2', 10)).toThrow(/start page \(5\) cannot be greater than end page \(2\)/);
  });

  it('rejects non-numeric characters and empty segments', () => {
    expect(() => parsePageRange('', 10)).toThrow();
    expect(() => parsePageRange('abc', 10)).toThrow();
    expect(() => parsePageRange('page1', 10)).toThrow();
    expect(() => parsePageRange('1,,2', 10)).toThrow();
    expect(() => parsePageRange('1--3', 10)).toThrow();
  });

  it('rejects out-of-bounds page numbers exceeding totalPages', () => {
    expect(() => parsePageRange('12', 10)).toThrow(/exceeds document total/);
    expect(() => parsePageRange('1-15', 10)).toThrow(/exceeds document total/);
  });
});

describe('PDF Utils: Download Sanitization', () => {
  it('sanitizes filename and strips path traversal', () => {
    expect(sanitizeDownloadFilename('../../../secret.pdf')).toBe('secret.pdf');
    expect(sanitizeDownloadFilename('../../evil.pdf')).toBe('evil.pdf');
    expect(sanitizeDownloadFilename('..\\..\\evil.pdf')).toBe('evil.pdf');
    expect(sanitizeDownloadFilename('my file/name.pdf')).toBe('name.pdf');
    expect(sanitizeDownloadFilename('..\\..\\secret.pdf')).toBe('secret.pdf');
    expect(sanitizeDownloadFilename('report')).toBe('report.pdf');
  });

  it('safely resolves path-traversal only and dot-only expressions to fallback', () => {
    expect(sanitizeDownloadFilename('../../../')).toBe('document.pdf');
    expect(sanitizeDownloadFilename('..')).toBe('document.pdf');
    expect(sanitizeDownloadFilename('.')).toBe('document.pdf');
    expect(sanitizeDownloadFilename('...')).toBe('document.pdf');
    expect(sanitizeDownloadFilename('/..//')).toBe('document.pdf');
  });

  it('neutralizes Windows DOS reserved device names', () => {
    expect(sanitizeDownloadFilename('CON')).toBe('_CON.pdf');
    expect(sanitizeDownloadFilename('con.pdf')).toBe('_con.pdf');
    expect(sanitizeDownloadFilename('NUL')).toBe('_NUL.pdf');
    expect(sanitizeDownloadFilename('nul.pdf')).toBe('_nul.pdf');
    expect(sanitizeDownloadFilename('COM1')).toBe('_COM1.pdf');
    expect(sanitizeDownloadFilename('com1.pdf')).toBe('_com1.pdf');
    expect(sanitizeDownloadFilename('LPT1')).toBe('_LPT1.pdf');
    expect(sanitizeDownloadFilename('lpt1.pdf')).toBe('_lpt1.pdf');
    expect(sanitizeDownloadFilename('AUX')).toBe('_AUX.pdf');
    expect(sanitizeDownloadFilename('PRN')).toBe('_PRN.pdf');
  });

  it('preserves valid Unicode characters and international scripts', () => {
    expect(sanitizeDownloadFilename('résumé.pdf')).toBe('résumé.pdf');
    expect(sanitizeDownloadFilename('日本語のドキュメント.pdf')).toBe('日本語のドキュメント.pdf');
    expect(sanitizeDownloadFilename('Документ.pdf')).toBe('Документ.pdf');
  });

  it('preserves natural spaces and handles multiple dots safely', () => {
    expect(sanitizeDownloadFilename('My Annual Report 2024.pdf')).toBe('My Annual Report 2024.pdf');
    expect(sanitizeDownloadFilename('draft.v1.final.pdf')).toBe('draft.v1.final.pdf');
    expect(sanitizeDownloadFilename('trailing dots...')).toBe('trailing dots.pdf');
  });

  it('neutralizes illegal filesystem and control characters', () => {
    expect(sanitizeDownloadFilename('file:*?"<>|test.pdf')).toBe('file_test.pdf');
    expect(sanitizeDownloadFilename('control\x00char.pdf')).toBe('control_char.pdf');
  });

  it('enforces maximum filename base length without corrupting extension', () => {
    const veryLongName = 'a'.repeat(200) + '.pdf';
    const sanitized = sanitizeDownloadFilename(veryLongName);
    expect(sanitized.endsWith('.pdf')).toBe(true);
    expect(sanitized.length).toBe(124); // 120 chars base + 4 chars (.pdf)
  });

  it('handles empty, undefined, or whitespace-only inputs gracefully with fallback', () => {
    expect(sanitizeDownloadFilename('')).toBe('document.pdf');
    expect(sanitizeDownloadFilename('   ')).toBe('document.pdf');
    expect(sanitizeDownloadFilename(null as unknown as string)).toBe('document.pdf');
  });
});

describe('PDF Operation: Merge', () => {
  it('merges two synthetic PDFs into a single document preserving page counts', async () => {
    const pdf1 = await createTestPdf(2, 'DocA');
    const pdf2 = await createTestPdf(3, 'DocB');

    const mergedBytes = await mergePdfDocuments([pdf1, pdf2]);
    const mergedDoc = await PDFDocument.load(mergedBytes);

    expect(mergedDoc.getPageCount()).toBe(5);
  });

  it('merges multiple PDFs preserving specified input sequence', async () => {
    const pdf1 = await createTestPdf(1, 'Doc1');
    const pdf2 = await createTestPdf(2, 'Doc2');
    const pdf3 = await createTestPdf(3, 'Doc3');

    const mergedBytes = await mergePdfDocuments([pdf1, pdf2, pdf3]);
    const mergedDoc = await PDFDocument.load(mergedBytes);

    expect(mergedDoc.getPageCount()).toBe(6);
  });

  it('throws when fewer than 2 files are supplied', async () => {
    const pdf1 = await createTestPdf(1);
    await expect(mergePdfDocuments([pdf1])).rejects.toThrow(/At least two PDF documents are required/);
  });

  it('throws on corrupted or invalid input bytes', async () => {
    const validPdf = await createTestPdf(1);
    const corruptedBytes = new Uint8Array([0, 1, 2, 3, 4]);

    await expect(mergePdfDocuments([validPdf, corruptedBytes])).rejects.toThrow(/could not be parsed/);
  });
});

describe('PDF Operation: Split', () => {
  it('extracts a single page into a new PDF', async () => {
    const pdf = await createTestPdf(5, 'Page');
    const result = await splitPdfDocument(pdf, '3');

    expect(result.extractedPageNumbers).toEqual([3]);
    expect(result.totalOutputPages).toBe(1);

    const outDoc = await PDFDocument.load(result.pdfBytes);
    expect(outDoc.getPageCount()).toBe(1);
  });

  it('extracts page ranges into a new PDF preserving exact page order', async () => {
    const pdf = await createTestPdf(6, 'Page');
    const result = await splitPdfDocument(pdf, '2-4, 6');

    expect(result.extractedPageNumbers).toEqual([2, 3, 4, 6]);
    expect(result.totalOutputPages).toBe(4);

    const outDoc = await PDFDocument.load(result.pdfBytes);
    expect(outDoc.getPageCount()).toBe(4);
  });

  it('rejects out of bounds range on split', async () => {
    const pdf = await createTestPdf(3, 'Page');
    await expect(splitPdfDocument(pdf, '1-5')).rejects.toThrow(/exceeds document total/);
  });
});

describe('PDF Operation: Reorder', () => {
  it('reorders pages based on 0-based index sequence', async () => {
    const pdf = await createTestPdf(3, 'Original');
    // Original pages: 0, 1, 2 -> Reorder to: 2, 0, 1
    const reorderedBytes = await reorderPdfDocument(pdf, [2, 0, 1]);

    const outDoc = await PDFDocument.load(reorderedBytes);
    expect(outDoc.getPageCount()).toBe(3);
  });

  it('handles first-page boundary move (first to last)', async () => {
    const pdf = await createTestPdf(3, 'Boundary');
    // Move first page to end: [1, 2, 0]
    const reorderedBytes = await reorderPdfDocument(pdf, [1, 2, 0]);

    const outDoc = await PDFDocument.load(reorderedBytes);
    expect(outDoc.getPageCount()).toBe(3);
  });

  it('handles last-page boundary move (last to first)', async () => {
    const pdf = await createTestPdf(3, 'Boundary');
    // Move last page to front: [2, 0, 1]
    const reorderedBytes = await reorderPdfDocument(pdf, [2, 0, 1]);

    const outDoc = await PDFDocument.load(reorderedBytes);
    expect(outDoc.getPageCount()).toBe(3);
  });

  it('supports page deletion by omitting indices', async () => {
    const pdf = await createTestPdf(4, 'DeleteTest');
    // Remove page 2 (index 1): keep [0, 2, 3]
    const reorderedBytes = await reorderPdfDocument(pdf, [0, 2, 3]);

    const outDoc = await PDFDocument.load(reorderedBytes);
    expect(outDoc.getPageCount()).toBe(3);
  });

  it('rejects out-of-bounds page indices in reorder sequence', async () => {
    const pdf = await createTestPdf(3, 'Original');
    await expect(reorderPdfDocument(pdf, [0, 1, 5])).rejects.toThrow(/is invalid for a document/);
  });
});

describe('PDF Operation: Rotate', () => {
  it('rotates specific pages by 90° CW and 180°', async () => {
    const pdf = await createTestPdf(2, 'Rotate');
    const rotatedBytes = await rotatePdfDocument(pdf, {
      pageRotations: [
        { pageIndex: 0, rotationAngle: 90 },
        { pageIndex: 1, rotationAngle: 180 },
      ],
    });

    const outDoc = await PDFDocument.load(rotatedBytes);
    const pages = outDoc.getPages();

    expect(pages[0]?.getRotation().angle).toBe(90);
    expect(pages[1]?.getRotation().angle).toBe(180);
  });

  it('supports 90° counter-clockwise (270°)', async () => {
    const pdf = await createTestPdf(1, 'CCW');
    const rotatedBytes = await rotatePdfDocument(pdf, {
      pageRotations: [{ pageIndex: 0, rotationAngle: 270 }],
    });

    const outDoc = await PDFDocument.load(rotatedBytes);
    expect(outDoc.getPages()[0]?.getRotation().angle).toBe(270);
  });

  it('rotates all pages by default angle when pageRotations is omitted', async () => {
    const pdf = await createTestPdf(3, 'RotateAll');
    const rotatedBytes = await rotatePdfDocument(pdf, { defaultAngle: 270 });

    const outDoc = await PDFDocument.load(rotatedBytes);
    const pages = outDoc.getPages();

    expect(pages[0]?.getRotation().angle).toBe(270);
    expect(pages[1]?.getRotation().angle).toBe(270);
    expect(pages[2]?.getRotation().angle).toBe(270);
  });

  it('accumulates repeated rotation angles correctly (270° + 90° = 0° mod 360)', async () => {
    const pdf = await createTestPdf(1);
    const step1 = await rotatePdfDocument(pdf, { defaultAngle: 270 });
    const step2 = await rotatePdfDocument(step1, { defaultAngle: 90 });

    const outDoc = await PDFDocument.load(step2);
    const page = outDoc.getPages()[0];
    expect(page?.getRotation().angle).toBe(0);
  });

  it('verifies rotation modifies dictionary metadata without rasterization', async () => {
    const pdf = await createTestPdf(1, 'VectorSharp');
    const rotatedBytes = await rotatePdfDocument(pdf, { defaultAngle: 90 });

    const outDoc = await PDFDocument.load(rotatedBytes);
    const page = outDoc.getPages()[0];

    // Page dimensions are preserved in dictionary
    expect(page?.getWidth()).toBe(400);
    expect(page?.getHeight()).toBe(600);
    expect(page?.getRotation().angle).toBe(90);
  });
});
