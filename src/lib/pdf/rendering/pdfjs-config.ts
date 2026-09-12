import type * as PdfJsType from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let isConfigured = false;

/**
 * Initializes PDF.js with hardened security settings.
 *
 * Security measures:
 * 1. enableScripting: false -> Blocks all embedded PDF JavaScript execution.
 * 2. isEvalSupported: false -> Disables any dynamic code evaluation.
 * 3. Dedicated Web Worker -> Runs parsing/decoding off the main thread in a sandboxed worker.
 */
export function configurePdfJs(pdfjs: typeof PdfJsType): void {
  if (isConfigured) return;

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
  }

  isConfigured = true;
}

/**
 * Common security-hardened options for pdfjs.getDocument.
 */
export function getHardenedDocumentOptions(data: Uint8Array | ArrayBuffer) {
  return {
    data: data instanceof Uint8Array ? data : new Uint8Array(data),
    isEvalSupported: false,
    enableScripting: false,
    disableFontFace: false,
  };
}

