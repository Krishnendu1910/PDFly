import type * as PdfLibType from 'pdf-lib';
import type * as PdfJsType from 'pdfjs-dist';
import { PdfOperationError } from '../types';

let cachedPdfLib: typeof PdfLibType | null = null;
let cachedPdfJs: typeof PdfJsType | null = null;
let pdfLibLoadingPromise: Promise<typeof PdfLibType> | null = null;
let pdfJsLoadingPromise: Promise<typeof PdfJsType> | null = null;

/**
 * Dynamically loads pdf-lib on demand.
 * Prevents bundling the manipulation engine into the initial application bundle.
 */
export async function getPdfLib(): Promise<typeof PdfLibType> {
  if (cachedPdfLib) return cachedPdfLib;

  if (!pdfLibLoadingPromise) {
    pdfLibLoadingPromise = import('pdf-lib')
      .then((mod) => {
        cachedPdfLib = mod;
        return mod;
      })
      .catch((err: unknown) => {
        pdfLibLoadingPromise = null;
        const msg = err instanceof Error ? err.message : String(err);
        throw new PdfOperationError(
          'ENGINE_LOAD_FAILED',
          'Failed to load the PDF manipulation engine.',
          msg,
        );
      });
  }

  return pdfLibLoadingPromise;
}

/**
 * Dynamically loads pdfjs-dist on demand.
 * Prevents bundling the preview/rendering engine into the initial application bundle.
 */
export async function getPdfJs(): Promise<typeof PdfJsType> {
  if (cachedPdfJs) return cachedPdfJs;

  if (!pdfJsLoadingPromise) {
    pdfJsLoadingPromise = import('pdfjs-dist')
      .then((mod) => {
        cachedPdfJs = mod;
        return mod;
      })
      .catch((err: unknown) => {
        pdfJsLoadingPromise = null;
        const msg = err instanceof Error ? err.message : String(err);
        throw new PdfOperationError(
          'ENGINE_LOAD_FAILED',
          'Failed to load the PDF rendering engine.',
          msg,
        );
      });
  }

  return pdfJsLoadingPromise;
}

