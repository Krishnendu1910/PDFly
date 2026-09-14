import { executeQpdf } from './qpdf-engine';

export interface WorkerProtectPayload {
  id: string;
  type: 'PROTECT';
  fileBytes: Uint8Array;
  userPassword: string;
  ownerPassword?: string;
  permissions?: {
    allowPrinting?: boolean;
    allowCopying?: boolean;
    allowEditing?: boolean;
  };
}

export interface WorkerUnlockPayload {
  id: string;
  type: 'UNLOCK';
  fileBytes: Uint8Array;
  password: string;
}

export interface WorkerDetectPayload {
  id: string;
  type: 'DETECT';
  fileBytes: Uint8Array;
}

export type WorkerRequest =
  | WorkerProtectPayload
  | WorkerUnlockPayload
  | WorkerDetectPayload;

export interface WorkerResponse {
  id: string;
  success: boolean;
  pdfBytes?: Uint8Array;
  protectionState?: 'UNPROTECTED' | 'PROTECTED' | 'INVALID_PDF';
  error?: {
    code: string;
    message: string;
  };
}

const postWorkerResponse = (msg: WorkerResponse, transfer?: Transferable[]): void => {
  (self.postMessage as unknown as (message: unknown, transfer?: Transferable[]) => void)(msg, transfer);
};

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

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  if (!msg || !msg.id) return;

  try {
    if (msg.type === 'PROTECT') {
      const { fileBytes, userPassword, ownerPassword, permissions } = msg;

      const allowPrinting = permissions?.allowPrinting ?? true;
      const allowCopying = permissions?.allowCopying ?? true;
      const allowEditing = permissions?.allowEditing ?? true;

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
          postWorkerResponse({
            id: msg.id,
            success: false,
            error: {
              code: 'ALREADY_PROTECTED',
              message: 'This PDF is already password-protected. Unlock it first if you want to protect it with a new password.',
            },
          });
          return;
        }

        const firstStderrLine = res.stderr
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !l.startsWith('For help:') && !l.startsWith('this.program --help'))[0];

        const detailMsg = firstStderrLine
          ? `PDF protection could not be completed: ${firstStderrLine.replace(/^this\.program:\s*/, '')}`
          : 'PDF protection could not be completed. Your original file has not been changed.';

        postWorkerResponse({
          id: msg.id,
          success: false,
          error: {
            code: 'PROCESSING_FAILED',
            message: detailMsg,
          },
        });
        return;
      }

      postWorkerResponse(
        {
          id: msg.id,
          success: true,
          pdfBytes: res.outputBytes,
        },
        [res.outputBytes.buffer],
      );
      return;
    }

    if (msg.type === 'UNLOCK') {
      const { fileBytes, password } = msg;

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
          postWorkerResponse({
            id: msg.id,
            success: false,
            error: {
              code: 'INCORRECT_PASSWORD',
              message: 'Incorrect password. Please try again.',
            },
          });
          return;
        }

        if (stderr.includes('not encrypted') || stderr.includes('is not encrypted')) {
          postWorkerResponse({
            id: msg.id,
            success: false,
            error: {
              code: 'NOT_ENCRYPTED',
              message: 'This PDF is not password-protected.',
            },
          });
          return;
        }

        const firstStderrLine = res.stderr
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !l.startsWith('For help:') && !l.startsWith('this.program --help'))[0];

        const detailMsg = firstStderrLine
          ? `PDF unlock could not be completed: ${firstStderrLine.replace(/^this\.program:\s*/, '')}`
          : 'PDF unlock could not be completed. Please check your password.';

        postWorkerResponse({
          id: msg.id,
          success: false,
          error: {
            code: 'PROCESSING_FAILED',
            message: detailMsg,
          },
        });
        return;
      }

      postWorkerResponse(
        {
          id: msg.id,
          success: true,
          pdfBytes: res.outputBytes,
        },
        [res.outputBytes.buffer],
      );
      return;
    }

    if (msg.type === 'DETECT') {
      const { fileBytes } = msg;

      const args = [
        '--is-encrypted',
        '/input.pdf',
      ];

      const res = await executeQpdf({
        args,
        inputBytes: fileBytes,
      });

      // Exit code 0 means encrypted, 2 means not encrypted
      if (res.exitCode === 0) {
        postWorkerResponse({
          id: msg.id,
          success: true,
          protectionState: 'PROTECTED',
        });
      } else {
        postWorkerResponse({
          id: msg.id,
          success: true,
          protectionState: 'UNPROTECTED',
        });
      }
      return;
    }
  } catch (err: unknown) {
    const msgStr = err instanceof Error ? err.message : 'Unknown worker error';
    postWorkerResponse({
      id: msg.id,
      success: false,
      error: {
        code: 'PROCESSING_FAILED',
        message: msgStr,
      },
    });
  }
};

