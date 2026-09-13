import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DownloadResultDocket, type OutputFileItem } from '@/components/download';
import { PdfPreviewModal } from '@/components/preview';
import { getHardenedDocumentOptions } from '@/lib/pdf/rendering/pdfjs-config';

describe('Universal PDF Result Preview & Discharge Workflow', () => {
  const samplePdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // %PDF-1.7

  describe('DownloadResultDocket Single-Output Mode Preview & Back Integration', () => {
    const singleOutput: OutputFileItem = {
      id: 'output-single-1',
      pdfBytes: samplePdfBytes,
      defaultFilename: 'document-merged.pdf',
      byteSize: 4096,
    };

    it('renders Preview PDF button and Back to Editing button when configured', () => {
      const onBackToEditing = vi.fn();

      const html = renderToString(
        <DownloadResultDocket
          outputs={[singleOutput]}
          toolName="Merged Document"
          toolIdentifier="[TOOL // 01 · SHEET STACKER]"
          onBackToEditing={onBackToEditing}
        />
      );

      // Verify Back to Editing button
      expect(html).toContain('Back to Editing');

      // Verify Preview PDF button
      expect(html).toContain('Preview PDF');

      // Verify Download PDF button remains intact
      expect(html).toContain('Download PDF');
    });

    it('omits Back to Editing button if onBackToEditing callback is not provided', () => {
      const html = renderToString(
        <DownloadResultDocket
          outputs={[singleOutput]}
          toolName="Merged Document"
        />
      );

      expect(html).not.toContain('Back to Editing');
      expect(html).toContain('Preview PDF');
      expect(html).toContain('Download PDF');
    });

    it('renders Process Another Document when onReset is supplied', () => {
      const onReset = vi.fn();
      const html = renderToString(
        <DownloadResultDocket
          outputs={[singleOutput]}
          toolName="Merged Document"
          onReset={onReset}
        />
      );

      expect(html).toContain('Process Another Document');
    });
  });

  describe('DownloadResultDocket Multi-Output (Split Batch) Mode Integration', () => {
    const multiOutputs: OutputFileItem[] = [
      {
        id: 'split-out-1',
        pdfBytes: samplePdfBytes,
        defaultFilename: 'invoice-split-1.pdf',
        label: 'Pages 1–2',
        pageCount: 2,
        byteSize: 2048,
      },
      {
        id: 'split-out-2',
        pdfBytes: samplePdfBytes,
        defaultFilename: 'invoice-split-2.pdf',
        label: 'Pages 3–4',
        pageCount: 2,
        byteSize: 2048,
      },
    ];

    it('renders individual Preview button for each output item in the manifest', () => {
      const html = renderToString(
        <DownloadResultDocket
          outputs={multiOutputs}
          toolName="Split Document"
          toolIdentifier="[TOOL // 02 · RANGE SEPARATOR]"
          isSplitBatch={true}
          onBackToEditing={vi.fn()}
        />
      );

      // Global Back to Editing button
      expect(html).toContain('Back to Editing');

      // Individual Preview buttons (at least 2 for 2 items)
      const previewMatches = html.match(/Preview/g) || [];
      expect(previewMatches.length).toBeGreaterThanOrEqual(2);

      // Individual Download buttons
      expect(html).toContain('Download');

      // Download All button preserved
      expect(html).toContain('Download All');
    });
  });

  describe('PdfPreviewModal Component Architecture & Usability', () => {
    it('does not render when isOpen is false', () => {
      const html = renderToString(
        <PdfPreviewModal
          isOpen={false}
          onClose={vi.fn()}
          pdfBytes={samplePdfBytes}
          filename="test.pdf"
          onDownload={vi.fn()}
        />
      );

      expect(html).toBe('');
    });

    it('renders full accessible preview modal chrome when open', () => {
      const html = renderToString(
        <PdfPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          pdfBytes={samplePdfBytes}
          filename="quarterly-report.pdf"
          onDownload={vi.fn()}
          onBackToEditing={vi.fn()}
          toolName="Merged PDF"
        />
      );

      // Accessible modal dialog
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-label="Generated PDF Preview"');

      // Filename and tool identifier
      expect(html).toContain('quarterly-report.pdf');
      expect(html).toContain('[PREVIEW // MERGED PDF]');

      // Navigation & zoom controls
      expect(html).toContain('aria-label="Previous page"');
      expect(html).toContain('aria-label="Next page"');
      expect(html).toContain('aria-label="Zoom in"');
      expect(html).toContain('aria-label="Zoom out"');
      expect(html).toContain('aria-label="Reset zoom to 100%"');

      // Action buttons
      expect(html).toContain('Back to Editing');
      expect(html).toContain('Download PDF');
      expect(html).toContain('aria-label="Close preview"');
    });

    it('renders fallback Back to Editing on mobile view', () => {
      const html = renderToString(
        <PdfPreviewModal
          isOpen={true}
          onClose={vi.fn()}
          pdfBytes={samplePdfBytes}
          filename="test.pdf"
          onDownload={vi.fn()}
          onBackToEditing={vi.fn()}
        />
      );

      expect(html).toContain('Back to Editing');
    });
  });

  describe('Security Hardening Options', () => {
    it('enforces hardened PDF.js execution settings (no eval, no embedded scripts)', () => {
      const options = getHardenedDocumentOptions(samplePdfBytes);

      expect(options.isEvalSupported).toBe(false);
      expect(options.enableScripting).toBe(false);
      expect(options.disableStream).toBe(true);
      expect(options.disableAutoFetch).toBe(true);
    });
  });
});

