import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { WatermarkLivePreview } from '@/components/pdf/WatermarkLivePreview';
import { WatermarkToolPage } from '@/pages/tools/WatermarkToolPage';
import type { RenderPagePreviewResult } from '@/lib/pdf/rendering/thumbnail';

describe('Watermark Live Preview Component', () => {
  const mockPreviewResult: RenderPagePreviewResult = {
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    pageWidth: 595.28,
    pageHeight: 841.89,
    renderedWidth: 420,
    renderedHeight: 593.73,
  };

  it('renders prompt state when no pagePreview is provided', () => {
    const html = renderToString(
      <WatermarkLivePreview
        pagePreview={null}
        loading={false}
        error={null}
        currentPage={1}
        totalPages={null}
        watermarkText="CONFIDENTIAL"
        position="center"
        rotation="diagonal"
        opacity={0.25}
        fontSize={48}
      />
    );

    expect(html).toContain('Select a PDF to view watermark preview');
    expect(html).toContain('Live Preview');
  });

  it('renders loading state when loading is true and no preview yet', () => {
    const html = renderToString(
      <WatermarkLivePreview
        pagePreview={null}
        loading={true}
        error={null}
        currentPage={1}
        totalPages={null}
        watermarkText="CONFIDENTIAL"
        position="center"
        rotation="diagonal"
        opacity={0.25}
        fontSize={48}
      />
    );

    expect(html).toContain('Loading document preview');
  });

  it('renders error message when preview generation fails', () => {
    const html = renderToString(
      <WatermarkLivePreview
        pagePreview={null}
        loading={false}
        error="Corrupt PDF structure"
        currentPage={1}
        totalPages={null}
        watermarkText="CONFIDENTIAL"
        position="center"
        rotation="diagonal"
        opacity={0.25}
        fontSize={48}
      />
    );

    expect(html).toContain('Preview unavailable');
    expect(html).toContain('Corrupt PDF structure');
  });

  it('renders watermark overlay and preview image when pagePreview is provided', () => {
    const html = renderToString(
      <WatermarkLivePreview
        pagePreview={mockPreviewResult}
        loading={false}
        error={null}
        currentPage={1}
        totalPages={3}
        watermarkText="DRAFT NOTICE"
        position="center"
        rotation="diagonal"
        opacity={0.3}
        fontSize={48}
        onPageChange={vi.fn()}
      />
    );

    expect(html).toContain('DRAFT NOTICE');
    expect(html).toContain('alt="Page 1 of document"');
    expect(html).toContain('rotate(-45deg)');
    expect(html).toContain('1 / 3');
    expect(html).toContain('Real-time layout sync');
    expect(html).toContain('30% opacity • 48 pt');
  });

  it('correctly sets styles for horizontal top position', () => {
    const html = renderToString(
      <WatermarkLivePreview
        pagePreview={mockPreviewResult}
        loading={false}
        error={null}
        currentPage={1}
        totalPages={1}
        watermarkText="TOP HEADER"
        position="top"
        rotation="horizontal"
        opacity={0.5}
        fontSize={36}
      />
    );

    expect(html).toContain('TOP HEADER');
    expect(html).toContain('Horizontal · TOP');
    // 100 / 841.89 * 100 ≈ 11.878%
    expect(html).toContain('top:11.878');
    expect(html).not.toContain('rotate(-45deg)');
  });

  it('correctly sets styles for horizontal bottom position', () => {
    const html = renderToString(
      <WatermarkLivePreview
        pagePreview={mockPreviewResult}
        loading={false}
        error={null}
        currentPage={1}
        totalPages={1}
        watermarkText="BOTTOM FOOTER"
        position="bottom"
        rotation="horizontal"
        opacity={0.4}
        fontSize={32}
      />
    );

    expect(html).toContain('BOTTOM FOOTER');
    expect(html).toContain('Horizontal · BOTTOM');
    // bottom: 100 / 841.89 * 100 ≈ 11.878%
    expect(html).toContain('bottom:11.878');
  });

  it('falls back to SAMPLE when watermark text is empty string', () => {
    const html = renderToString(
      <WatermarkLivePreview
        pagePreview={mockPreviewResult}
        loading={false}
        error={null}
        currentPage={1}
        totalPages={1}
        watermarkText="   "
        position="center"
        rotation="diagonal"
        opacity={0.2}
        fontSize={40}
      />
    );

    expect(html).toContain('SAMPLE');
  });
});

describe('WatermarkToolPage Initial State', () => {
  it('renders dropzone, tool title, and assurance cards', () => {
    const html = renderToString(
      <MemoryRouter>
        <WatermarkToolPage />
      </MemoryRouter>
    );

    expect(html).toContain('Watermark PDF');
    expect(html).toContain('Select or drop a PDF document to watermark');
    expect(html).toContain('100% Client-Side Stamping');
    expect(html).toContain('Live Layout Preview');
  });
});

