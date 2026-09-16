import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  parseTargetSizeBytes,
  compressPdfDocument,
} from '@/lib/pdf/compression';
import { CompressionModeSelector } from '@/components/compression/CompressionModeSelector';
import { CompressionStatsCard } from '@/components/compression/CompressionStatsCard';
import type { CompressionResult } from '@/lib/pdf/compression/types';

// Helper to create a clean test PDF
async function createTestPdf(pageCount = 2): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([595, 842]);
    page.drawText(`PDFly Target Compression Test Page ${i + 1}`, {
      x: 50,
      y: 750,
      size: 16,
      color: rgb(0.2, 0.2, 0.2),
    });
  }
  return doc.save();
}

describe('Target Size Parsing & Binary Math (parseTargetSizeBytes)', () => {
  it('converts standard integer values using binary unit math (1024 base)', () => {
    // 500 KB = 500 * 1024 = 512,000 bytes
    const kbRes = parseTargetSizeBytes('500', 'KB');
    expect(kbRes.error).toBeNull();
    expect(kbRes.bytes).toBe(512000);

    // 2 MB = 2 * 1024 * 1024 = 2,097,152 bytes
    const mbRes = parseTargetSizeBytes('2', 'MB');
    expect(mbRes.error).toBeNull();
    expect(mbRes.bytes).toBe(2097152);

    // 1 GB = 1 * 1024 * 1024 * 1024 = 1,073,741,824 bytes
    const gbRes = parseTargetSizeBytes('1', 'GB');
    expect(gbRes.error).toBeNull();
    expect(gbRes.bytes).toBe(1073741824);
  });

  it('accurately parses decimal numbers', () => {
    // 1.5 MB = 1.5 * 1048576 = 1,572,864 bytes
    const decMb = parseTargetSizeBytes('1.5', 'MB');
    expect(decMb.error).toBeNull();
    expect(decMb.bytes).toBe(1572864);

    // 250.5 KB = 250.5 * 1024 = 256,512 bytes
    const decKb = parseTargetSizeBytes('250.5', 'KB');
    expect(decKb.error).toBeNull();
    expect(decKb.bytes).toBe(256512);
  });

  it('handles whitespace gracefully', () => {
    const res = parseTargetSizeBytes('  3.2  ', 'MB');
    expect(res.error).toBeNull();
    expect(res.bytes).toBe(Math.round(3.2 * 1024 * 1024));
  });

  it('rejects empty or whitespace-only inputs', () => {
    expect(parseTargetSizeBytes('', 'MB').error).toBe('Please enter a target file size.');
    expect(parseTargetSizeBytes('   ', 'KB').error).toBe('Please enter a target file size.');
  });

  it('rejects non-numeric inputs', () => {
    expect(parseTargetSizeBytes('abc', 'MB').error).toBe('Please enter a valid numeric file size.');
    expect(parseTargetSizeBytes('12px', 'KB').error).toBe('Please enter a valid numeric file size.');
  });

  it('rejects zero, negative numbers, and non-finite values', () => {
    expect(parseTargetSizeBytes('0', 'MB').error).toBe('Target file size must be greater than zero.');
    expect(parseTargetSizeBytes('-5', 'MB').error).toBe('Target file size must be greater than zero.');
    expect(parseTargetSizeBytes('-0.1', 'KB').error).toBe('Target file size must be greater than zero.');
  });

  it('rejects values exceeding the safe limit (> 10 GB)', () => {
    expect(parseTargetSizeBytes('100', 'GB').error).toBe('Target file size exceeds maximum supported limit.');
  });
});

