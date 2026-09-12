import { getPdfLib } from '../engine/loader';
import { PdfOperationError } from '../types';
import type { ImageDescriptor, ImageToPdfOptions } from './types';
import { validateImageSignature } from './validation';
import { getJpegExifOrientation } from './exif';

export const DEFAULT_MAX_PAGE_DIMENSION = 1440; // ~20 inches at 72 DPI
export const MAX_SAFE_IMAGE_DIMENSION = 8192; // 8K max canvas dimension to guard against memory crash

/**
 * Standard affine transform matrix [a, b, c, d, e, f] for EXIF orientations 1–8.
 * Given source dimensions (w, h):
 * - 1: Identity (w, h)
 * - 2: Mirrored horizontal (w, h)
 * - 3: Rotated 180° (w, h)
 * - 4: Mirrored vertical (w, h)
 * - 5: Mirrored horizontal + 270° CW (h, w)
 * - 6: Rotated 90° CW (h, w)
 * - 7: Mirrored horizontal + 90° CW (h, w)
 * - 8: Rotated 270° CW (h, w)
 */
function getExifTransform(
  orientation: number,
  w: number,
  h: number,
): { width: number; height: number; matrix: [number, number, number, number, number, number] } {
  switch (orientation) {
    case 2:
      return { width: w, height: h, matrix: [-1, 0, 0, 1, w, 0] };
    case 3:
      return { width: w, height: h, matrix: [-1, 0, 0, -1, w, h] };
    case 4:
      return { width: w, height: h, matrix: [1, 0, 0, -1, 0, h] };
    case 5:
      return { width: h, height: w, matrix: [0, 1, 1, 0, 0, 0] };
    case 6:
      return { width: h, height: w, matrix: [0, 1, -1, 0, h, 0] };
    case 7:
      return { width: h, height: w, matrix: [0, -1, -1, 0, h, w] };
    case 8:
      return { width: h, height: w, matrix: [0, -1, 1, 0, 0, w] };
    case 1:
    default:
      return { width: w, height: h, matrix: [1, 0, 0, 1, 0, 0] };
  }
}

/**
 * Normalizes an EXIF-oriented image (orientations 2–8) locally into upright PNG or JPEG bytes.
 * Handles all 8 standard orientations including mirrored/reflected forms.
 */
export async function normalizeExifImageBytes(file: File | Blob, orientation: number): Promise<Uint8Array> {
  if (orientation === 1) {
    return new Uint8Array(await file.arrayBuffer());
  }

  if (typeof createImageBitmap !== 'undefined') {
    const bitmap = await createImageBitmap(file);
    try {
      const srcW = bitmap.width;
      const srcH = bitmap.height;

      // Check max safe dimension guard
      let scale = 1;
      const maxDim = Math.max(srcW, srcH);
      if (maxDim > MAX_SAFE_IMAGE_DIMENSION) {
        scale = MAX_SAFE_IMAGE_DIMENSION / maxDim;
      }

      const scaledW = Math.max(1, Math.round(srcW * scale));
      const scaledH = Math.max(1, Math.round(srcH * scale));

      const { width: targetW, height: targetH, matrix } = getExifTransform(orientation, scaledW, scaledH);

      if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(targetW, targetH);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not obtain OffscreenCanvas 2D context.');
        ctx.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
        ctx.drawImage(bitmap, 0, 0, scaledW, scaledH);
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 });
        return new Uint8Array(await blob.arrayBuffer());
      }

      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not obtain Canvas 2D context.');
        ctx.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
        ctx.drawImage(bitmap, 0, 0, scaledW, scaledH);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Canvas normalization failed.'))),
            'image/jpeg',
            0.95,
          );
        });
        canvas.width = 0;
        canvas.height = 0;
        return new Uint8Array(await blob.arrayBuffer());
      }
    } finally {
      bitmap.close?.();
    }
  }

  // Fallback for HTMLImageElement
  if (typeof Image !== 'undefined' && typeof document !== 'undefined') {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = async () => {
        try {
          const srcW = img.naturalWidth;
          const srcH = img.naturalHeight;
          const { width: targetW, height: targetH, matrix } = getExifTransform(orientation, srcW, srcH);
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            return reject(new Error('Canvas 2D context unavailable.'));
          }
          ctx.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
          ctx.drawImage(img, 0, 0, srcW, srcH);
          URL.revokeObjectURL(url);
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Canvas toBlob failed during EXIF normalization.'));
              blob
                .arrayBuffer()
                .then((buf) => {
                  canvas.width = 0;
                  canvas.height = 0;
                  resolve(new Uint8Array(buf));
                })
                .catch(reject);
            },
            'image/jpeg',
            0.95,
          );
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to decode image for EXIF normalization.`));
      };
      img.src = url;
    });
  }

  // If running in headless test environment without canvas, return raw buffer
  return new Uint8Array(await file.arrayBuffer());
}

/**
 * Converts a raster image file (WebP or other) into raw PNG bytes via browser canvas.
 * WebP is decoded locally and encoded as PNG, preserving supported pixel data and alpha
 * transparency subject to browser color management.
 */
export async function convertImageToPngBytes(file: File | Blob): Promise<Uint8Array> {
  if (typeof createImageBitmap !== 'undefined') {
    const bitmap = await createImageBitmap(file);
    try {
      const width = bitmap.width;
      const height = bitmap.height;

      // Safe dimension guard
      let targetW = width;
      let targetH = height;
      if (Math.max(width, height) > MAX_SAFE_IMAGE_DIMENSION) {
        const scale = MAX_SAFE_IMAGE_DIMENSION / Math.max(width, height);
        targetW = Math.max(1, Math.round(width * scale));
        targetH = Math.max(1, Math.round(height * scale));
      }

      if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(targetW, targetH);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get OffscreenCanvas 2D context.');
        ctx.drawImage(bitmap, 0, 0, targetW, targetH);
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        return new Uint8Array(await blob.arrayBuffer());
      }

      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get Canvas 2D context.');
        ctx.drawImage(bitmap, 0, 0, targetW, targetH);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed.'))),
            'image/png',
          );
        });
        canvas.width = 0;
        canvas.height = 0;
        return new Uint8Array(await blob.arrayBuffer());
      }
    } finally {
      bitmap.close?.();
    }
  }

  if (typeof Image !== 'undefined' && typeof document !== 'undefined') {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            return reject(new Error('Could not get Canvas 2D context.'));
          }
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Failed to encode image to PNG.'));
            blob
              .arrayBuffer()
              .then((buf) => {
                canvas.width = 0;
                canvas.height = 0;
                resolve(new Uint8Array(buf));
              })
              .catch(reject);
          }, 'image/png');
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to decode image "${file instanceof File ? file.name : 'blob'}".`));
      };
      img.src = url;
    });
  }

  throw new Error('Image conversion is not supported in this runtime environment.');
}

