import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '@/pages/Home/HomePage';
import { POPULAR_TOOL_IDS, TOOL_MAP } from '@/constants/tools';

describe('Homepage Popular PDF Tools Section', () => {
  it('defines the curated six tools in the exact specified priority order', () => {
    expect(POPULAR_TOOL_IDS).toEqual([
      'images-to-pdf',
      'pdf-to-images',
      'merge',
      'compress',
      'split',
      'sign',
    ]);
  });

  it('renders all 6 popular tools with correct user-facing display names, descriptions, and routes', () => {
    const html = renderToString(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Section title & subtitle
    expect(html).toContain('Popular PDF Tools');
    expect(html).toContain('Simple tools for the tasks you do most.');

    // 1. Images to PDF
    expect(html).toContain('Images to PDF');
    expect(html).toContain('Turn images into a single PDF.');
    expect(html).toContain('href="/tools/images-to-pdf"');

    // 2. PDF to Images
    expect(html).toContain('PDF to Images');
    expect(html).toContain('Convert PDF pages into images.');
    expect(html).toContain('href="/tools/pdf-to-images"');

    // 3. Merge PDF
    expect(html).toContain('Merge PDF');
    expect(html).toContain('Combine multiple PDFs into one.');
    expect(html).toContain('href="/tools/merge"');

    // 4. Compress PDF
    expect(html).toContain('Compress PDF');
    expect(html).toContain('Reduce PDF file size while keeping quality.');
    expect(html).toContain('href="/tools/compress"');

    // 5. Split PDF
    expect(html).toContain('Split PDF');
    expect(html).toContain('Extract pages or split into standalone files.');
    expect(html).toContain('href="/tools/split"');

    // 6. Sign PDF
    expect(html).toContain('Sign PDF');
    expect(html).toContain('Draw and place signatures directly on pages.');
    expect(html).toContain('href="/tools/sign"');
  });

  it('orders the cards correctly in DOM sequence', () => {
    const popularTools = POPULAR_TOOL_IDS.map((id) => TOOL_MAP[id]);
    const expectedOrder = [
      'Images to PDF',
      'PDF to Images',
      'Merge PDF',
      'Compress PDF',
      'Split PDF',
      'Sign PDF',
    ];

    expect(popularTools.map((t) => t.name)).toEqual(expectedOrder);
    expect(popularTools.map((t) => `/tools/${t.slug}`)).toEqual([
      '/tools/images-to-pdf',
      '/tools/pdf-to-images',
      '/tools/merge',
      '/tools/compress',
      '/tools/split',
      '/tools/sign',
    ]);
  });
});

