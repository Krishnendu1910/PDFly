import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProcessingOverlay } from '@/components/pdf/ProcessingOverlay';
import { FileCard } from '@/components/file/FileCard';
import type { ManagedFile } from '@/types/file';

describe('Accessibility & UX Polish: ProcessingOverlay', () => {
  it('does not render anything when isOpen is false', () => {
    const html = renderToString(
      <ProcessingOverlay isOpen={false} title="Processing..." />
    );
    expect(html).toBe('');
  });

  it('renders accessible dialog container with ARIA relationships when open', () => {
    const html = renderToString(
      <ProcessingOverlay
        isOpen={true}
        title="Merging PDF documents..."
        subtitle="Combining pages into your output document locally."
      />
    );

    // Dialog role and modal attribute
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');

    // Title and status linkages
    expect(html).toContain('aria-labelledby="processing-overlay-title"');
    expect(html).toContain('aria-describedby="processing-overlay-status"');
    expect(html).toContain('id="processing-overlay-title"');
    expect(html).toContain('id="processing-overlay-status"');

    // Polite live region for status announcements
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Merging PDF documents...');
    expect(html).toContain('Combining pages into your output document locally.');
  });

  it('renders honest indeterminate status when progressPercent is 0 or undefined', () => {
    const html = renderToString(
      <ProcessingOverlay
        isOpen={true}
        title="Preparing images..."
        subtitle="Reading input files..."
        progressPercent={0}
      />
    );

    // Indeterminate status indicator with aria-busy
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Working...');

    // Must NOT display a determinate progressbar or fake percentage
    expect(html).not.toContain('role="progressbar"');
    expect(html).not.toContain('0%');
  });

  it('renders determinate progressbar with accurate ARIA values when progressPercent > 0', () => {
    const html = renderToString(
      <ProcessingOverlay
        isOpen={true}
        title="Reordering pages..."
        subtitle="Reordering pages (60%)..."
        progressPercent={60}
      />
    );

    // Determinate progressbar attributes
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="60"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-label="Reordering pages..."');
    expect(html).toContain('60%');
    expect(html).toContain('style="width:60%"');

    // Does not render indeterminate status
    expect(html).not.toContain('Working...');
  });

  it('clamps progress percentages cleanly between 0 and 100', () => {
    const htmlOver = renderToString(
      <ProcessingOverlay
        isOpen={true}
        title="Compressing..."
        progressPercent={150}
      />
    );
    expect(htmlOver).toContain('aria-valuenow="100"');
    expect(htmlOver).toContain('100%');
    expect(htmlOver).toContain('style="width:100%"');
  });

  it('includes motion-reduce classes to respect prefers-reduced-motion', () => {
    const html = renderToString(
      <ProcessingOverlay
        isOpen={true}
        title="Loading..."
        progressPercent={50}
      />
    );
    expect(html).toContain('motion-reduce:animate-none');
    expect(html).toContain('motion-reduce:transition-none');
  });

  it('exposes tabindex="-1" on outer dialog container to capture initial keyboard focus', () => {
    const html = renderToString(
      <ProcessingOverlay isOpen={true} title="Processing..." />
    );
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });
});

describe('Accessibility & Touch Polish: FileCard', () => {
  const mockFile: ManagedFile = {
    id: 'runtime-id-123',
    fingerprint: 'fp-123',
    file: new File([new Uint8Array(1024)], 'Quarterly_Report_2024.pdf', {
      type: 'application/pdf',
      lastModified: 1700000000000,
    }),
    name: 'Quarterly_Report_2024.pdf',
    size: 1024,
    formattedSize: '1.0 KB',
    type: 'application/pdf',
    extension: '.pdf',
    lastModified: 1700000000000,
    status: 'ready',
  };

  it('provides accessible names for all interactive control buttons', () => {
    const html = renderToString(
      <FileCard
        file={mockFile}
        index={0}
        totalFiles={2}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
      />
    );

    // Sequence indicator has accessible label
    expect(html).toContain('aria-label="File 1 of 2"');

    // Move buttons have descriptive accessible names
    expect(html).toContain('aria-label="Move Quarterly_Report_2024.pdf up"');
    expect(html).toContain('aria-label="Move Quarterly_Report_2024.pdf down"');

    // Remove button has descriptive accessible name
    expect(html).toContain('aria-label="Remove Quarterly_Report_2024.pdf"');
  });

  it('enforces touch target dimensions on interactive buttons', () => {
    const html = renderToString(
      <FileCard
        file={mockFile}
        index={0}
        totalFiles={2}
        onRemove={() => {}}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
      />
    );

    // Min touch target classes
    expect(html).toContain('min-w-[36px]');
    expect(html).toContain('min-h-[36px]');
    expect(html).toContain('min-w-[40px]');
    expect(html).toContain('min-h-[40px]');
  });
});