describe('Target Size Mode in compressPdfDocument', () => {
  it('handles reachable target size setting targetReached to true', async () => {
    const pdf = await createTestPdf(2);
    // Target is 1 MB, which is comfortably larger than a 2-page text PDF (~2-3 KB)
    const targetBytes = 1024 * 1024;

    const result = await compressPdfDocument(pdf, {
      mode: 'target',
      targetSizeBytes: targetBytes,
    });

    expect(result.mode).toBe('target');
    expect(result.targetSizeBytes).toBe(targetBytes);
    expect(result.targetReached).toBe(true);
    expect(result.compressedBytes).toBeLessThanOrEqual(targetBytes);

    // Document validity check
    const loaded = await PDFDocument.load(result.outputBytes);
    expect(loaded.getPageCount()).toBe(2);
  });

  it('handles unreachable target size without corrupting PDF and reports targetReached: false', async () => {
    const pdf = await createTestPdf(2);
    // Extremely small target: 10 bytes (impossible for any valid PDF)
    const unreachableTarget = 10;

    const result = await compressPdfDocument(pdf, {
      mode: 'target',
      targetSizeBytes: unreachableTarget,
    });

    expect(result.mode).toBe('target');
    expect(result.targetSizeBytes).toBe(unreachableTarget);
    expect(result.targetReached).toBe(false);
    expect(result.compressedBytes).toBeGreaterThan(unreachableTarget);

    // Verify document validity was preserved (no artificial truncation or padding)
    const loaded = await PDFDocument.load(result.outputBytes);
    expect(loaded.getPageCount()).toBe(2);
  });

  it('handles target size greater than or equal to original size', async () => {
    const pdf = await createTestPdf(2);
    const targetBytes = pdf.length * 2; // Double original size

    const result = await compressPdfDocument(pdf, {
      mode: 'target',
      targetSizeBytes: targetBytes,
    });

    expect(result.mode).toBe('target');
    expect(result.targetReached).toBe(true);
    expect(result.compressedBytes).toBeLessThanOrEqual(targetBytes);

    const loaded = await PDFDocument.load(result.outputBytes);
    expect(loaded.getPageCount()).toBe(2);
  });
});

describe('CompressionModeSelector Component', () => {
  it('renders all four compression modes including Target Size', () => {
    const html = renderToString(
      <CompressionModeSelector
        selectedMode="balanced"
        onChange={() => {}}
        targetSizeValue="2"
        targetSizeUnit="MB"
        onTargetSizeChange={() => {}}
      />
    );

    expect(html).toContain('Quality');
    expect(html).toContain('Balanced');
    expect(html).toContain('Strong');
    expect(html).toContain('Target Size');
    expect(html).toContain('Custom');
  });

  it('renders target size input controls when selectedMode is target', () => {
    const html = renderToString(
      <CompressionModeSelector
        selectedMode="target"
        onChange={() => {}}
        targetSizeValue="1.5"
        targetSizeUnit="MB"
        formattedOriginalSize="5 MB"
        onTargetSizeChange={() => {}}
      />
    );

    expect(html).toContain('Target File Size');
    expect(html).toContain('value="1.5"');
    expect(html).toContain('Original size:');
    expect(html).toContain('5 MB');
    expect(html).toContain('MB');
    expect(html).toContain('KB');
    expect(html).toContain('GB');
  });

  it('renders target size error banner when targetSizeError is present', () => {
    const html = renderToString(
      <CompressionModeSelector
        selectedMode="target"
        onChange={() => {}}
        targetSizeValue="-5"
        targetSizeUnit="MB"
        targetSizeError="Target file size must be greater than zero."
        onTargetSizeChange={() => {}}
      />
    );

    expect(html).toContain('Target file size must be greater than zero.');
  });
});

describe('CompressionStatsCard Component', () => {
  it('renders truthful target reached summary in target mode', () => {
    const mockResult: CompressionResult = {
      originalBytes: 5000000,
      compressedBytes: 1800000,
      bytesSaved: 3200000,
      percentSaved: 64,
      mode: 'target',
      isReduced: true,
      targetSizeBytes: 2000000,
      targetReached: true,
      outputBytes: new Uint8Array(),
      characteristics: {
        pageCount: 5,
        imageCount: 2,
        totalImageBytes: 1500000,
        fileSizeBytes: 5000000,
        contentType: 'mixed',
      },
    };

    const html = renderToString(
      <CompressionStatsCard result={mockResult} />
    );

    expect(html).toContain('Target Reached');
    expect(html).toContain('Target Size');
    expect(html).toContain('≤');
    expect(html).toContain('Original Size');
    expect(html).toContain('Compressed Size');
    expect(html).toContain('Space Saved');
    expect(html).toContain('Reduction Ratio');
    expect(html).toContain('-64%');
  });

  it('renders truthful target not reached summary with non-technical explanation', () => {
    const mockResult: CompressionResult = {
      originalBytes: 5000000,
      compressedBytes: 3000000,
      bytesSaved: 2000000,
      percentSaved: 40,
      mode: 'target',
      isReduced: true,
      targetSizeBytes: 1000000,
      targetReached: false,
      outputBytes: new Uint8Array(),
      characteristics: {
        pageCount: 5,
        imageCount: 2,
        totalImageBytes: 1500000,
        fileSizeBytes: 5000000,
        contentType: 'image-heavy',
      },
    };

    const html = renderToString(
      <CompressionStatsCard result={mockResult} />
    );

    expect(html).toContain('Target Not Reached');
    expect(html).toContain('Target size could not be reached with the available compression settings');
    expect(html).toContain('40%');
  });
});
