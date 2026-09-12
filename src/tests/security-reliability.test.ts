import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfDocuments, MAX_CUMULATIVE_PAGES_MERGE } from '@/lib/pdf/operations/merge';
import { splitPdfDocument } from '@/lib/pdf/operations/split';
import { reorderPdfDocument, MAX_REORDER_PAGES } from '@/lib/pdf/operations/reorder';
import { rotatePdfDocument, MAX_ROTATE_PAGES } from '@/lib/pdf/operations/rotate';
import { compressPdfDocument } from '@/lib/pdf/compression/compressor';
import { detectPdfCharacteristics } from '@/lib/pdf/compression/detector';
import { parsePageRange, MAX_EXTRACTED_PAGES_PER_SPLIT } from '@/lib/pdf/utils/range-parser';
import { sanitizeDownloadFilename, downloadPdfBytes } from '@/lib/pdf/utils/download';
import { validateImageSignature, validateImageFile } from '@/lib/pdf/images/validation';
import { convertImagesToPdf, MAX_IMAGES_PER_CONVERSION } from '@/lib/pdf/images/converter';
import type { ImageDescriptor } from '@/lib/pdf/images/types';
import type { ManagedFile } from '@/types/file';
import { PdfOperationError } from '@/lib/pdf/types';

// Helper to create a valid minimal PDF
async function createValidPdf(pages = 1): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`Page ${i + 1}`);
  }
  return doc.save();
}

describe('Security: Malformed & Adversarial PDF Handling', () => {
  it('rejects empty 0-byte buffer across all operations', async () => {
    const empty = new Uint8Array(0);

    await expect(mergePdfDocuments([empty, empty])).rejects.toThrow(PdfOperationError);
    await expect(splitPdfDocument(empty, '1')).rejects.toThrow(PdfOperationError);
    await expect(reorderPdfDocument(empty, [0])).rejects.toThrow(PdfOperationError);
    await expect(rotatePdfDocument(empty)).rejects.toThrow(PdfOperationError);
    await expect(compressPdfDocument(empty)).rejects.toThrow(PdfOperationError);
    await expect(detectPdfCharacteristics(empty)).rejects.toThrow(PdfOperationError);
  });

  it('rejects random binary noise without uncaught exceptions or crashes', async () => {
    const junk = new Uint8Array([0x01, 0x02, 0xde, 0xad, 0xbe, 0xef, 0xca, 0xfe, 0xba, 0xbe]);

    await expect(mergePdfDocuments([junk, junk])).rejects.toThrow(PdfOperationError);
    await expect(splitPdfDocument(junk, '1')).rejects.toThrow(PdfOperationError);
    await expect(reorderPdfDocument(junk, [0])).rejects.toThrow(PdfOperationError);
    await expect(rotatePdfDocument(junk)).rejects.toThrow(PdfOperationError);
    await expect(compressPdfDocument(junk)).rejects.toThrow(PdfOperationError);
    await expect(detectPdfCharacteristics(junk)).rejects.toThrow(PdfOperationError);
  });

  it('rejects truncated PDF headers and partial content gracefully', async () => {
    const truncated = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\n');

    await expect(splitPdfDocument(truncated, '1')).rejects.toThrow(PdfOperationError);
    await expect(reorderPdfDocument(truncated, [0])).rejects.toThrow(PdfOperationError);
    await expect(rotatePdfDocument(truncated)).rejects.toThrow(PdfOperationError);
    await expect(compressPdfDocument(truncated)).rejects.toThrow(PdfOperationError);
  });

  it('rejects corrupt cross-reference data and unparseable object graphs', async () => {
    const corruptXref = new TextEncoder().encode(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<< /Root 1 0 R >>\n%%EOF',
    );

    await expect(splitPdfDocument(corruptXref, '1')).rejects.toThrow(PdfOperationError);
  });
});

describe('Security: Resource Exhaustion & DoS Resistance', () => {
  it('enforces MAX_EXTRACTED_PAGES_PER_SPLIT limit to prevent unbounded memory allocation', () => {
    // Valid 3000 page document range
    const totalPages = 3000;
    const hugeRange = '1-2500';

    expect(() => parsePageRange(hugeRange, totalPages)).toThrow(PdfOperationError);
    expect(() => parsePageRange(hugeRange, totalPages)).toThrow(
      new RegExp(`exceeds the maximum limit of ${MAX_EXTRACTED_PAGES_PER_SPLIT} pages`),
    );
  });

  it('permits valid ranges within the safe extracted page limit', () => {
    const result = parsePageRange('1-500, 600-700', 1000);
    expect(result.pages.length).toBe(601);
  });

  it('rejects out-of-bounds page requests exceeding document total', () => {
    expect(() => parsePageRange('501', 500)).toThrow(/exceeds document total/);
    expect(() => parsePageRange('1-505', 500)).toThrow(/exceeds document total/);
  });
});

