import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  removePagesFromPdf,
  extractPagesFromPdf,
  addPageNumbersToPdf,
  addWatermarkToPdf,
  cropPdfDocument,
  signPdfDocument,
  convertPdfToMarkdown,
  convertPdfToImages,
  PdfOperationError,
} from '@/lib/pdf';

// Minimal valid 1x1 transparent PNG byte array (67 bytes)
const MINIMAL_1X1_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
  0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54,
  0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
  0x0d, 0x0a, 0x2d, 0xb4,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);

/**
 * Creates a synthetic PDF document in memory for testing
 */
async function createTestPdf(pageCount: number, prefix = 'Page'): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([500, 700]);
    page.drawText(`${prefix} ${i} Header Content`, {
      x: 50,
      y: 650,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawText(`This is paragraph text on page ${i} of our document.`, {
      x: 50,
      y: 600,
      size: 12,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }
  return doc.save();
}

describe('Phase 12: Remove Pages Operation', () => {
  it('removes a single page from a multi-page document', async () => {
    const sourceBytes = await createTestPdf(4);
    const result = await removePagesFromPdf(sourceBytes, {
      pagesToRemove: [2],
    });

    expect(result.remainingPageCount).toBe(3);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(3);
  });

  it('removes multiple boundary and interior pages', async () => {
    const sourceBytes = await createTestPdf(6);
    const result = await removePagesFromPdf(sourceBytes, {
      pagesToRemove: [1, 3, 6],
    });

    expect(result.remainingPageCount).toBe(3);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(3);
  });

  it('throws error when attempting to remove all pages', async () => {
    const sourceBytes = await createTestPdf(3);
    await expect(
      removePagesFromPdf(sourceBytes, {
        pagesToRemove: [1, 2, 3],
      }),
    ).rejects.toThrow(PdfOperationError);
  });

  it('throws error when target page number is out of bounds', async () => {
    const sourceBytes = await createTestPdf(3);
    await expect(
      removePagesFromPdf(sourceBytes, {
        pagesToRemove: [5],
      }),
    ).rejects.toThrow(PdfOperationError);
  });

  it('throws error when no pages are specified to remove', async () => {
    const sourceBytes = await createTestPdf(3);
    await expect(
      removePagesFromPdf(sourceBytes, {
        pagesToRemove: [],
      }),
    ).rejects.toThrow(PdfOperationError);
  });
});

describe('Phase 12: Extract Pages Operation', () => {
  it('extracts a single page into a standalone document', async () => {
    const sourceBytes = await createTestPdf(5);
    const result = await extractPagesFromPdf(sourceBytes, {
      pageNumbers: [3],
    });

    expect(result.extractedCount).toBe(1);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it('extracts pages and preserves specified custom order', async () => {
    const sourceBytes = await createTestPdf(5);
    const result = await extractPagesFromPdf(sourceBytes, {
      pageNumbers: [4, 1, 3],
    });

    expect(result.extractedCount).toBe(3);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(3);
  });

  it('extracts pages using range string specification', async () => {
    const sourceBytes = await createTestPdf(6);
    const result = await extractPagesFromPdf(sourceBytes, {
      rangeString: '2-4, 6',
    });

    expect(result.extractedCount).toBe(4);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(4);
  });

  it('throws error when no pages are specified for extraction', async () => {
    const sourceBytes = await createTestPdf(3);
    await expect(
      extractPagesFromPdf(sourceBytes, {
        pageNumbers: [],
      }),
    ).rejects.toThrow(PdfOperationError);
  });

  it('throws error when extracting out of bounds pages', async () => {
    const sourceBytes = await createTestPdf(3);
    await expect(
      extractPagesFromPdf(sourceBytes, {
        pageNumbers: [10],
      }),
    ).rejects.toThrow(PdfOperationError);
  });
});

describe('Phase 12: Add Page Numbers Operation', () => {
  it('numbers pages with default bottom-center position and page-of-total format', async () => {
    const sourceBytes = await createTestPdf(3);
    const progressSpy = vi.fn();

    const result = await addPageNumbersToPdf(sourceBytes, {
      position: 'bottom-center',
      format: 'page-n-of-total',
      startNumber: 1,
      fontSize: 10,
      onProgress: progressSpy,
    });

    expect(result.totalPages).toBe(3);
    expect(result.pdfBytes.byteLength).toBeGreaterThan(sourceBytes.byteLength);
    expect(progressSpy).toHaveBeenCalled();
  });

  it('supports all format variations and position configurations', async () => {
    const sourceBytes = await createTestPdf(2);

    const positions = [
      'bottom-left',
      'bottom-center',
      'bottom-right',
      'top-left',
      'top-center',
      'top-right',
    ] as const;

    for (const pos of positions) {
      const result = await addPageNumbersToPdf(sourceBytes, {
        position: pos,
        format: 'n-of-total',
        startNumber: 5,
        fontSize: 11,
      });
      expect(result.totalPages).toBe(2);
      expect(result.pdfBytes.length).toBeGreaterThan(0);
    }
  });

  it('supports custom startNumber offset', async () => {
    const sourceBytes = await createTestPdf(2);
    const result = await addPageNumbersToPdf(sourceBytes, {
      format: 'page-n',
      startNumber: 10,
    });
    expect(result.totalPages).toBe(2);
  });
});

describe('Phase 12: Watermark PDF Operation', () => {
  it('stamps watermark text diagonally across all pages', async () => {
    const sourceBytes = await createTestPdf(3);
    const progressSpy = vi.fn();

    const result = await addWatermarkToPdf(sourceBytes, {
      text: 'CONFIDENTIAL',
      position: 'center',
      rotation: 'diagonal',
      opacity: 0.3,
      fontSize: 48,
      onProgress: progressSpy,
    });

    expect(result.totalPages).toBe(3);
    expect(result.pdfBytes.byteLength).toBeGreaterThan(sourceBytes.byteLength);
    expect(progressSpy).toHaveBeenCalled();
  });

  it('stamps horizontal watermark in top/bottom positions', async () => {
    const sourceBytes = await createTestPdf(2);

    const resultTop = await addWatermarkToPdf(sourceBytes, {
      text: 'DRAFT COPY',
      position: 'top',
      rotation: 'horizontal',
      opacity: 0.5,
      fontSize: 32,
    });
    expect(resultTop.totalPages).toBe(2);

    const resultBottom = await addWatermarkToPdf(sourceBytes, {
      text: 'INTERNAL USE ONLY',
      position: 'bottom',
      rotation: 'horizontal',
      opacity: 0.2,
      fontSize: 24,
    });
    expect(resultBottom.totalPages).toBe(2);
  });

  it('throws error when watermark text is empty or blank', async () => {
    const sourceBytes = await createTestPdf(2);
    await expect(
      addWatermarkToPdf(sourceBytes, {
        text: '   ',
      }),
    ).rejects.toThrow(PdfOperationError);
  });
});

describe('Phase 12: Crop PDF Operation', () => {
  it('crops page margins and updates CropBox and MediaBox', async () => {
    const sourceBytes = await createTestPdf(2);
    const progressSpy = vi.fn();

    const result = await cropPdfDocument(sourceBytes, {
      margins: { top: 10, bottom: 10, left: 10, right: 10 },
      onProgress: progressSpy,
    });

    expect(result.totalPages).toBe(2);
    const doc = await PDFDocument.load(result.pdfBytes);
    const page = doc.getPage(0);
    const mediaBox = page.getMediaBox();
    const cropBox = page.getCropBox();

    // Original was 500 x 700
    // Cropped width: 500 - 50 - 50 = 400
    // Cropped height: 700 - 70 - 70 = 560
    expect(mediaBox.width).toBeCloseTo(400, 1);
    expect(mediaBox.height).toBeCloseTo(560, 1);
    expect(cropBox.width).toBeCloseTo(400, 1);
    expect(cropBox.height).toBeCloseTo(560, 1);
    expect(progressSpy).toHaveBeenCalled();
  });

  it('throws error when crop margins exceed safe bounds', async () => {
    const sourceBytes = await createTestPdf(2);
    await expect(
      cropPdfDocument(sourceBytes, {
        margins: { top: 50, bottom: 50, left: 10, right: 10 },
      }),
    ).rejects.toThrow(PdfOperationError);
  });
});

describe('Phase 12: Sign PDF Operation', () => {
  it('embeds signature PNG onto designated page', async () => {
    const sourceBytes = await createTestPdf(3);
    const progressSpy = vi.fn();

    const result = await signPdfDocument(sourceBytes, {
      pageNumber: 2,
      signaturePngBytes: MINIMAL_1X1_PNG,
      placement: {
        xPercent: 60,
        yPercent: 80,
        widthPercent: 30,
        heightPercent: 15,
      },
      onProgress: progressSpy,
    });

    expect(result.signedPageNumber).toBe(2);
    const doc = await PDFDocument.load(result.pdfBytes);
    expect(doc.getPageCount()).toBe(3);
    expect(progressSpy).toHaveBeenCalled();
  });

  it('throws error when signature image bytes are empty', async () => {
    const sourceBytes = await createTestPdf(2);
    await expect(
      signPdfDocument(sourceBytes, {
        pageNumber: 1,
        signaturePngBytes: new Uint8Array(0),
        placement: { xPercent: 50, yPercent: 50, widthPercent: 20, heightPercent: 10 },
      }),
    ).rejects.toThrow(PdfOperationError);
  });

  it('throws error when target page is out of bounds', async () => {
    const sourceBytes = await createTestPdf(2);
    await expect(
      signPdfDocument(sourceBytes, {
        pageNumber: 5,
        signaturePngBytes: MINIMAL_1X1_PNG,
        placement: { xPercent: 50, yPercent: 50, widthPercent: 20, heightPercent: 10 },
      }),
    ).rejects.toThrow(PdfOperationError);
  });
});

describe('Phase 12: PDF to Markdown Operation', () => {
  it('extracts text from PDF pages and reconstructs Markdown with page dividers', async () => {
    const sourceBytes = await createTestPdf(2, 'Section');
    const result = await convertPdfToMarkdown(sourceBytes, {
      includePageSeparators: true,
    });

    expect(result.pageCount).toBe(2);
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.charCount).toBeGreaterThan(0);
    expect(result.markdown).toContain('---');
    expect(result.markdown.toLowerCase()).toContain('section');
  });

  it('extracts Markdown without page dividers when disabled', async () => {
    const sourceBytes = await createTestPdf(2);
    const result = await convertPdfToMarkdown(sourceBytes, {
      includePageSeparators: false,
    });

    expect(result.markdown).not.toContain('\n\n---\n\n');
  });

  it('reconstructs complex mathematical formulas, superscripts, ligatures and tables from real question paper', async () => {
    const fixturePath = path.resolve(__dirname, 'fixtures/question_paper.pdf');
    if (!fs.existsSync(fixturePath)) return;
    const pdfBuffer = fs.readFileSync(fixturePath);
    const pdfBytes = new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);

    const result = await convertPdfToMarkdown(pdfBytes, {
      includePageSeparators: true,
    });

    expect(result.pageCount).toBe(3);

    // Document Hierarchy
    expect(result.markdown).toContain('## SECTION A (40 MARKS)');
    expect(result.markdown).toContain('## SECTION B (40 MARKS)');
    expect(result.markdown).toContain('### Question 1');
    expect(result.markdown).toContain('### Question 5');
    expect(result.markdown).toContain('### Question 8');

    // Mathematical formulas & superscripts
    expect(result.markdown).toContain('d = b² − 4ac');
    expect(result.markdown).toContain('18 − 4 × 3 + 6');
    expect(result.markdown).toContain('Area = length × breadth');
    expect(result.markdown).toContain('29%5');

    // Ligature reconstruction
    expect(result.markdown).toContain('first 15 minutes');
    expect(result.markdown).toContain('five questions');
    expect(result.markdown).toContain('Differentiate');
    expect(result.markdown).toContain('flowchart');
    expect(result.markdown).toContain('Define and explain');
    expect(result.markdown).toContain('figures');
    expect(result.markdown).toContain('fix it');

    // Table reconstruction
    expect(result.markdown).toContain('| | A | B | C | D |');
    expect(result.markdown).toContain('|---|---|---|---|---|');
    expect(result.markdown).toContain('| 1 | Student Name | Computer | Science | Total Marks |');
    expect(result.markdown).toContain('Aarav');
    expect(result.markdown).toContain('Meera');
    expect(result.markdown).toContain('Karan');

    // Furniture suppression
    // Running header should not be repeated on page 2 or page 3
    const headerOccurrences = (result.markdown.match(/Krishnendu Sarkar/g) || []).length;
    expect(headerOccurrences).toBe(1);

    // Page footer numbers like "Page 1" should be suppressed
    expect(result.markdown).not.toMatch(/\bPage\s+[123]\b/);
  });

  it('handles Safari environments lacking ReadableStream asyncIterator gracefully', async () => {
    const originalAsyncIterator = (ReadableStream.prototype as unknown as Record<symbol, unknown>)[Symbol.asyncIterator];
    delete (ReadableStream.prototype as unknown as Record<symbol, unknown>)[Symbol.asyncIterator];

    try {
      const sourceBytes = await createTestPdf(1, 'Safari Test Content');
      const result = await convertPdfToMarkdown(sourceBytes);
      expect(result.pageCount).toBe(1);
      expect(result.markdown.toLowerCase()).toContain('safari test content');
    } finally {
      if (originalAsyncIterator) {
        (ReadableStream.prototype as unknown as Record<symbol, unknown>)[Symbol.asyncIterator] = originalAsyncIterator;
      }
    }
  });
});

describe('Phase 12: PDF to Images Operation', () => {
  let originalDocument: unknown;
  let originalUrl: unknown;

  beforeEach(() => {
    originalDocument = (globalThis as unknown as Record<string, unknown>).document;
    originalUrl = (globalThis as unknown as Record<string, unknown>).URL;

    const mockCtx = new Proxy(
      {
        fillStyle: '',
        fillRect: vi.fn(),
        measureText: () => ({ width: 10 }),
        createImageData: () => ({ data: new Uint8ClampedArray(4) }),
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
        resetTransform: vi.fn(),
      },
      {
        get(target, prop) {
          if (prop in target) return (target as Record<string, unknown>)[prop as string];
          return vi.fn();
        },
      },
    );

    const mockCanvas = {
      width: 100,
      height: 100,
      getContext: () => mockCtx,
      toDataURL: (mime = 'image/png') => `data:${mime};base64,mockdata`,
      toBlob: (cb: (b: Blob | null) => void, mime = 'image/png') => {
        cb(new Blob([new Uint8Array([1, 2, 3])], { type: mime }));
      },
    };

    (globalThis as unknown as Record<string, unknown>).document = {
      createElement: (tag: string) => {
        if (tag === 'canvas') return mockCanvas;
        return {};
      },
    };

    (globalThis as unknown as Record<string, unknown>).URL = {
      createObjectURL: (blob: Blob) => `data:${blob.type || 'image/png'};base64,mockdata`,
      revokeObjectURL: vi.fn(),
    };
  });

  afterEach(() => {
    (globalThis as unknown as Record<string, unknown>).document = originalDocument;
    (globalThis as unknown as Record<string, unknown>).URL = originalUrl;
  });

  it('converts multi-page PDF pages to data URL image outputs', async () => {
    const sourceBytes = await createTestPdf(2);
    const progressSpy = vi.fn();

    const result = await convertPdfToImages(sourceBytes, {
      format: 'png',
      scale: 1.0,
      onProgress: progressSpy,
    });

    expect(result).toHaveLength(2);
    expect(result[0].pageNumber).toBe(1);
    expect(result[1].pageNumber).toBe(2);
    expect(result[0].dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(progressSpy).toHaveBeenCalled();
  });

  it('supports JPEG format with custom quality', async () => {
    const sourceBytes = await createTestPdf(1);
    const result = await convertPdfToImages(sourceBytes, {
      format: 'jpeg',
      quality: 0.8,
      scale: 1.0,
    });

    expect(result).toHaveLength(1);
    expect(result[0].dataUrl).toMatch(/^data:image\/jpeg;base64,/);
  });
});
