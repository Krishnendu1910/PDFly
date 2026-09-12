import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  stripPdfExtension,
  ensurePdfExtension,
  extractBaseName,
  getDefaultDownloadFilename,
  getSplitDefaultFilename,
  prepareSafeDownloadFilename,
  sanitizeDownloadFilename,
} from '@/utils/filenameUtils';
import { downloadPdfBytes } from '@/lib/pdf/utils/download';
import { DownloadResultDocket, type OutputFileItem } from '@/components/download';

describe('Phase 11: Filename Generation Utilities', () => {
  describe('stripPdfExtension', () => {
    it('strips trailing .pdf case-insensitively', () => {
      expect(stripPdfExtension('document.pdf')).toBe('document');
      expect(stripPdfExtension('document.PDF')).toBe('document');
      expect(stripPdfExtension('document.Pdf')).toBe('document');
    });

    it('strips multiple consecutive .pdf extensions to prevent duplication', () => {
      expect(stripPdfExtension('document.pdf.pdf')).toBe('document');
      expect(stripPdfExtension('document.PDF.pdf.PDF')).toBe('document');
    });

    it('leaves filenames without .pdf unchanged', () => {
      expect(stripPdfExtension('document')).toBe('document');
      expect(stripPdfExtension('document.txt')).toBe('document.txt');
      expect(stripPdfExtension('pdf-document')).toBe('pdf-document');
    });

    it('handles empty or whitespace strings', () => {
      expect(stripPdfExtension('')).toBe('');
      expect(stripPdfExtension('   ')).toBe('');
    });
  });

  describe('ensurePdfExtension', () => {
    it('appends .pdf if missing', () => {
      expect(ensurePdfExtension('document')).toBe('document.pdf');
    });

    it('normalizes uppercase or mixed-case .PDF extensions to .pdf', () => {
      expect(ensurePdfExtension('document.PDF')).toBe('document.pdf');
      expect(ensurePdfExtension('document.Pdf')).toBe('document.pdf');
    });

    it('does not duplicate .pdf if already present', () => {
      expect(ensurePdfExtension('document.pdf')).toBe('document.pdf');
      expect(ensurePdfExtension('document.pdf.pdf')).toBe('document.pdf');
    });

    it('falls back to default fallback name if empty', () => {
      expect(ensurePdfExtension('', 'fallback.pdf')).toBe('fallback.pdf');
      expect(ensurePdfExtension('   ', 'fallback.pdf')).toBe('fallback.pdf');
    });
  });

  describe('extractBaseName', () => {
    it('extracts base name from file with extension', () => {
      expect(extractBaseName('invoice.pdf')).toBe('invoice');
      expect(extractBaseName('photo.jpeg')).toBe('photo');
    });

    it('preserves dots within the filename', () => {
      expect(extractBaseName('report.v1.final.pdf')).toBe('report.v1.final');
      expect(extractBaseName('backup.2024.09.12.pdf')).toBe('backup.2024.09.12');
    });

    it('handles filenames without extensions', () => {
      expect(extractBaseName('unnamed')).toBe('unnamed');
    });

    it('returns empty string for null, undefined, or empty', () => {
      expect(extractBaseName(undefined)).toBe('');
      expect(extractBaseName('')).toBe('');
      expect(extractBaseName('   ')).toBe('');
    });
  });

  describe('getDefaultDownloadFilename', () => {
    it('derives sensible default from original file for single-file tools', () => {
      expect(getDefaultDownloadFilename('split', 'contract.pdf')).toBe('contract-split.pdf');
      expect(getDefaultDownloadFilename('reorder', 'contract.pdf')).toBe('contract-reordered.pdf');
      expect(getDefaultDownloadFilename('rotate', 'contract.pdf')).toBe('contract-rotated.pdf');
      expect(getDefaultDownloadFilename('compress', 'contract.pdf')).toBe('contract-compressed.pdf');
    });

    it('derives default for merge from primary file name', () => {
      expect(getDefaultDownloadFilename('merge', 'chapter1.pdf')).toBe('chapter1-merged.pdf');
    });

    it('returns static default for images-to-pdf or when originalFilename is absent', () => {
      expect(getDefaultDownloadFilename('images-to-pdf')).toBe('images.pdf');
      expect(getDefaultDownloadFilename('merge')).toBe('merged.pdf');
      expect(getDefaultDownloadFilename('split')).toBe('split.pdf');
      expect(getDefaultDownloadFilename('reorder')).toBe('reordered.pdf');
      expect(getDefaultDownloadFilename('rotate')).toBe('rotated.pdf');
      expect(getDefaultDownloadFilename('compress')).toBe('compressed.pdf');
    });

    it('handles files with multiple periods and complex names', () => {
      expect(getDefaultDownloadFilename('reorder', 'Q3.Financial.Statement.2024.pdf')).toBe('Q3.Financial.Statement.2024-reordered.pdf');
    });

    it('handles non-ASCII Unicode original filenames', () => {
      expect(getDefaultDownloadFilename('rotate', '日本語の請求書.pdf')).toBe('日本語の請求書-rotated.pdf');
      expect(getDefaultDownloadFilename('compress', 'résumé.pdf')).toBe('résumé-compressed.pdf');
      expect(getDefaultDownloadFilename('merge', 'Документ.pdf')).toBe('Документ-merged.pdf');
    });

    it('sanitizes illegal path chars in original name when constructing default', () => {
      expect(getDefaultDownloadFilename('rotate', '../../malicious.pdf')).toBe('malicious-rotated.pdf');
    });
  });

  describe('getSplitDefaultFilename', () => {
    it('generates 1-based numbered names with -split- for multiple outputs', () => {
      expect(getSplitDefaultFilename({ originalFilename: 'invoice.pdf', index: 1, totalOutputs: 3 })).toBe('invoice-split-1.pdf');
      expect(getSplitDefaultFilename({ originalFilename: 'invoice.pdf', index: 2, totalOutputs: 3 })).toBe('invoice-split-2.pdf');
      expect(getSplitDefaultFilename({ originalFilename: 'invoice.pdf', index: 3, totalOutputs: 3 })).toBe('invoice-split-3.pdf');
    });

    it('generates single split name when totalOutputs is 1 and no customBase is set', () => {
      expect(getSplitDefaultFilename({ originalFilename: 'invoice.pdf', index: 1, totalOutputs: 1 })).toBe('invoice-split.pdf');
    });

    it('applies customBaseName without -split- when supplied', () => {
      expect(getSplitDefaultFilename({ customBaseName: 'Quarterly Report', index: 1, totalOutputs: 3 })).toBe('Quarterly Report-1.pdf');
      expect(getSplitDefaultFilename({ customBaseName: 'Quarterly Report', index: 2, totalOutputs: 3 })).toBe('Quarterly Report-2.pdf');
      expect(getSplitDefaultFilename({ customBaseName: 'Quarterly Report', index: 3, totalOutputs: 3 })).toBe('Quarterly Report-3.pdf');
    });

    it('handles customBaseName ending in .pdf without duplicating extension', () => {
      expect(getSplitDefaultFilename({ customBaseName: 'Quarterly Report.pdf', index: 1, totalOutputs: 3 })).toBe('Quarterly Report-1.pdf');
      expect(getSplitDefaultFilename({ customBaseName: 'Quarterly Report.pdf', index: 2, totalOutputs: 3 })).toBe('Quarterly Report-2.pdf');
    });

    it('falls back to split-1.pdf if both originalFilename and customBaseName are missing', () => {
      expect(getSplitDefaultFilename({ index: 1, totalOutputs: 2 })).toBe('split-1.pdf');
    });
  });

  describe('prepareSafeDownloadFilename & sanitization security', () => {
    it('ensures .pdf extension is always present', () => {
      expect(prepareSafeDownloadFilename('my-document')).toBe('my-document.pdf');
      expect(prepareSafeDownloadFilename('my-document.pdf')).toBe('my-document.pdf');
      expect(prepareSafeDownloadFilename('my-document.PDF')).toBe('my-document.pdf');
      expect(prepareSafeDownloadFilename('my-document.pdf.pdf')).toBe('my-document.pdf');
    });

    it('prevents directory traversal attacks (../, ..\\)', () => {
      expect(prepareSafeDownloadFilename('../../secret.pdf')).toBe('secret.pdf');
      expect(prepareSafeDownloadFilename('..\\..\\passwords.pdf')).toBe('passwords.pdf');
      expect(prepareSafeDownloadFilename('/etc/shadow.pdf')).toBe('shadow.pdf');
      expect(prepareSafeDownloadFilename('C:\\Windows\\System32\\cmd.pdf')).toBe('cmd.pdf');
    });

    it('neutralizes illegal OS filesystem characters (< > : " | ? *)', () => {
      expect(prepareSafeDownloadFilename('file:name*with?illegal<chars>.pdf')).toBe('file_name_with_illegal_chars.pdf');
      expect(prepareSafeDownloadFilename('test|pipe"quote*star?question.pdf')).toBe('test_pipe_quote_star_question.pdf');
    });

    it('neutralizes ASCII control characters (0x00 - 0x1F, 0x7F)', () => {
      expect(prepareSafeDownloadFilename('hidden\x00byte\x1fname\x7f.pdf')).toBe('hidden_byte_name.pdf');
    });

    it('protects Windows reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)', () => {
      expect(prepareSafeDownloadFilename('CON.pdf')).toBe('_CON.pdf');
      expect(prepareSafeDownloadFilename('con')).toBe('_con.pdf');
      expect(prepareSafeDownloadFilename('prn.pdf')).toBe('_prn.pdf');
      expect(prepareSafeDownloadFilename('aux.pdf')).toBe('_aux.pdf');
      expect(prepareSafeDownloadFilename('NUL.pdf')).toBe('_NUL.pdf');
      expect(prepareSafeDownloadFilename('COM1.pdf')).toBe('_COM1.pdf');
      expect(prepareSafeDownloadFilename('com9.pdf')).toBe('_com9.pdf');
      expect(prepareSafeDownloadFilename('LPT1.pdf')).toBe('_LPT1.pdf');
      expect(prepareSafeDownloadFilename('lpt9.pdf')).toBe('_lpt9.pdf');
    });

    it('falls back to safe default if user enters completely empty or invalid input', () => {
      expect(prepareSafeDownloadFilename('', 'fallback.pdf')).toBe('fallback.pdf');
      expect(prepareSafeDownloadFilename('   ', 'default-doc.pdf')).toBe('default-doc.pdf');
      expect(prepareSafeDownloadFilename('...', 'document.pdf')).toBe('document.pdf');
      expect(prepareSafeDownloadFilename('///', 'document.pdf')).toBe('document.pdf');
    });

    it('truncates excessively long filenames to 255 characters', () => {
      const longName = 'a'.repeat(300);
      const safe = prepareSafeDownloadFilename(longName);
      expect(safe.length).toBeLessThanOrEqual(255);
      expect(safe.endsWith('.pdf')).toBe(true);
    });

    it('preserves international UTF-8 and accented characters', () => {
      expect(prepareSafeDownloadFilename('Müller & Söhne 2024.pdf')).toBe('Müller & Söhne 2024.pdf');
      expect(prepareSafeDownloadFilename('日本語_確定申告.pdf')).toBe('日本語_確定申告.pdf');
      expect(prepareSafeDownloadFilename('Финансовый_отчет.pdf')).toBe('Финансовый_отчет.pdf');
    });

    it('exposes re-exported sanitizeDownloadFilename directly', () => {
      expect(sanitizeDownloadFilename('report.pdf')).toBe('report.pdf');
    });
  });
});

