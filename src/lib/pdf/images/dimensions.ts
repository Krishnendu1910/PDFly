import type { ImageDimensions, ImageFormat } from './types';

/**
 * Reads natural image dimensions (width, height) quickly from binary headers.
 * Supports PNG, JPEG, and WebP. Falls back to browser Image decoding if needed.
 */
export async function readImageDimensions(file: File, format?: ImageFormat): Promise<ImageDimensions> {
  try {
    // Read first 64KB for binary headers
    const slice = file.slice(0, 65536);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Try PNG header
    if (format === 'png' || (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e)) {
      const dims = parsePngDimensions(bytes);
      if (dims) return dims;
    }

    // Try JPEG header
    if (format === 'jpeg' || (bytes[0] === 0xff && bytes[1] === 0xd8)) {
      const dims = parseJpegDimensions(bytes);
      if (dims) return dims;
    }

    // Try WebP header
    if (format === 'webp' || (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46)) {
      const dims = parseWebpDimensions(bytes);
      if (dims) return dims;
    }
  } catch {
    // Fall back to browser Image / createImageBitmap
  }

  // Fallback to browser decoding
  return decodeDimensionsViaBrowser(file);
}

function parsePngDimensions(bytes: Uint8Array): ImageDimensions | null {
  // IHDR chunk starts at byte 12. Width is at 16..19, Height is at 20..23 (Big Endian)
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  if (width > 0 && height > 0) {
    return { width, height };
  }
  return null;
}

function parseJpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  const length = bytes.length;

  while (offset < length - 8) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = bytes[offset + 1]!;
    // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2) contain height and width
    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7
    ) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const height = view.getUint16(offset + 5, false);
      const width = view.getUint16(offset + 7, false);
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }

    if (marker === 0xd9 || marker === 0xda) break; // EOI or SOS

    const segmentLength = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
    if (segmentLength < 2) break;
    offset += 2 + segmentLength;
  }

  return null;
}

function parseWebpDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 30) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Check RIFF and WEBP
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff !== 'RIFF' || webp !== 'WEBP') return null;

  const chunkHeader = String.fromCharCode(...bytes.slice(12, 16));

  // Lossy VP8
  if (chunkHeader === 'VP8 ') {
    const keyframe = bytes[23];
    // Start code 0x9d 0x01 0x2a
    if (bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      const width = view.getUint16(26, true) & 0x3fff;
      const height = view.getUint16(28, true) & 0x3fff;
      return { width, height };
    }
    if (keyframe !== undefined) {
      const width = view.getUint16(26, true) & 0x3fff;
      const height = view.getUint16(28, true) & 0x3fff;
      if (width > 0 && height > 0) return { width, height };
    }
  }

  // Lossless VP8L
  if (chunkHeader === 'VP8L') {
    if (bytes[20] === 0x2f) {
      const b0 = bytes[21]!;
      const b1 = bytes[22]!;
      const b2 = bytes[23]!;
      const b3 = bytes[24]!;
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + ((((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)));
      return { width, height };
    }
  }

  // Extended VP8X
  if (chunkHeader === 'VP8X' && bytes.length >= 30) {
    const width = 1 + (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16));
    const height = 1 + (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16));
    return { width, height };
  }

  return null;
}

async function decodeDimensionsViaBrowser(file: File): Promise<ImageDimensions> {
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file);
      const dims = { width: bitmap.width, height: bitmap.height };
      bitmap.close?.();
      return dims;
    } catch {
      // Continue to Image fallback
    }
  }

  if (typeof Image !== 'undefined') {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to decode image dimensions for "${file.name}".`));
      };
      img.src = url;
    });
  }

  // If running in headless environment without canvas/image
  return { width: 800, height: 600 };
}