/**
 * Converts an ordered list of ImageDescriptors into a high-quality PDF document.
 * 
 * Separation of Concerns:
 * - EXIF Orientation: If non-standard (orientations 2–8), normalized locally via canvas
 *   so embedded image pixels are always upright.
 * - Raw JPEGs with Orientation 1 (Normal): Embedded directly without re-encoding.
 * - User Rotation: Applied exclusively via PDF page rotation metadata (`page.setRotation`),
 *   ensuring complete separation from EXIF normalization and preventing double-rotation.
 * - Page Sizing Policy: Page aspect ratio matches image aspect ratio. Capped at
 *   `maxPageDimension` (default: 1440pt) to prevent pathological page dimensions while
 *   preserving exact pixel proportions.
 */
export async function convertImagesToPdf(
  images: readonly ImageDescriptor[],
  options: ImageToPdfOptions = {},
): Promise<Uint8Array> {
  if (!images || images.length === 0) {
    throw new PdfOperationError('PROCESSING_FAILED', 'At least one image is required to generate a PDF.');
  }

  const { PDFDocument, degrees } = await getPdfLib();
  const doc = await PDFDocument.create();
  const maxDim = options.maxPageDimension ?? DEFAULT_MAX_PAGE_DIMENSION;
  const total = images.length;

  for (let i = 0; i < total; i++) {
    const item = images[i]!;
    options.onProgress?.(i, total, Math.round((i / total) * 100));

    // Read raw file bytes
    let fileBytes: Uint8Array;
    try {
      const buffer = await item.managedFile.file.arrayBuffer();
      fileBytes = new Uint8Array(buffer);
    } catch {
      throw new PdfOperationError(
        'PROCESSING_FAILED',
        `Failed to read file data for "${item.managedFile.name}".`,
      );
    }

    // Verify magic bytes signature
    const sig = validateImageSignature(fileBytes);
    if (!sig.valid || !sig.format) {
      throw new PdfOperationError(
        'INVALID_PDF',
        `File "${item.managedFile.name}" is corrupted or has an invalid image signature.`,
        sig.error,
      );
    }

    // Embed image into PDF document
    let embeddedImage;

    try {
      if (sig.format === 'jpeg') {
        const exif = getJpegExifOrientation(fileBytes);
        if (exif.orientation === 1) {
          // Standard Orientation 1: Fast direct embedding with zero re-encoding
          embeddedImage = await doc.embedJpg(fileBytes);
        } else {
          // Orientations 2–8 (mirrored, rotated): Normalize pixels locally via canvas
          const normalizedBytes = await normalizeExifImageBytes(item.managedFile.file, exif.orientation);
          // Check if normalized output is JPEG or PNG
          if (normalizedBytes[0] === 0x89) {
            embeddedImage = await doc.embedPng(normalizedBytes);
          } else {
            embeddedImage = await doc.embedJpg(normalizedBytes);
          }
        }
      } else if (sig.format === 'png') {
        embeddedImage = await doc.embedPng(fileBytes);
      } else if (sig.format === 'webp') {
        // WebP must be transcoded to PNG for pdf-lib embedding
        const pngBytes = await convertImageToPngBytes(item.managedFile.file);
        embeddedImage = await doc.embedPng(pngBytes);
      } else {
        throw new Error(`Unsupported image format: ${sig.format}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new PdfOperationError(
        'PROCESSING_FAILED',
        `Failed to process and embed "${item.managedFile.name}".`,
        msg,
      );
    }

    // Calculate proportional page dimensions
    const rawWidth = embeddedImage.width;
    const rawHeight = embeddedImage.height;

    let scale = 1;
    const largestDim = Math.max(rawWidth, rawHeight);
    if (largestDim > maxDim) {
      scale = maxDim / largestDim;
    }

    const pageWidth = Math.max(1, Math.round(rawWidth * scale));
    const pageHeight = Math.max(1, Math.round(rawHeight * scale));

    // Add page and draw embedded image
    const page = doc.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });

    // Apply user-selected rotation exclusively to the page metadata
    if (item.rotation !== 0) {
      page.setRotation(degrees(item.rotation));
    }

    // Yield cooperatively to the browser event loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  options.onProgress?.(total, total, 100);
  return doc.save();
}
