import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';
import type { CompressionMode, CompressionOptions, CompressionResult } from './types';
import { detectPdfCharacteristics } from './detector';

export const COMPRESSION_PROFILES: Record<
  CompressionMode,
  { maxDimension: number; jpegQuality: number; label: string; description: string }
> = {
  quality: {
    maxDimension: 2400,
    jpegQuality: 0.85,
    label: 'Quality',
    description: 'High fidelity with minimal compression artifacts. Prunes syntax and excess camera resolutions.',
  },
  balanced: {
    maxDimension: 1600,
    jpegQuality: 0.72,
    label: 'Balanced',
    description: 'Recommended setting. Moderate downsampling and JPEG recompression with sharp text and layout.',
  },
  strong: {
    maxDimension: 1024,
    jpegQuality: 0.55,
    label: 'Strong',
    description: 'Maximum size reduction for email attachments and uploads. Accepts visible image compression.',
  },
  target: {
    maxDimension: 1600,
    jpegQuality: 0.72,
    label: 'Target Size',
    description: 'Specify maximum desired output file size. PDFly progressively optimizes streams to meet your target.',
  },
};

/**
 * Recompresses raw JPEG bytes using browser canvas with targeted dimensions and quality.
 * Returns null if recompression fails or is unsupported in current environment.
 */
async function recompressJpegBytes(
  jpegBytes: Uint8Array,
  maxDimension: number,
  quality: number,
): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  try {
    const blob = new Blob([jpegBytes as unknown as BlobPart], { type: 'image/jpeg' });

    if (typeof createImageBitmap !== 'undefined') {
      const bitmap = await createImageBitmap(blob);
      try {
        const srcW = bitmap.width;
        const srcH = bitmap.height;

        let scale = 1;
        const largest = Math.max(srcW, srcH);
        const safeMaxDim = Math.min(Math.max(1, maxDimension), 8192);
        if (largest > safeMaxDim) {
          scale = safeMaxDim / largest;
        }

        const targetW = Math.max(1, Math.round(srcW * scale));
        const targetH = Math.max(1, Math.round(srcH * scale));

        if (typeof OffscreenCanvas !== 'undefined') {
          const canvas = new OffscreenCanvas(targetW, targetH);
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          ctx.drawImage(bitmap, 0, 0, targetW, targetH);
          const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
          const outBuf = await outBlob.arrayBuffer();
          return { bytes: new Uint8Array(outBuf), width: targetW, height: targetH };
        }

        if (typeof document !== 'undefined') {
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          ctx.drawImage(bitmap, 0, 0, targetW, targetH);
          const outBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
          });
          if (!outBlob) return null;
          const outBuf = await outBlob.arrayBuffer();
          canvas.width = 0;
          canvas.height = 0;
          return { bytes: new Uint8Array(outBuf), width: targetW, height: targetH };
        }
      } finally {
        bitmap.close?.();
      }
    }

    if (typeof Image !== 'undefined' && typeof document !== 'undefined') {
      return new Promise((resolve) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = async () => {
          try {
            const srcW = img.naturalWidth;
            const srcH = img.naturalHeight;
            let scale = 1;
            const largest = Math.max(srcW, srcH);
            const safeMaxDim = Math.min(Math.max(1, maxDimension), 8192);
            if (largest > safeMaxDim) {
              scale = safeMaxDim / largest;
            }
            const targetW = Math.max(1, Math.round(srcW * scale));
            const targetH = Math.max(1, Math.round(srcH * scale));
            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              URL.revokeObjectURL(url);
              return resolve(null);
            }
            ctx.drawImage(img, 0, 0, targetW, targetH);
            URL.revokeObjectURL(url);
            canvas.toBlob(
              (b) => {
                if (!b) return resolve(null);
                b.arrayBuffer()
                  .then((buf) => {
                    canvas.width = 0;
                    canvas.height = 0;
                    resolve({ bytes: new Uint8Array(buf), width: targetW, height: targetH });
                  })
                  .catch(() => resolve(null));
              },
              'image/jpeg',
              quality,
            );
          } catch {
            URL.revokeObjectURL(url);
            resolve(null);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
        img.src = url;
      });
    }
  } catch {
    return null;
  }

  return null;
}

interface CompressionPassParams {
  maxDimension: number;
  jpegQuality: number;
}

const TARGET_PASSES: readonly CompressionPassParams[] = [
  { maxDimension: 1800, jpegQuality: 0.78 }, // Pass 1: Light/Balanced
  { maxDimension: 1200, jpegQuality: 0.60 }, // Pass 2: Medium/Strong
  { maxDimension: 900, jpegQuality: 0.45 },  // Pass 3: Aggressive
  { maxDimension: 640, jpegQuality: 0.35 },  // Pass 4: Maximum safe reduction
] as const;

