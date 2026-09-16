import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { MobileQuickTools } from '@/components/common/MobileQuickTools';
import { POPULAR_TOOL_IDS, TOOL_MAP } from '@/constants/tools';

describe('MobileQuickTools Component', () => {
  it('renders the floating action button with correct accessibility label and responsive visibility', () => {
    const html = renderToString(
      <MemoryRouter>
        <MobileQuickTools />
      </MemoryRouter>
    );

    // Initial closed state accessibility
    expect(html).toContain('aria-label="Open popular tools"');
    expect(html).toContain('aria-haspopup="true"');
    expect(html).toContain('aria-expanded="false"');

    // Fixed positioning and breakpoint visibility
    expect(html).toContain('fixed');
    expect(html).toContain('lg:hidden');
    expect(html).toContain('z-30');
    expect(html).toContain('safe-area-inset-bottom');
  });

  it('references all six popular tools in the exact designated order', () => {
    const tools = POPULAR_TOOL_IDS.map((id) => TOOL_MAP[id]);
    expect(tools.map((t) => t.name)).toEqual([
      'Images to PDF',
      'PDF to Images',
      'Merge PDF',
      'Compress PDF',
      'Split PDF',
      'Sign PDF',
    ]);
    expect(tools.map((t) => `/tools/${t.slug}`)).toEqual([
      '/tools/images-to-pdf',
      '/tools/pdf-to-images',
      '/tools/merge',
      '/tools/compress',
      '/tools/split',
      '/tools/sign',
    ]);
  });
});