interface MockAnchor {
  href: string;
  download: string;
  style: Record<string, string>;
  click: () => void;
}

describe('Phase 11: Browser Download Mechanics (downloadPdfBytes)', () => {
  let createdUrls: string[] = [];
  let revokedUrls: string[] = [];
  let appendedElements: unknown[] = [];
  let clickedElements: MockAnchor[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    createdUrls = [];
    revokedUrls = [];
    appendedElements = [];
    clickedElements = [];

    // Mock URL.createObjectURL and URL.revokeObjectURL
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((blob: Blob) => {
        expect(blob.type).toBe('application/pdf');
        const url = `blob:http://localhost/test-${Math.random().toString(36).slice(2)}`;
        createdUrls.push(url);
        return url;
      }),
      revokeObjectURL: vi.fn((url: string) => {
        revokedUrls.push(url);
      }),
    });

    // Mock document
    const mockBody = {
      appendChild: vi.fn((node: unknown) => {
        appendedElements.push(node);
        return node;
      }),
      removeChild: vi.fn((node: unknown) => {
        const idx = appendedElements.indexOf(node);
        if (idx !== -1) appendedElements.splice(idx, 1);
        return node;
      }),
      contains: vi.fn((node: unknown) => appendedElements.includes(node)),
    };

    vi.stubGlobal('document', {
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'a') {
          const el: MockAnchor = {
            href: '',
            download: '',
            style: {},
            click: vi.fn(function(this: MockAnchor) {
              clickedElements.push(this);
            }),
          };
          return el;
        }
        return {};
      }),
      body: mockBody,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('triggers browser download with sanitized filename, proper MIME type, and revokes object URL', () => {
    const validPdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]); // %PDF-1.5
    downloadPdfBytes(validPdfHeader, 'My Report.pdf');

    expect(createdUrls.length).toBe(1);
    expect(clickedElements.length).toBe(1);

    const clickedLink = clickedElements[0];
    expect(clickedLink.download).toBe('My Report.pdf');
    expect(clickedLink.href).toBe(createdUrls[0]);

    // Advance timers to trigger cleanup
    vi.advanceTimersByTime(1000);

    // Element must be cleanly removed from DOM
    expect(appendedElements.length).toBe(0);

    // Object URL must be revoked
    expect(revokedUrls).toContain(createdUrls[0]);
  });

  it('sanitizes hazardous filename before setting anchor download attribute', () => {
    const validPdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]); // %PDF-1.5
    downloadPdfBytes(validPdfHeader, '../../evil:name?.pdf.pdf');

    expect(clickedElements.length).toBe(1);
    const clickedLink = clickedElements[0];
    expect(clickedLink.download).toBe('evil_name.pdf');
  });
});

