import { describe, it, expect } from 'vitest';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  protectPdf,
  unlockPdf,
  detectPdfProtection,
  isQpdfAvailable,
} from '@/lib/pdf/operations/protect';
import { PdfOperationError } from '@/lib/pdf/types';

/**
 * Creates a minimal valid synthetic PDF with `pageCount` pages in memory.
 */
async function createTestPdf(pageCount: number, label = 'Secret Document'): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`${label} - Page ${i}`, {
      x: 50,
      y: 550,
      size: 20,
      color: rgb(0.1, 0.1, 0.1),
    });
  }
  return doc.save();
}

describe('PDF Security Engine: Protect & Unlock', () => {
  it('engine is available in test environment', () => {
    expect(isQpdfAvailable()).toBe(true);
  });

  it('encrypts a plain PDF with AES-256 password protection', async () => {
    const rawPdf = await createTestPdf(2, 'Confidential Data');
    const password = 'TestSuperPassword123!';

    const { pdfBytes: protectedBytes, algorithm } = await protectPdf(rawPdf, {
      userPassword: password,
      allowPrinting: true,
      allowCopying: false,
      allowModifying: false,
    });

    expect(algorithm).toBe('AES-256');
    expect(protectedBytes).toBeInstanceOf(Uint8Array);
    expect(protectedBytes.length).toBeGreaterThan(0);

    // Standard pdf-lib should fail to load encrypted document without password
    await expect(PDFDocument.load(protectedBytes)).rejects.toThrow();

    // Verify detection utility detects protection
    const isEncrypted = await detectPdfProtection(protectedBytes);
    expect(isEncrypted).toBe('PROTECTED');
  });

  it('unlocks an encrypted PDF with the correct password', async () => {
    const rawPdf = await createTestPdf(2, 'Unlock Test Document');
    const password = 'CorrectHorseBatteryStaple!';

    const { pdfBytes: protectedBytes } = await protectPdf(rawPdf, {
      userPassword: password,
    });

    // Verify it is indeed protected
    expect(await detectPdfProtection(protectedBytes)).toBe('PROTECTED');

    // Unlock with the correct password
    const { pdfBytes: unlockedBytes } = await unlockPdf(protectedBytes, {
      password,
    });

    expect(unlockedBytes).toBeInstanceOf(Uint8Array);
    expect(unlockedBytes.length).toBeGreaterThan(0);

    // After unlocking, pdf-lib should be able to parse and read the document cleanly
    const parsedDoc = await PDFDocument.load(unlockedBytes);
    expect(parsedDoc.getPageCount()).toBe(2);

    // Verify detection utility now sees it as unencrypted
    const stillEncrypted = await detectPdfProtection(unlockedBytes);
    expect(stillEncrypted).toBe('UNPROTECTED');
  });

  it('rejects unlocking with an incorrect password and throws INCORRECT_PASSWORD code', async () => {
    const rawPdf = await createTestPdf(1, 'Top Secret');
    const password = 'ValidPassword999';

    const { pdfBytes: protectedBytes } = await protectPdf(rawPdf, {
      userPassword: password,
    });

    let caughtError: unknown = null;
    try {
      await unlockPdf(protectedBytes, {
        password: 'WrongPassword!',
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(PdfOperationError);
    const pdfErr = caughtError as PdfOperationError;
    expect(pdfErr.code).toBe('INCORRECT_PASSWORD');
    expect(pdfErr.message.toLowerCase()).toContain('incorrect password');
    // Ensure the wrong password itself is NOT leaked into the error message
    expect(pdfErr.message).not.toContain('WrongPassword!');
  });

  it('rejects unlocking an already unencrypted PDF and throws NOT_ENCRYPTED code', async () => {
    const rawPdf = await createTestPdf(1, 'Plain Document');

    let caughtError: unknown = null;
    try {
      await unlockPdf(rawPdf, {
        password: 'AnyPassword',
      });
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(PdfOperationError);
    const pdfErr = caughtError as PdfOperationError;
    expect(pdfErr.code).toBe('NOT_ENCRYPTED');
  });

  it('applies granular permissions without mutating input buffer', async () => {
    const rawPdf = await createTestPdf(1, 'Permission Test');
    const originalLength = rawPdf.length;
    const originalFirstByte = rawPdf[0];

    const { pdfBytes: protectedBytes } = await protectPdf(rawPdf, {
      userPassword: 'PermPassword456',
      allowPrinting: false,
      allowCopying: false,
      allowModifying: false,
    });

    // Input buffer must remain intact and unmutated
    expect(rawPdf.length).toBe(originalLength);
    expect(rawPdf[0]).toBe(originalFirstByte);

    // Protected bytes are distinct and valid
    expect(protectedBytes.length).toBeGreaterThan(0);
    expect(await detectPdfProtection(protectedBytes)).toBe('PROTECTED');

    // Can be unlocked
    const { pdfBytes: unlocked } = await unlockPdf(protectedBytes, { password: 'PermPassword456' });
    const doc = await PDFDocument.load(unlocked);
    expect(doc.getPageCount()).toBe(1);
  });

  it('handles passwords with spaces, quotes, dashes, and complex symbols', async () => {
    const rawPdf = await createTestPdf(1, 'Symbol Test');
    const complexPassword = 'My P@ss"w0rd\'!#$--2026';

    const { pdfBytes: protectedBytes } = await protectPdf(rawPdf, {
      userPassword: complexPassword,
    });

    expect(await detectPdfProtection(protectedBytes)).toBe('PROTECTED');

    const { pdfBytes: unlockedBytes } = await unlockPdf(protectedBytes, {
      password: complexPassword,
    });

    const doc = await PDFDocument.load(unlockedBytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it('verifies independent PDF reader requires password and unlocks with correct password', async () => {
    const mathObj = Math as unknown as { sumPrecise?: (arr: number[]) => number };
    if (!mathObj.sumPrecise) {
      mathObj.sumPrecise = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    }
    const pdfjsLib = await import('pdfjs-dist');

    const rawPdf = await createTestPdf(1, 'Secret Content Verification');
    const password = 'IndependentReaderPass999!';

    const { pdfBytes: protectedBytes } = await protectPdf(rawPdf, {
      userPassword: password,
    });

    // 1. pdf-lib MUST reject without password
    await expect(PDFDocument.load(protectedBytes)).rejects.toThrow(/encrypted/i);

    // 2. pdfjs-dist MUST request password
    let passwordChallengeFired = false;
    const loadingTask = pdfjsLib.getDocument({ data: protectedBytes });
    loadingTask.onPassword = (callback: (pwd: string) => void, reason: number) => {
      passwordChallengeFired = true;
      expect(reason).toBe(1); // 1 = NEED_PASSWORD
      callback(password);
    };

    const pdfJsDoc = await loadingTask.promise;
    expect(passwordChallengeFired).toBe(true);
    expect(pdfJsDoc.numPages).toBe(1);

    const firstPage = await pdfJsDoc.getPage(1);
    const textContent = await firstPage.getTextContent();
    const extracted = textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    expect(extracted).toContain('Secret Content Verification');
  });

  it('never leaks user password in error messages on protect errors', async () => {
    const invalidBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const secretPassword = 'SensitivePasswordNeverLeakMe!';

    try {
      await protectPdf(invalidBytes, { userPassword: secretPassword });
      expect.unreachable('Should have thrown an error on invalid PDF bytes');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      expect(msg).not.toContain(secretPassword);
    }
  });
});
