import type { ImageFormat, MagicByteValidationResult } from './types';
import { getFileExtension } from '@/lib/utils/file';

/**
 * Validates the magic bytes / file signature of an image file from raw bytes.
 * Reads only the first 16 bytes, ensuring near-instant verification with minimal memory usage.
 */
export function validateImageSignature(bytes: Uint8Array): MagicByteValidationResult {
  if (!bytes || bytes.length < 12) {
    return {
      valid: false,
      error: 'File is too small or truncated to be a valid image.',
    };
  }

  // 1. JPEG check: Starts with 0xFF 0xD8 0xFF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, format: 'jpeg' };
  }

  // 2. PNG check: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { valid: true, format: 'png' };
  }

  // 3. WebP check: Starts with RIFF (0x52 0x49 0x46 0x46) and WEBP at bytes 8..11 (0x57 0x45 0x42 0x50)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { valid: true, format: 'webp' };
  }

  // 4. SVG or HTML check
  const textHeader = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 16)).trim().toLowerCase();
  if (textHeader.startsWith('<svg') || textHeader.startsWith('<?xml') || textHeader.startsWith('<!doctype')) {
    return {
      valid: false,
      error: 'SVG images are not supported for PDF generation due to security boundaries.',
    };
  }

  // 5. GIF check: GIF87a or GIF89a
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return {
      valid: false,
      error: 'GIF images are not supported. Please use JPEG, PNG, or WebP.',
    };
  }

  return {
    valid: false,
    error: 'Unsupported image signature. Please upload JPEG, PNG, or WebP files.',
  };
}

/**
 * Validates a browser File object's signature and verifies extension/MIME consistency.
 */
export async function validateImageFile(file: File): Promise<MagicByteValidationResult> {
  const ext = getFileExtension(file.name);

  // Read only the first 16 bytes
  const slice = file.slice(0, 16);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const sigResult = validateImageSignature(bytes);
  if (!sigResult.valid || !sigResult.format) {
    return sigResult;
  }

  // Verify extension consistency with detected format
  const expectedExts: Record<ImageFormat, string[]> = {
    jpeg: ['.jpg', '.jpeg'],
    png: ['.png'],
    webp: ['.webp'],
  };

  const allowed = expectedExts[sigResult.format];
  if (!allowed.includes(ext)) {
    return {
      valid: false,
      error: `File extension "${ext}" does not match its detected format (${sigResult.format.toUpperCase()}).`,
    };
  }

  return sigResult;
}