describe('Phase 11: DownloadResultDocket Component Rendering', () => {
  const samplePdfBytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]);

  it('renders single-output docket with architectural styling, filename input, and .pdf badge', () => {
    const singleOutput: OutputFileItem = {
      id: 'output-1',
      pdfBytes: samplePdfBytes,
      defaultFilename: 'invoice-merged.pdf',
      byteSize: 2048,
    };

    const html = renderToString(
      <DownloadResultDocket
        outputs={[singleOutput]}
        toolName="Merged PDF Document"
        toolIdentifier="[DISCHARGE // MERGED DOCUMENT]"
      />
    );

    // Section container with accessible label
    expect(html).toContain('aria-label="Document discharge docket"');

    // Tool identifier
    expect(html).toContain('[DISCHARGE // MERGED DOCUMENT]');

    // Input field with stripped base name
    expect(html).toContain('value="invoice-merged"');

    // Non-editable .pdf extension badge
    expect(html).toContain('.pdf');

    // Download button
    expect(html).toContain('Download PDF');

    // Target designation preview
    expect(html).toContain('invoice-merged.pdf');
  });

  it('renders multi-output ledger for split tool batches', () => {
    const multiOutputs: OutputFileItem[] = [
      {
        id: 'split-1',
        pdfBytes: samplePdfBytes,
        defaultFilename: 'contract-split-1.pdf',
        label: 'Pages 1-3',
        pageCount: 3,
        byteSize: 1024,
      },
      {
        id: 'split-2',
        pdfBytes: samplePdfBytes,
        defaultFilename: 'contract-split-2.pdf',
        label: 'Pages 4-6',
        pageCount: 3,
        byteSize: 1024,
      },
    ];

    const html = renderToString(
      <DownloadResultDocket
        outputs={multiOutputs}
        toolName="Split Document"
        toolIdentifier="[TOOL // 02 · RANGE SEPARATOR]"
        isSplitBatch={true}
      />
    );

    // Batch discharge docket accessible label
    expect(html).toContain('aria-label="Split batch discharge docket"');

    // Manifest title and item count
    expect(html).toContain('Split Output Manifest');
    expect(html).toContain('FILES READY');

    // Batch prefix input for 1-based numbering
    expect(html).toContain('id="batch-prefix-input"');
    expect(html).toContain('Apply to All');

    // Individual item rows with 1-based identifiers
    expect(html).toMatch(/\[<!-- -->01<!-- -->\]|\[01\]/);
    expect(html).toMatch(/\[<!-- -->02<!-- -->\]|\[02\]/);
    expect(html).toContain('value="contract-split-1"');
    expect(html).toContain('value="contract-split-2"');

    // Download All button
    expect(html).toContain('Download All');
    expect(html).toContain('2 Documents');
  });
});
