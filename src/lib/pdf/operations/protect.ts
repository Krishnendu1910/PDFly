import { PdfOperationError, type PdfErrorCode } from '../types';
import { executeQpdf } from '../engine/qpdf-engine';
import type {
  WorkerResponse,
  WorkerProtectPayload,
  WorkerUnlockPayload,
} from '../engine/qpdf.worker';

export interface ProtectPdfPermissions {
  allowPrinting?: boolean;
  allowCopying?: boolean;
  allowEditing?: boolean;
}

export interface ProtectPdfOptions {
  userPassword: string;
  ownerPassword?: string;
  permissions?: ProtectPdfPermissions;
  allowPrinting?: boolean;
  allowCopying?: boolean;
  allowModifying?: boolean;
  onProgress?: (percent: number) => void;
}

export function isQpdfAvailable(): boolean {
  return true;
}

export interface ProtectPdfResult {
  pdfBytes: Uint8Array;
  algorithm: 'AES-256';
}

export interface UnlockPdfOptions {
  password: string;
  onProgress?: (percent: number) => void;
}

export interface UnlockPdfResult {
  pdfBytes: Uint8Array;
}

export type PdfProtectionState = 'UNPROTECTED' | 'PROTECTED' | 'INVALID_PDF';

let activeWorker: Worker | null = null;

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!activeWorker) {
    try {
      activeWorker = new Worker(new URL('../engine/qpdf.worker.ts', import.meta.url), {
        type: 'module',
      });
      activeWorker.onerror = (e) => {
        console.error('QPDF worker runtime error:', e);
      };
    } catch {
      activeWorker = null;
    }
  }
  return activeWorker;
}

export function terminateProtectWorker(): void {
  if (activeWorker) {
    activeWorker.terminate();
    activeWorker = null;
  }
}

function generateRandomHex(length: number = 32): string {
  const arr = new Uint8Array(length / 2);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Protects a PDF document with standard AES-256 encryption and configurable reader permissions.
 * Never logs or persists passwords to storage or network requests.
 */
export async function protectPdf(
  input: File | Uint8Array,
  options: ProtectPdfOptions,
): Promise<ProtectPdfResult> {
  const { userPassword, ownerPassword, permissions, onProgress } = options;

  if (!userPassword || !userPassword.trim()) {
    throw new PdfOperationError('PROCESSING_FAILED', 'Password cannot be empty.');
  }

  onProgress?.(10);

  const fileBytes = input instanceof File
    ? new Uint8Array(await input.arrayBuffer())
    : input;

  onProgress?.(30);

  const worker = getWorker();

  if (worker) {
    return new Promise<ProtectPdfResult>((resolve, reject) => {
      const id = 'req_' + Math.random().toString(36).substring(2, 9);

      const errHandler = (e: ErrorEvent) => {
        worker.removeEventListener('message', handler);
        worker.removeEventListener('error', errHandler);
        reject(new PdfOperationError('PROCESSING_FAILED', e.message || 'Worker processing error.'));
      };

      const handler = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.id === id) {
          worker.removeEventListener('message', handler);
          worker.removeEventListener('error', errHandler);
          if (e.data.success && e.data.pdfBytes) {
            onProgress?.(100);
            resolve({
              pdfBytes: e.data.pdfBytes,
              algorithm: 'AES-256',
            });
          } else {
            const errCode = (e.data.error?.code as PdfErrorCode) || 'PROCESSING_FAILED';
            const errMsg = e.data.error?.message || 'PDF protection failed.';
            reject(new PdfOperationError(errCode, errMsg));
          }
        }
      };

      worker.addEventListener('message', handler);
      worker.addEventListener('error', errHandler);

      const payload: WorkerProtectPayload = {
        id,
        type: 'PROTECT',
        fileBytes,
        userPassword,
        ownerPassword,
        permissions,
      };

      worker.postMessage(payload, [fileBytes.buffer]);
    });
  }

  // Fallback direct execution (Node.js / Vitest / Environments without Workers)
  onProgress?.(50);
  const allowPrinting = permissions?.allowPrinting ?? options.allowPrinting ?? true;
  const allowCopying = permissions?.allowCopying ?? options.allowCopying ?? true;
  const allowEditing = permissions?.allowEditing ?? options.allowModifying ?? true;

  const permFlags: string[] = [];
  if (!allowPrinting) {
    permFlags.push('--print=none');
  } else {
    permFlags.push('--print=full');
  }

  if (!allowCopying) {
    permFlags.push('--extract=n');
  } else {
    permFlags.push('--extract=y');
  }

  if (!allowEditing) {
    permFlags.push('--modify=none');
  } else {
    permFlags.push('--modify=all');
  }

  // Always ensure a secure owner password is set so restrictions cannot be bypassed
  // and QPDF does not reject empty or identical user/owner passwords under Revision 6.
  const effectiveOwnerPassword =
    ownerPassword && ownerPassword.trim() ? ownerPassword : generateRandomHex(32);

  const args = [
    '/input.pdf',
    '--warning-exit-0',
    '--no-warn',
    '--encrypt',
    `--user-password=${userPassword}`,
    `--owner-password=${effectiveOwnerPassword}`,
    '--bits=256',
    ...permFlags,
    '--allow-insecure',
    '--',
    '/output.pdf',
  ];

  const res = await executeQpdf({
    args,
    inputBytes: fileBytes,
  });

  if (res.exitCode !== 0 || !res.outputBytes) {
    const stderr = res.stderr.toLowerCase();
    if (stderr.includes('already encrypted') || stderr.includes('already password')) {
      throw new PdfOperationError(
        'ALREADY_PROTECTED',
        'This PDF is already password-protected. Unlock it first if you want to protect it with a new password.',
      );
    }

    const firstStderrLine = res.stderr
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('For help:') && !l.startsWith('this.program --help'))[0];

    const detailMsg = firstStderrLine
      ? `PDF protection could not be completed: ${firstStderrLine.replace(/^this\.program:\s*/, '')}`
      : 'PDF protection could not be completed. Your original file has not been changed.';

    throw new PdfOperationError('PROCESSING_FAILED', detailMsg);
  }

  onProgress?.(100);
  return {
    pdfBytes: res.outputBytes,
    algorithm: 'AES-256',
  };
}

