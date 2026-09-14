import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyPage } from '@/pages/Privacy/PrivacyPage';

describe('PrivacyPage Refinement (Phase 14D.1)', () => {
  it('does NOT contain the removed "What happens to your file?" process section', () => {
    const html = renderToString(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>
    );

    expect(html).not.toContain('What happens to your file?');
    expect(html).not.toContain('01 SELECT');
    expect(html).not.toContain('02 PROCESS LOCALLY');
    expect(html).not.toContain('03 RESULT');
    expect(html).not.toContain('04 DOWNLOAD');
  });

  it('renders redesigned Technical Details with 5 privacy items and status badges', () => {
    const html = renderToString(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>
    );

    // Section header & subtitle
    expect(html).toContain('Technical details');
    expect(html).toContain('A closer look at how PDFly handles your data.');
    expect(html).toContain('PRIVACY MODEL · LOCAL-FIRST');

    // Visual local signal
    expect(html).toContain('YOUR BROWSER');
    expect(html).toContain('Local document processing');

    // Item 1: Document Processing
    expect(html).toContain('DOCUMENT PROCESSING');
    expect(html).toContain('Runs locally in volatile browser memory on your device.');
    expect(html).toContain('LOCAL');

    // Item 2: Remote Storage
    expect(html).toContain('REMOTE STORAGE');
    expect(html).toContain('PDFly does not operate document-storage servers or databases for uploaded files.');
    expect(html).toContain('NONE');

    // Item 3: Browser Storage
    expect(html).toContain('BROWSER STORAGE');
    expect(html).toContain('pdfly_theme_preference');
    expect(html).toContain('localStorage');

    // Item 4: Network Requests
    expect(html).toContain('NETWORK REQUESTS');
    expect(html).toContain('STATIC ONLY');
    expect(html).toContain('Limited to downloading static website assets');

    // Item 5: Tracking & Telemetry
    expect(html).toContain('TRACKING &amp; TELEMETRY');
    expect(html).toContain('No third-party analytics, tracking pixels, session recorders, or advertising networks.');
  });

  it('preserves existing core Privacy page sections', () => {
    const html = renderToString(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>
    );

    // Hero
    expect(html).toContain('Your files stay with you.');
    expect(html).toContain('LOCAL PROCESSING · ZERO SERVER UPLOADS');

    // Privacy by design
    expect(html).toContain('Privacy by design');

    // Why privacy matters
    expect(html).toContain('Why privacy matters');

    // Does / doesn't
    expect(html).toContain('What PDFly does and doesn&#x27;t do');
    expect(html).toContain('PDFly does');
    expect(html).toContain('PDFly doesn&#x27;t');

    // Closing CTA
    expect(html).toContain('Work privately with your PDFs');
    expect(html).toContain('Explore PDF Tools');
  });
});
