import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ProtectToolPage } from '@/pages/tools/ProtectToolPage';
import { TOOLS } from '@/constants/tools';
import { ROUTES } from '@/constants/routes';

describe('ProtectToolPage Component', () => {
  it('renders page header, mode toggle, dropzone, and security assurances', () => {
    const html = renderToString(
      <MemoryRouter>
        <ProtectToolPage />
      </MemoryRouter>
    );

    expect(html).toContain('Protect PDF');
    expect(html).toContain('Password-protect your PDF document with industry-standard AES-256 encryption');
    expect(html).toContain('Select or drop a PDF to protect or unlock');
    expect(html).toContain('100% Client-Side Encryption');
    expect(html).toContain('Zero Network Transmission');
  });
});

describe('Protect Tool Catalog Registration', () => {
  it('registers protect tool in TOOLS list with correct route, category, and metadata', () => {
    const protectTool = TOOLS.find((t) => t.id === 'protect');
    expect(protectTool).toBeDefined();
    expect(protectTool?.name).toBe('Protect PDF');
    expect(protectTool?.slug).toBe('protect');
    expect(protectTool?.category).toBe('security');
    expect(protectTool?.badge).toBe('New');
    expect(ROUTES.TOOL_PROTECT).toBe('/tools/protect');
  });
});