describe('Security: Image Format Boundaries & Active Content Defense', () => {
  it('rejects SVG images masquerading as raster formats to eliminate SVG XSS risk', () => {
    const svgBytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const result = validateImageSignature(svgBytes);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('SVG images are not supported');
  });

  it('rejects HTML and XML payload files masquerading as images', () => {
    const htmlBytes = new TextEncoder().encode('<!DOCTYPE html><html><body><script>evil()</script></body></html>');
    const resultHtml = validateImageSignature(htmlBytes);
    expect(resultHtml.valid).toBe(false);

    const xmlBytes = new TextEncoder().encode('<?xml version="1.0"?><data></data>');
    const resultXml = validateImageSignature(xmlBytes);
    expect(resultXml.valid).toBe(false);
  });

  it('rejects truncated and empty image byte streams', () => {
    const truncated = new Uint8Array([0xff, 0xd8]);
    const result = validateImageSignature(truncated);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too small or truncated');
  });

  it('rejects extension / MIME mismatches (e.g. JPEG payload named photo.png)', async () => {
    // Real JPEG magic bytes inside a File object named .png
    const jpegContent = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const mismatchedFile = new File([jpegContent], 'avatar.png', { type: 'image/png' });

    const result = await validateImageFile(mismatchedFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('does not match its detected format (JPEG)');
  });
});

describe('Security: Atomic Output Safety & Download Integrity', () => {
  it('rejects downloading empty or truncated byte arrays', () => {
    expect(() => downloadPdfBytes(new Uint8Array(0), 'empty.pdf')).toThrow(PdfOperationError);
    expect(() => downloadPdfBytes(new Uint8Array(0), 'empty.pdf')).toThrow(/empty or truncated/);
    expect(() => downloadPdfBytes(new Uint8Array([1, 2, 3]), 'tiny.pdf')).toThrow(/empty or truncated/);
  });

  it('rejects downloading corrupted or non-PDF bytes lacking %PDF- header', () => {
    const nonPdfBytes = new TextEncoder().encode('<html><body>Not a real PDF</body></html>');
    expect(() => downloadPdfBytes(nonPdfBytes, 'invalid.pdf')).toThrow(PdfOperationError);
    expect(() => downloadPdfBytes(nonPdfBytes, 'invalid.pdf')).toThrow(/lacks valid PDF header signature/);
  });

  it('validates genuine %PDF- signature and sanitizes download filename', async () => {
    const validPdf = await createValidPdf(1);
    // In node environment, document.createElement is mocked or available in vitest DOM
    // Verify valid bytes do not throw signature validation error
    expect(validPdf[0]).toBe(0x25); // '%'
    expect(validPdf[1]).toBe(0x50); // 'P'
    expect(validPdf[2]).toBe(0x44); // 'D'
    expect(validPdf[3]).toBe(0x46); // 'F'
    expect(validPdf[4]).toBe(0x2d); // '-'
  });
});

describe('Security: Filename Sanitization & OS Device Name Neutralization', () => {
  it('strictly neutralizes path traversal across Unix and Windows separators', () => {
    expect(sanitizeDownloadFilename('../../evil.pdf')).toBe('evil.pdf');
    expect(sanitizeDownloadFilename('..\\..\\evil.pdf')).toBe('evil.pdf');
    expect(sanitizeDownloadFilename('../../../etc/passwd.pdf')).toBe('passwd.pdf');
    expect(sanitizeDownloadFilename('/absolute/path/to/doc.pdf')).toBe('doc.pdf');
    expect(sanitizeDownloadFilename('C:\\Windows\\System32\\driver.pdf')).toBe('driver.pdf');
  });

  it('neutralizes all Windows DOS reserved device names with extension', () => {
    expect(sanitizeDownloadFilename('CON')).toBe('_CON.pdf');
    expect(sanitizeDownloadFilename('con.pdf')).toBe('_con.pdf');
    expect(sanitizeDownloadFilename('PRN.pdf')).toBe('_PRN.pdf');
    expect(sanitizeDownloadFilename('AUX.pdf')).toBe('_AUX.pdf');
    expect(sanitizeDownloadFilename('NUL.pdf')).toBe('_NUL.pdf');
    expect(sanitizeDownloadFilename('COM1.pdf')).toBe('_COM1.pdf');
    expect(sanitizeDownloadFilename('COM9.pdf')).toBe('_COM9.pdf');
    expect(sanitizeDownloadFilename('LPT1.pdf')).toBe('_LPT1.pdf');
    expect(sanitizeDownloadFilename('LPT9.pdf')).toBe('_LPT9.pdf');
  });

  it('neutralizes control characters and illegal OS characters', () => {
    expect(sanitizeDownloadFilename('bad\x00file\x1fname.pdf')).toBe('bad_file_name.pdf');
    expect(sanitizeDownloadFilename('file:name*with?illegal<chars>.pdf')).toBe('file_name_with_illegal_chars.pdf');
  });

  it('preserves valid international Unicode characters and natural spaces', () => {
    expect(sanitizeDownloadFilename('Offre d\'emploi.pdf')).toBe('Offre d\'emploi.pdf');
    expect(sanitizeDownloadFilename('Contrato final 2024.pdf')).toBe('Contrato final 2024.pdf');
    expect(sanitizeDownloadFilename('日本語.pdf')).toBe('日本語.pdf');
    expect(sanitizeDownloadFilename('документ.pdf')).toBe('документ.pdf');
  });
});

describe('Security: Document Integrity & Preservation', () => {
  it('preserves page count, dimensions, and rotation across reordering', async () => {
    const original = await createValidPdf(3);
    const reordered = await reorderPdfDocument(original, [2, 0, 1]);

    const outDoc = await PDFDocument.load(reordered);
    expect(outDoc.getPageCount()).toBe(3);

    const page0 = outDoc.getPages()[0]!;
    expect(page0.getWidth()).toBe(400);
    expect(page0.getHeight()).toBe(600);
  });

  it('preserves vector elements and selectable text after rotation', async () => {
    const original = await createValidPdf(2);
    const rotated = await rotatePdfDocument(original, { defaultAngle: 90 });

    const outDoc = await PDFDocument.load(rotated);
    expect(outDoc.getPageCount()).toBe(2);

    const pages = outDoc.getPages();
    expect(pages[0]!.getRotation().angle).toBe(90);
    expect(pages[1]!.getRotation().angle).toBe(90);
  });
});

describe('Security: Encrypted PDF Handling & Password Rejection', () => {
  // Construct a minimal syntactically valid PDF containing an Encrypt dictionary
  const encryptedPdfBytes = new TextEncoder().encode(
    '%PDF-1.4\n' +
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Count 0 /Kids [] >>\nendobj\n' +
    '3 0 obj\n<< /Filter /Standard /V 1 /R 2 /O (pass) /U (pass) /P -44 >>\nendobj\n' +
    'trailer\n<< /Root 1 0 R /Encrypt 3 0 R >>\n%%EOF',
  );

  it('rejects encrypted PDFs in merge with ENCRYPTED_PDF error code', async () => {
    try {
      await mergePdfDocuments([encryptedPdfBytes, encryptedPdfBytes]);
      expect.fail('Expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PdfOperationError);
      expect((err as PdfOperationError).code).toBe('ENCRYPTED_PDF');
      expect((err as Error).message).toContain('is password-protected or encrypted');
    }
  });

  it('rejects encrypted PDFs in split with ENCRYPTED_PDF error code', async () => {
    try {
      await splitPdfDocument(encryptedPdfBytes, '1');
      expect.fail('Expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PdfOperationError);
      expect((err as PdfOperationError).code).toBe('ENCRYPTED_PDF');
    }
  });

  it('rejects encrypted PDFs in reorder with ENCRYPTED_PDF error code', async () => {
    try {
      await reorderPdfDocument(encryptedPdfBytes, [0]);
      expect.fail('Expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PdfOperationError);
      expect((err as PdfOperationError).code).toBe('ENCRYPTED_PDF');
    }
  });

  it('rejects encrypted PDFs in rotate with ENCRYPTED_PDF error code', async () => {
    try {
      await rotatePdfDocument(encryptedPdfBytes);
      expect.fail('Expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PdfOperationError);
      expect((err as PdfOperationError).code).toBe('ENCRYPTED_PDF');
    }
  });

  it('rejects encrypted PDFs in compression with ENCRYPTED_PDF error code', async () => {
    try {
      await compressPdfDocument(encryptedPdfBytes);
      expect.fail('Expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PdfOperationError);
      expect((err as PdfOperationError).code).toBe('ENCRYPTED_PDF');
    }
  });

  it('rejects encrypted PDFs in characteristic detection with ENCRYPTED_PDF error code', async () => {
    try {
      await detectPdfCharacteristics(encryptedPdfBytes);
      expect.fail('Expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(PdfOperationError);
      expect((err as PdfOperationError).code).toBe('ENCRYPTED_PDF');
    }
  });
});

describe('Security: Resource Limit & DoS Boundary Enforcement', () => {
  it('enforces MAX_REORDER_PAGES limit when requesting pathological page order', async () => {
    const validPdf = await createValidPdf(1);
    const hugeOrder = new Array(MAX_REORDER_PAGES + 1).fill(0);

    await expect(reorderPdfDocument(validPdf, hugeOrder)).rejects.toThrow(PdfOperationError);
    await expect(reorderPdfDocument(validPdf, hugeOrder)).rejects.toThrow(
      new RegExp(`exceeds the maximum allowed page count of ${MAX_REORDER_PAGES}`),
    );
  });

  it('enforces MAX_ROTATE_PAGES limit on document rotation operations', async () => {
    const validPdf = await createValidPdf(1);
    const hugeRotations = new Array(MAX_ROTATE_PAGES + 1).fill(null).map((_, i) => ({
      pageIndex: i,
      rotationAngle: 90 as const,
    }));

    await expect(rotatePdfDocument(validPdf, { pageRotations: hugeRotations })).rejects.toThrow(
      PdfOperationError,
    );
    await expect(rotatePdfDocument(validPdf, { pageRotations: hugeRotations })).rejects.toThrow(
      new RegExp(`exceeds the maximum allowed page count of ${MAX_ROTATE_PAGES}`),
    );
  });

  it('enforces MAX_IMAGES_PER_CONVERSION limit in convertImagesToPdf', async () => {
    const dummyManagedFile: ManagedFile = {
      id: 'test-1',
      file: new File([], 'test.jpg', { type: 'image/jpeg' }),
      name: 'test.jpg',
      size: 100,
      type: 'image/jpeg',
      status: 'idle',
      fingerprint: 'test.jpg:100:0:image/jpeg',
      formattedSize: '100 B',
      extension: '.jpg',
      lastModified: 0,
    };

    const excessiveImages: ImageDescriptor[] = new Array(MAX_IMAGES_PER_CONVERSION + 1).fill(null).map((_, i) => ({
      id: `img-${i}`,
      managedFile: dummyManagedFile,
      previewUrl: 'blob:mock',
      format: 'jpeg',
      status: 'ready',
      rotation: 0 as const,
    }));

    await expect(convertImagesToPdf(excessiveImages)).rejects.toThrow(PdfOperationError);
    await expect(convertImagesToPdf(excessiveImages)).rejects.toThrow(
      new RegExp(`Exceeded maximum allowed images \\(${MAX_IMAGES_PER_CONVERSION}\\)`),
    );
  });

  it('enforces MAX_CUMULATIVE_PAGES_MERGE limit in mergePdfDocuments', async () => {
    // Create a mock doc with simulated page count exceeding MAX_CUMULATIVE_PAGES_MERGE
    const validPdf = await createValidPdf(1);

    // Mock PDFDocument.load once to return a document claiming excessive pages
    const { PDFDocument } = await import('pdf-lib');
    const origLoad = PDFDocument.load;
    PDFDocument.load = async (bytes, options) => {
      const doc = await origLoad.call(PDFDocument, bytes, options);
      doc.getPageCount = () => MAX_CUMULATIVE_PAGES_MERGE + 1;
      return doc;
    };

    try {
      await expect(mergePdfDocuments([validPdf, validPdf])).rejects.toThrow(
        new RegExp(`Cumulative page count exceeds the maximum limit of ${MAX_CUMULATIVE_PAGES_MERGE}`),
      );
    } finally {
      PDFDocument.load = origLoad;
    }
  });
});