/**
 * Runs a single compression pass on the PDF bytes using specified dimension and JPEG quality limits.
 */
async function runCompressionPass(
  pdfBytes: Uint8Array,
  params: CompressionPassParams,
  onProgress?: (stage: string, percent: number) => void,
  progressStart = 15,
  progressSpan = 70,
): Promise<{ outputBytes: Uint8Array; recompressedImageCount: number }> {
  const { PDFDocument, PDFName, PDFNumber, PDFRawStream } = await getPdfLib();

  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: false });

  // Identify Image XObjects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageObjects: { ref: any; obj: any }[] = [];
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (obj && typeof obj === 'object' && 'dict' in obj) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dict = (obj as any).dict;
      if (dict && typeof dict.get === 'function') {
        const subtype = dict.get(PDFName.of('Subtype'));
        if (subtype && subtype.toString() === '/Image') {
          imageObjects.push({ ref, obj });
        }
      }
    }
  }

  let recompressedImageCount = 0;
  const totalImages = imageObjects.length;

  for (let i = 0; i < totalImages; i++) {
    const { ref, obj } = imageObjects[i]!;
    const pct = Math.round(progressStart + ((i + 1) / Math.max(1, totalImages)) * progressSpan);
    onProgress?.(`Optimizing image ${i + 1} of ${totalImages}...`, pct);

    const dict = obj.dict;
    const filter = dict.get(PDFName.of('Filter'));
    if (filter && filter.toString() === '/DCTDecode') {
      const hasMask = dict.has(PDFName.of('SMask')) || dict.has(PDFName.of('Mask'));
      const colorSpaceObj = dict.get(PDFName.of('ColorSpace'));
      const colorSpaceStr = colorSpaceObj ? colorSpaceObj.toString() : '/DeviceRGB';
      const isSafeColorSpace =
        colorSpaceStr === '/DeviceRGB' ||
        colorSpaceStr === '/DeviceGray' ||
        !colorSpaceObj;

      if (!isSafeColorSpace) {
        continue;
      }

      const rawStreamBytes = typeof obj.getContents === 'function' ? obj.getContents() : null;
      if (rawStreamBytes && rawStreamBytes.length > 2000) {
        const effectiveMaxDim = hasMask ? 8192 : params.maxDimension;
        const recompressed = await recompressJpegBytes(
          rawStreamBytes,
          effectiveMaxDim,
          params.jpegQuality,
        );

        if (recompressed && recompressed.bytes.length < rawStreamBytes.length) {
          const newDict = dict.clone();
          newDict.set(PDFName.of('Type'), PDFName.of('XObject'));
          newDict.set(PDFName.of('Subtype'), PDFName.of('Image'));
          newDict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
          newDict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
          newDict.set(PDFName.of('Width'), PDFNumber.of(recompressed.width));
          newDict.set(PDFName.of('Height'), PDFNumber.of(recompressed.height));
          newDict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
          newDict.delete(PDFName.of('Length'));

          const newStream = PDFRawStream.of(newDict, recompressed.bytes);
          doc.context.assign(ref, newStream);
          recompressedImageCount++;
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const outputBytes = await doc.save({ useObjectStreams: true });
  return { outputBytes, recompressedImageCount };
}

/**
 * Compresses a PDF document client-side by:
 * 1. Recompressing and downscaling embedded JPEG streams without rasterizing text or vectors.
 * 2. Consolidating PDF object streams (useObjectStreams: true).
 * 3. Measuring byte savings truthfully (never claiming compression if output is equal or larger).
 * 4. Progressively adapting compression settings when target size mode is requested.
 */
export async function compressPdfDocument(
  pdfBytes: Uint8Array,
  options: CompressionOptions = {},
): Promise<CompressionResult> {
  const mode = options.mode ?? 'balanced';
  options.onProgress?.('Analyzing document structure...', 10);

  // 1. Detect characteristics
  const characteristics = await detectPdfCharacteristics(pdfBytes);

  // Verify encryption before processing
  const { PDFDocument } = await getPdfLib();
  try {
    await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('encrypt') || msg.toLowerCase().includes('password')) {
      throw new PdfOperationError(
        'ENCRYPTED_PDF',
        'Cannot compress encrypted or password-protected PDF files.',
      );
    }
    throw new PdfOperationError(
      'INVALID_PDF',
      'The provided file is not a valid PDF document.',
      msg,
    );
  }

  const originalSize = pdfBytes.length;

  if (mode === 'target') {
    const targetSizeBytes = options.targetSizeBytes;
    const isTargetValid =
      typeof targetSizeBytes === 'number' &&
      Number.isFinite(targetSizeBytes) &&
      targetSizeBytes > 0;
    const effectiveTarget = isTargetValid ? targetSizeBytes : originalSize;

    // If target >= original size, run a single light/balanced pass without aggressive downsampling
    if (effectiveTarget >= originalSize) {
      options.onProgress?.('Optimizing document structure...', 30);
      const { outputBytes } = await runCompressionPass(
        pdfBytes,
        { maxDimension: 1800, jpegQuality: 0.78 },
        options.onProgress,
        30,
        55,
      );

      options.onProgress?.('Finalizing compressed output...', 95);
      const isReduced = outputBytes.length < originalSize;
      const compressedSize = isReduced ? outputBytes.length : originalSize;
      const bytesSaved = isReduced ? originalSize - compressedSize : 0;
      const percentSaved = isReduced
        ? parseFloat(((bytesSaved / originalSize) * 100).toFixed(1))
        : 0;
      options.onProgress?.('Complete', 100);

      return {
        originalBytes: originalSize,
        compressedBytes: compressedSize,
        bytesSaved,
        percentSaved,
        mode: 'target',
        isReduced,
        characteristics,
        outputBytes: isReduced ? outputBytes : pdfBytes,
        targetSizeBytes: effectiveTarget,
        targetReached: compressedSize <= effectiveTarget,
      };
    }

    // Target < original size: Progressive iterative search (max 4 attempts)
    let bestOutput: Uint8Array | null = null;
    let bestSize = originalSize;
    const maxPasses = TARGET_PASSES.length; // 4

    for (let passIndex = 0; passIndex < maxPasses; passIndex++) {
      const passConfig = TARGET_PASSES[passIndex]!;
      const passNum = passIndex + 1;
      const progressBase = Math.round(15 + (passIndex / maxPasses) * 75);
      const progressSpan = Math.round(75 / maxPasses);

      options.onProgress?.(
        `Attempt ${passNum} of ${maxPasses}: Optimizing document...`,
        progressBase,
      );

      const { outputBytes, recompressedImageCount } = await runCompressionPass(
        pdfBytes,
        passConfig,
        options.onProgress,
        progressBase,
        progressSpan,
      );

      if (outputBytes.length < bestSize) {
        bestSize = outputBytes.length;
        bestOutput = outputBytes;
      }

      // Early exit 1: Target reached
      if (bestSize <= effectiveTarget) {
        break;
      }

      // Early exit 2: If Pass 1 had 0 recompressed images, further downsampling passes cannot reduce stream sizes
      if (passIndex === 0 && recompressedImageCount === 0) {
        break;
      }

      // Early exit 3: Diminishing returns between Pass 1 and Pass 2 (< 0.5% of original size)
      if (passIndex === 1 && bestOutput) {
        const delta = originalSize - bestSize;
        if (delta < originalSize * 0.005) {
          break;
        }
      }
    }

    options.onProgress?.('Finalizing compressed output...', 98);
    const isReduced = bestOutput !== null && bestSize < originalSize;
    const finalBytes = isReduced && bestOutput ? bestOutput : pdfBytes;
    const compressedBytes = isReduced ? bestSize : originalSize;
    const bytesSaved = isReduced ? originalSize - compressedBytes : 0;
    const percentSaved = isReduced
      ? parseFloat(((bytesSaved / originalSize) * 100).toFixed(1))
      : 0;
    const targetReached = compressedBytes <= effectiveTarget;

    options.onProgress?.('Complete', 100);

    return {
      originalBytes: originalSize,
      compressedBytes,
      bytesSaved,
      percentSaved,
      mode: 'target',
      isReduced,
      characteristics,
      outputBytes: finalBytes,
      targetSizeBytes: effectiveTarget,
      targetReached,
    };
  }

  // Standard Presets: Quality, Balanced, Strong
  const profile = COMPRESSION_PROFILES[mode];
  const { outputBytes } = await runCompressionPass(
    pdfBytes,
    { maxDimension: profile.maxDimension, jpegQuality: profile.jpegQuality },
    options.onProgress,
    15,
    70,
  );

  options.onProgress?.('Finalizing compressed output...', 98);
  const isReduced = outputBytes.length < originalSize;
  const compressedBytes = isReduced ? outputBytes.length : originalSize;
  const bytesSaved = isReduced ? originalSize - compressedBytes : 0;
  const percentSaved = isReduced
    ? parseFloat(((bytesSaved / originalSize) * 100).toFixed(1))
    : 0;

  options.onProgress?.('Complete', 100);

  return {
    originalBytes: originalSize,
    compressedBytes,
    bytesSaved,
    percentSaved,
    mode,
    isReduced,
    characteristics,
    outputBytes: isReduced ? outputBytes : pdfBytes,
  };
}
