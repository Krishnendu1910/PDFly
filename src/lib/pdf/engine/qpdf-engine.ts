import createModule from '@neslinesli93/qpdf-wasm';
import { PdfOperationError } from '../types';

export interface QpdfInstance {
  callMain: (args: string[]) => number;
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string) => Uint8Array;
    unlink: (path: string) => void;
    analyzePath: (path: string) => { exists: boolean };
  };
}

let cachedQpdfInstance: QpdfInstance | null = null;
let qpdfLoadingPromise: Promise<QpdfInstance> | null = null;

/**
 * Resolves the location of qpdf.wasm based on execution environment.
 * In browser/worker, serves from `/wasm/qpdf.wasm` (offline static asset).
 * In Node.js/Vitest, resolves to local filesystem path.
 */
function getWasmLocation(): string {
  // If running in browser or web worker
  if (typeof window !== 'undefined' || typeof self !== 'undefined') {
    return '/wasm/qpdf.wasm';
  }

  // Node.js environment fallback
  if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
    return `${process.cwd()}/public/wasm/qpdf.wasm`;
  }

  return '/wasm/qpdf.wasm';
}

/**
 * Initializes or returns the cached QPDF WebAssembly module instance.
 */
export async function getQpdfInstance(): Promise<QpdfInstance> {
  if (cachedQpdfInstance) return cachedQpdfInstance;

  if (!qpdfLoadingPromise) {
    qpdfLoadingPromise = (async () => {
      try {
        const wasmLoc = getWasmLocation();
        const instance = await (createModule as unknown as (options: Record<string, unknown>) => Promise<QpdfInstance>)({
          locateFile: () => wasmLoc,
          noExitRuntime: true,
          print: () => {},
          printErr: () => {},
        });
        cachedQpdfInstance = instance;
        return instance;
      } catch (err) {
        qpdfLoadingPromise = null;
        const msg = err instanceof Error ? err.message : String(err);
        throw new PdfOperationError(
          'ENGINE_LOAD_FAILED',
          'Failed to initialize the QPDF WebAssembly security engine.',
          msg,
        );
      }
    })();
  }

  return qpdfLoadingPromise;
}

export interface RunQpdfOptions {
  args: string[];
  inputBytes: Uint8Array;
  inputFileName?: string;
  outputFileName?: string;
}

export interface RunQpdfResult {
  outputBytes: Uint8Array | null;
  exitCode: number;
  stderr: string;
}

/**
 * Executes a QPDF command line invocation in the in-memory Emscripten filesystem.
 * Handles deterministic filesystem cleanup, exit status interception, and stderr sanitization.
 */
export async function executeQpdf(options: RunQpdfOptions): Promise<RunQpdfResult> {
  const {
    args,
    inputBytes,
    inputFileName = '/input.pdf',
    outputFileName = '/output.pdf',
  } = options;

  const qpdf = await getQpdfInstance();
  let stderrLog = '';

  // Intercept QPDF stderr via Emscripten virtual device 1536 (/dev/tty1).
  // This works universally in Web Worker, browser main thread, and Node.js without console pollution.
  const fsWithDevices = qpdf.FS as unknown as {
    lb?: Record<
      number,
      {
        qa?: {
          write: (stream: unknown, buf: Uint8Array, offset: number, len: number) => number;
        };
      }
    >;
  };
  const devStderr = fsWithDevices.lb?.[1536];
  const origDevWrite = devStderr?.qa?.write;

  if (devStderr?.qa) {
    devStderr.qa.write = (_stream: unknown, buf: Uint8Array, offset: number, len: number) => {
      try {
        const slice = buf.subarray(offset, offset + len);
        stderrLog += new TextDecoder().decode(slice);
      } catch {
        // Fallback for character decoding
        for (let i = 0; i < len; i++) {
          stderrLog += String.fromCharCode(buf[offset + i]);
        }
      }
      return len;
    };
  }

  // Prevent Node.js process.exitCode mutation and capture direct process.stderr writes
  const isNode = typeof process !== 'undefined' && process.versions?.node;
  const previousExitCode = isNode ? process.exitCode : undefined;
  const originalStderrWrite = isNode && process.stderr ? process.stderr.write : null;

  if (isNode && originalStderrWrite) {
    (process.stderr as unknown as { write: (chunk: string | Uint8Array) => boolean }).write = (
      chunk: string | Uint8Array,
    ) => {
      stderrLog += chunk.toString();
      return true;
    };
  }

  try {
    // Write input bytes to virtual in-memory filesystem
    qpdf.FS.writeFile(inputFileName, inputBytes);

    // Invoke QPDF CLI with a defensive copy of args to prevent callMain in-place unshift mutation
    let exitCode = 0;
    try {
      exitCode = qpdf.callMain([...args]);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err) {
        exitCode = (err as { status: number }).status;
      } else {
        exitCode = 2;
      }
    }

    // Read result if output file exists
    let outputBytes: Uint8Array | null = null;
    try {
      outputBytes = qpdf.FS.readFile(outputFileName);
    } catch {
      outputBytes = null;
    }

    // In QPDF CLI, exit code 3 signifies warnings (non-fatal) where the output file is validly produced
    if (exitCode === 3 && outputBytes && outputBytes.byteLength > 0) {
      exitCode = 0;
    }

    return {
      outputBytes,
      exitCode,
      stderr: stderrLog,
    };
  } finally {
    // Deterministic in-memory filesystem cleanup
    try {
      qpdf.FS.unlink(inputFileName);
    } catch {
      // Ignore cleanup error if file does not exist
    }

    try {
      qpdf.FS.unlink(outputFileName);
    } catch {
      // Ignore cleanup error if file does not exist
    }

    // Restore Emscripten virtual device write handler
    if (devStderr?.qa && origDevWrite) {
      devStderr.qa.write = origDevWrite;
    }

    // Restore Node stderr and exit code if polluted by Emscripten
    if (isNode) {
      if (originalStderrWrite && process.stderr) {
        process.stderr.write = originalStderrWrite;
      }
      if (typeof previousExitCode !== 'undefined') {
        process.exitCode = previousExitCode;
      }
    }
  }
}
