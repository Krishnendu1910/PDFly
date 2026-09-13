import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PDFDocument, degrees } from 'pdf-lib';
import { signPdfDocument, type SignaturePlacement } from '@/lib/pdf/operations/sign';
import { SignToolPage } from '@/pages/tools/SignToolPage';
import { MemoryRouter } from 'react-router-dom';

const MINIMAL_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

async function createSamplePdf(pageCount: number = 2): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([400, 600]);
  }
  return doc.save();
}

describe('Sign PDF: Free Placement & Processing Engine', () => {
  describe('signPdfDocument Coordinate & Placement Handling', () => {
    it('applies default signature placement correctly', async () => {
      const source = await createSamplePdf(1);
      const defaultPlacement: SignaturePlacement = {
        xPercent: 65,
        yPercent: 82,
        widthPercent: 28,
        heightPercent: 12,
      };

      const result = await signPdfDocument(source, {
        pageNumber: 1,
        scope: 'page',
        signaturePngBytes: MINIMAL_PNG,
        placement: defaultPlacement,
      });

      expect(result.signedPages).toEqual([1]);
      expect(result.signedPageCount).toBe(1);
      const doc = await PDFDocument.load(result.pdfBytes);
      expect(doc.getPageCount()).toBe(1);
    });

    it('embeds signature at arbitrary free-placement coordinates (top-left, center, etc.)', async () => {
      const source = await createSamplePdf(1);
      const customPlacement: SignaturePlacement = {
        xPercent: 15,
        yPercent: 20,
        widthPercent: 25,
        heightPercent: 10,
      };

      const result = await signPdfDocument(source, {
        pageNumber: 1,
        scope: 'page',
        signaturePngBytes: MINIMAL_PNG,
        placement: customPlacement,
      });

      expect(result.pdfBytes.byteLength).toBeGreaterThan(source.byteLength);
    });

    it('clamps out-of-bounds placement coordinates within page edges', async () => {
      const source = await createSamplePdf(1);
      // Attempt negative and exceeding coordinates
      const outOfBoundsPlacement: SignaturePlacement = {
        xPercent: -50,
        yPercent: 150,
        widthPercent: 20,
        heightPercent: 10,
      };

      const result = await signPdfDocument(source, {
        pageNumber: 1,
        scope: 'page',
        signaturePngBytes: MINIMAL_PNG,
        placement: outOfBoundsPlacement,
      });

      expect(result.signedPageCount).toBe(1);
    });

    it('supports This Page scope signing only designated page', async () => {
      const source = await createSamplePdf(3);

      const result = await signPdfDocument(source, {
        pageNumber: 2,
        scope: 'page',
        signaturePngBytes: MINIMAL_PNG,
        placement: { xPercent: 50, yPercent: 50, widthPercent: 25, heightPercent: 10 },
      });

      expect(result.signedPageNumber).toBe(2);
      expect(result.signedPages).toEqual([2]);
      expect(result.signedPageCount).toBe(1);
    });

    it('supports All Pages scope embedding across all pages proportionally', async () => {
      const source = await createSamplePdf(4);

      const result = await signPdfDocument(source, {
        scope: 'all',
        signaturePngBytes: MINIMAL_PNG,
        placement: { xPercent: 70, yPercent: 80, widthPercent: 20, heightPercent: 10 },
      });

      expect(result.signedPageCount).toBe(4);
      expect(result.signedPages).toEqual([1, 2, 3, 4]);
    });

    it('supports per-page placement overrides when pagePlacements map is provided', async () => {
      const source = await createSamplePdf(3);
      const page1Placement: SignaturePlacement = { xPercent: 10, yPercent: 10, widthPercent: 20, heightPercent: 10 };
      const page2Placement: SignaturePlacement = { xPercent: 60, yPercent: 75, widthPercent: 30, heightPercent: 15 };

      const result = await signPdfDocument(source, {
        scope: 'all',
        signaturePngBytes: MINIMAL_PNG,
        placement: { xPercent: 50, yPercent: 50, widthPercent: 20, heightPercent: 10 },
        pagePlacements: {
          1: page1Placement,
          2: page2Placement,
        },
      });

      expect(result.signedPageCount).toBe(3);
      const doc = await PDFDocument.load(result.pdfBytes);
      expect(doc.getPageCount()).toBe(3);
    });

    it('handles mixed page dimensions (portrait, landscape, square) gracefully', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([400, 600]); // Portrait
      doc.addPage([800, 500]); // Landscape
      doc.addPage([500, 500]); // Square
      const mixedBytes = await doc.save();

      const result = await signPdfDocument(mixedBytes, {
        scope: 'all',
        signaturePngBytes: MINIMAL_PNG,
        placement: { xPercent: 60, yPercent: 70, widthPercent: 25, heightPercent: 10 },
      });

      expect(result.signedPageCount).toBe(3);
      const loaded = await PDFDocument.load(result.pdfBytes);
      expect(loaded.getPageCount()).toBe(3);
    });

    it('handles rotated PDF pages correctly across 0°, 90°, 180°, and 270° orientations', async () => {
      const doc = await PDFDocument.create();
      const p0 = doc.addPage([400, 600]);
      p0.setRotation(degrees(0));

      const p90 = doc.addPage([400, 600]);
      p90.setRotation(degrees(90));

      const p180 = doc.addPage([400, 600]);
      p180.setRotation(degrees(180));

      const p270 = doc.addPage([400, 600]);
      p270.setRotation(degrees(270));

      const rotatedBytes = await doc.save();

      const result = await signPdfDocument(rotatedBytes, {
        scope: 'all',
        signaturePngBytes: MINIMAL_PNG,
        placement: { xPercent: 20, yPercent: 30, widthPercent: 25, heightPercent: 10 },
      });

      expect(result.signedPageCount).toBe(4);
      expect(result.signedPages).toEqual([1, 2, 3, 4]);
      const loaded = await PDFDocument.load(result.pdfBytes);
      expect(loaded.getPage(1).getRotation().angle).toBe(90);
      expect(loaded.getPage(2).getRotation().angle).toBe(180);
      expect(loaded.getPage(3).getRotation().angle).toBe(270);
    });
  });

  describe('SignToolPage Interactive UI & Accessibility', () => {
    it('renders file ingestion dropzone and client-side privacy assurance', () => {
      const html = renderToString(
        <MemoryRouter>
          <SignToolPage />
        </MemoryRouter>
      );

      // Verify title & dropzone
      expect(html).toContain('Sign PDF');
      expect(html).toContain('Select or drop a PDF document to sign');

      // Verify privacy disclaimer remains intact
      expect(html).toContain('100% In-Memory Ink Processing');
      expect(html).toContain('Clean PNG Compression');
    });
  });
});
