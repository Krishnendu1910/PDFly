/**
 * Lightweight EXIF orientation parser for JPEG images.
 * Pure binary parsing without third-party dependencies or memory bloat.
 */

export interface ExifOrientationResult {
  /** Raw EXIF Orientation value (1 to 8, where 1 = Normal) */
  orientation: number;
  /** Effective rotation in degrees (0, 90, 180, 270) */
  degrees: 0 | 90 | 180 | 270;
  /** Whether the orientation involves mirroring / reflection */
  isMirrored: boolean;
  /** Standard human-readable EXIF description */
  description: string;
}

const EXIF_DESCRIPTIONS: Record<number, { degrees: 0 | 90 | 180 | 270; isMirrored: boolean; description: string }> = {
  1: { degrees: 0, isMirrored: false, description: 'Normal' },
  2: { degrees: 0, isMirrored: true, description: 'Mirrored horizontal' },
  3: { degrees: 180, isMirrored: false, description: 'Rotated 180°' },
  4: { degrees: 180, isMirrored: true, description: 'Mirrored vertical' },
  5: { degrees: 270, isMirrored: true, description: 'Mirrored horizontal + 270° CW' },
  6: { degrees: 90, isMirrored: false, description: 'Rotated 90° CW' },
  7: { degrees: 90, isMirrored: true, description: 'Mirrored horizontal + 90° CW' },
  8: { degrees: 270, isMirrored: false, description: 'Rotated 270° CW' },
};

/**
 * Extracts EXIF orientation from JPEG buffer if present.
 * Returns default Normal (1) if not found or not JPEG.
 */
export function getJpegExifOrientation(bytes: Uint8Array): ExifOrientationResult {
  const defaultResult: ExifOrientationResult = {
    orientation: 1,
    degrees: 0,
    isMirrored: false,
    description: 'Normal',
  };

  if (!bytes || bytes.length < 14) return defaultResult;
  // Check SOI marker 0xFF 0xD8
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return defaultResult;

  let offset = 2;
  const length = bytes.length;

  while (offset < length - 4) {
    if (bytes[offset] !== 0xff) break;

    const marker = bytes[offset + 1];
    // SOS marker (0xDA) or EOI (0xD9) means headers have ended
    if (marker === 0xda || marker === 0xd9) break;

    const segmentLength = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
    if (segmentLength < 2) break;

    // APP1 marker is 0xE1
    if (marker === 0xe1) {
      const app1Start = offset + 4;
      // Check Exif header: 'E' 'x' 'i' 'f' 0x00 0x00
      if (
        bytes[app1Start] === 0x45 &&
        bytes[app1Start + 1] === 0x78 &&
        bytes[app1Start + 2] === 0x69 &&
        bytes[app1Start + 3] === 0x66 &&
        bytes[app1Start + 4] === 0x00 &&
        bytes[app1Start + 5] === 0x00
      ) {
        const tiffStart = app1Start + 6;
        return parseTiffOrientation(bytes, tiffStart);
      }
    }

    offset += 2 + segmentLength;
  }

  return defaultResult;
}

function parseTiffOrientation(bytes: Uint8Array, tiffStart: number): ExifOrientationResult {
  const defaultResult: ExifOrientationResult = {
    orientation: 1,
    degrees: 0,
    isMirrored: false,
    description: 'Normal',
  };

  if (tiffStart + 8 > bytes.length) return defaultResult;

  const byteOrder1 = bytes[tiffStart];
  const byteOrder2 = bytes[tiffStart + 1];

  let isLittleEndian = false;
  if (byteOrder1 === 0x49 && byteOrder2 === 0x49) {
    isLittleEndian = true; // "II"
  } else if (byteOrder1 === 0x4d && byteOrder2 === 0x4d) {
    isLittleEndian = false; // "MM"
  } else {
    return defaultResult;
  }

  const readUint16 = (pos: number): number => {
    if (pos + 2 > bytes.length) return 0;
    return isLittleEndian
      ? bytes[pos]! | (bytes[pos + 1]! << 8)
      : (bytes[pos]! << 8) | bytes[pos + 1]!;
  };

  const readUint32 = (pos: number): number => {
    if (pos + 4 > bytes.length) return 0;
    return isLittleEndian
      ? (bytes[pos]! | (bytes[pos + 1]! << 8) | (bytes[pos + 2]! << 16) | (bytes[pos + 3]! << 24)) >>> 0
      : ((bytes[pos]! << 24) | (bytes[pos + 1]! << 16) | (bytes[pos + 2]! << 8) | bytes[pos + 3]!) >>> 0;
  };

  // Magic 42
  if (readUint16(tiffStart + 2) !== 42) return defaultResult;

  const firstIfdOffset = readUint32(tiffStart + 4);
  let ifdOffset = tiffStart + firstIfdOffset;

  if (ifdOffset + 2 > bytes.length) return defaultResult;
  const numEntries = readUint16(ifdOffset);
  ifdOffset += 2;

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + i * 12;
    if (entryOffset + 12 > bytes.length) break;

    const tag = readUint16(entryOffset);
    // 0x0112 is Orientation tag
    if (tag === 0x0112) {
      const orientationVal = readUint16(entryOffset + 8);
      const mapped = EXIF_DESCRIPTIONS[orientationVal];
      if (mapped) {
        return {
          orientation: orientationVal,
          degrees: mapped.degrees,
          isMirrored: mapped.isMirrored,
          description: mapped.description,
        };
      }
      return {
        orientation: orientationVal,
        degrees: 0,
        isMirrored: false,
        description: `Custom (${orientationVal})`,
      };
    }
  }

  return defaultResult;
}
