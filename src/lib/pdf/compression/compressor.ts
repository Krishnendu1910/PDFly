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
        if (largest > maxDimension) {
          scale = maxDimension / largest;
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
            if (largest > maxDimension) {
              scale = maxDimension / largest;
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

/**
 * Compresses a PDF document client-side by:
 * 1. Recompressing and downscaling embedded JPEG streams without rasterizing text or vectors.
 * 2. Consolidating PDF object streams (useObjectStreams: true).
 * 3. Measuring byte savings truthfully (never claiming compression if output is equal or larger).
 */
export async function compressPdfDocument(
  pdfBytes: Uint8Array,
  options: CompressionOptions = {},
): Promise<CompressionResult> {
  const mode = options.mode ?? 'balanced';
  const profile = COMPRESSION_PROFILES[mode];

  options.onProgress?.('Analyzing document structure...', 10);

  // 1. Detect characteristics
  const characteristics = await detectPdfCharacteristics(pdfBytes);

  const { PDFDocument, PDFName, PDFNumber, PDFRawStream } = await getPdfLib();

  let doc;
  try {
    doc = await PDFDocument.load(pdfBytes);
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

  // 2. Identify Image XObjects
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

  // 3. Recompress image streams sequentially
  const totalImages = imageObjects.length;
  for (let i = 0; i < totalImages; i++) {
    const { ref, obj } = imageObjects[i]!;
    const pct = Math.round(15 + ((i + 1) / Math.max(1, totalImages)) * 60);
    options.onProgress?.(`Optimizing image ${i + 1} of ${totalImages}...`, pct);

    // Check if image is DCTDecode (JPEG)
    const dict = obj.dict;
    const filter = dict.get(PDFName.of('Filter'));
    if (filter && filter.toString() === '/DCTDecode') {
      // Check for /SMask or /Mask:
      // If a mask exists, downscaling dimensions would desynchronize the mask and corrupt rendering
      const hasMask = dict.has(PDFName.of('SMask')) || dict.has(PDFName.of('Mask'));

      // Check ColorSpace:
      // Only recompress when ColorSpace is standard /DeviceRGB, /DeviceGray, or omitted.
      // If /DeviceCMYK, /Indexed, /Separation, or /DeviceN, preserve the original stream.
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
        // Only recompress images larger than 2KB to avoid overhead
        // If hasMask, do not downscale dimensions to preserve mask synchronization
        const effectiveMaxDim = hasMask ? 999999 : profile.maxDimension;

        const recompressed = await recompressJpegBytes(
          rawStreamBytes,
          effectiveMaxDim,
          profile.jpegQuality,
        );

        if (recompressed && recompressed.bytes.length < rawStreamBytes.length) {
          // Recompressed output is smaller! Update dictionary and assign stream
          // Construct replacement dictionary preserving required properties
          const newDict = dict.clone();
          newDict.set(PDFName.of('Type'), PDFName.of('XObject'));
          newDict.set(PDFName.of('Subtype'), PDFName.of('Image'));
          newDict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
          newDict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
          newDict.set(PDFName.of('Width'), PDFNumber.of(recompressed.width));
          newDict.set(PDFName.of('Height'), PDFNumber.of(recompressed.height));
          newDict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));

          // Remove Length from dict so PDFRawStream computes it dynamically
          newDict.delete(PDFName.of('Length'));

          const newStream = PDFRawStream.of(newDict, recompressed.bytes);
          doc.context.assign(ref, newStream);
        }
      }
    }

    // Cooperative yield
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  options.onProgress?.('Consolidating PDF object streams...', 85);

  // 4. Save with useObjectStreams: true
  const compressedBytes = await doc.save({ useObjectStreams: true });

  options.onProgress?.('Finalizing compressed output...', 98);

  // 5. Compare sizes truthfully
  const originalSize = pdfBytes.length;
  const compressedSize = compressedBytes.length;
  const isReduced = compressedSize < originalSize;
  const bytesSaved = isReduced ? originalSize - compressedSize : 0;
  const percentSaved = isReduced
    ? parseFloat(((bytesSaved / originalSize) * 100).toFixed(1))
    : 0;

  options.onProgress?.('Complete', 100);

  return {
    originalBytes: originalSize,
    compressedBytes: isReduced ? compressedSize : originalSize,
    bytesSaved,
    percentSaved,
    mode,
    isReduced,
    characteristics,
    outputBytes: isReduced ? compressedBytes : pdfBytes,
  };
}