/**
 * Unlocks a password-protected PDF document using QPDF WebAssembly.
 */
export async function unlockPdf(
  input: File | Uint8Array,
  options: UnlockPdfOptions,
): Promise<UnlockPdfResult> {
  const { password, onProgress } = options;

  if (!password || !password.trim()) {
    throw new PdfOperationError('PROCESSING_FAILED', 'Password cannot be empty.');
  }

  onProgress?.(10);

  const fileBytes = input instanceof File
    ? new Uint8Array(await input.arrayBuffer())
    : input;

  onProgress?.(30);

  const worker = getWorker();

  if (worker) {
    return new Promise<UnlockPdfResult>((resolve, reject) => {
      const id = 'req_' + Math.random().toString(36).substring(2, 9);

      const errHandler = (e: ErrorEvent) => {
        worker.removeEventListener('message', handler);
        worker.removeEventListener('error', errHandler);
        reject(new PdfOperationError('PROCESSING_FAILED', e.message || 'Worker processing error.'));
      };

      const handler = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.id === id) {
          worker.removeEventListener('message', handler);
          worker.removeEventListener('error', errHandler);
          if (e.data.success && e.data.pdfBytes) {
            onProgress?.(100);
            resolve({
              pdfBytes: e.data.pdfBytes,
            });
          } else {
            const errCode = (e.data.error?.code as PdfErrorCode) || 'PROCESSING_FAILED';
            const errMsg = e.data.error?.message || 'PDF unlock failed.';
            reject(new PdfOperationError(errCode, errMsg));
          }
        }
      };

      worker.addEventListener('message', handler);
      worker.addEventListener('error', errHandler);

      const payload: WorkerUnlockPayload = {
        id,
        type: 'UNLOCK',
        fileBytes,
        password,
      };

      worker.postMessage(payload, [fileBytes.buffer]);
    });
  }

  // Verify document is actually protected before attempting unlock
  const currentProtection = await detectPdfProtection(fileBytes);
  if (currentProtection === 'UNPROTECTED') {
    throw new PdfOperationError('NOT_ENCRYPTED', 'This PDF is not password-protected.');
  }
  if (currentProtection === 'INVALID_PDF') {
    throw new PdfOperationError('INVALID_PDF', 'The provided file is not a valid PDF document.');
  }

  // Fallback direct execution
  onProgress?.(50);
  const args = [
    '/input.pdf',
    '--warning-exit-0',
    '--no-warn',
    `--password=${password}`,
    '--decrypt',
    '/output.pdf',
  ];

  const res = await executeQpdf({
    args,
    inputBytes: fileBytes,
  });

  if (res.exitCode !== 0 || !res.outputBytes) {
    const stderr = res.stderr.toLowerCase();
    if (
      res.exitCode === 2 ||
      stderr.includes('invalid password') ||
      stderr.includes('incorrect password')
    ) {
      throw new PdfOperationError('INCORRECT_PASSWORD', 'Incorrect password. Please try again.');
    }
    if (stderr.includes('not encrypted') || stderr.includes('is not encrypted')) {
      throw new PdfOperationError('NOT_ENCRYPTED', 'This PDF is not password-protected.');
    }

    const firstStderrLine = res.stderr
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('For help:') && !l.startsWith('this.program --help'))[0];

    const detailMsg = firstStderrLine
      ? `PDF unlock could not be completed: ${firstStderrLine.replace(/^this\.program:\s*/, '')}`
      : 'PDF unlock could not be completed. Please check your password.';

    throw new PdfOperationError('PROCESSING_FAILED', detailMsg);
  }

  onProgress?.(100);
  return {
    pdfBytes: res.outputBytes,
  };
}

/**
 * Detects whether a PDF file is password-protected or unprotected.
 */
export async function detectPdfProtection(
  input: File | Uint8Array,
): Promise<PdfProtectionState> {
  const bytes = input instanceof File
    ? new Uint8Array(await input.arrayBuffer())
    : input;

  try {
    const { PDFDocument } = await import('pdf-lib');
    await PDFDocument.load(bytes);
    return 'UNPROTECTED';
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('encrypted') || msg.includes('password')) {
      return 'PROTECTED';
    }
    return 'INVALID_PDF';
  }
}
