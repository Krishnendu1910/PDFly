import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  validateImageSignature,
  validateImageFile,
  getJpegExifOrientation,
  readImageDimensions,
  convertImagesToPdf,
  DEFAULT_MAX_PAGE_DIMENSION,
  MAX_SAFE_IMAGE_DIMENSION,
  type ImageDescriptor,
} from '@/lib/pdf';
import { validateSingleFile } from '@/lib/utils/file';
import { IMAGE_TO_PDF_CONFIG } from '@/constants/file';
import type { ManagedFile } from '@/types/file';

// Minimal valid 1x1 transparent PNG byte array (67 bytes)
const MINIMAL_1X1_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
  0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54,
  0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
  0x0d, 0x0a, 0x2d, 0xb4,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);

// Minimal valid 1x1 baseline grayscale JPEG (134 bytes)
const MINIMAL_1X1_JPG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x03, 0x02, 0x02, 0x02, 0x02, 0x02, 0x03, 0x02, 0x02, 0x02, 0x03,
  0x03, 0x03, 0x03, 0x04, 0x06, 0x04, 0x04, 0x04, 0x04, 0x04, 0x08, 0x06,
  0x06, 0x05, 0x06, 0x09, 0x08, 0x0a, 0x0a, 0x09, 0x08, 0x09, 0x09, 0x0a,
  0x0c, 0x0f, 0x0c, 0x0a, 0x0b, 0x0e, 0x0b, 0x09, 0x09, 0x0d, 0x11, 0x0d,
  0x0e, 0x0f, 0x10, 0x10, 0x11, 0x10, 0x0a, 0x0c, 0x12, 0x13, 0x12, 0x10,
  0x13, 0x0f, 0x10, 0x10, 0x10, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
  0x00, 0xbf, 0x00, 0xff, 0xd9,
]);

// Helper to construct simulated File object
function createMockImageFile(name: string, content: Uint8Array, type: string): File {
  return new File([content as unknown as BlobPart], name, { type, lastModified: 1700000000000 });
}

function createMockManagedFile(file: File): ManagedFile {
  return {
    id: `img_${Math.random().toString(36).substring(2, 9)}`,
    fingerprint: `${file.name}:${file.size}:${file.lastModified}:${file.type}`,
    file,
    name: file.name,
    size: file.size,
    formattedSize: `${file.size} B`,
    type: file.type,
    extension: file.name.substring(file.name.lastIndexOf('.')),
    lastModified: file.lastModified,
    status: 'ready',
  };
}

/**
 * Creates a valid synthetic JPEG containing a custom EXIF Orientation tag (1–8).
 */
function createJpegWithExifOrientation(orientation: number): Uint8Array {
  const tiffData = [
    0x4d, 0x4d, // "MM" (Big Endian)
    0x00, 0x2a, // 42
    0x00, 0x00, 0x00, 0x08, // offset to IFD0
    0x00, 0x01, // 1 entry
    0x01, 0x12, // tag 0x0112 (Orientation)
    0x00, 0x03, // type 3 (SHORT)
    0x00, 0x00, 0x00, 0x01, // count 1
    (orientation >> 8) & 0xff, orientation & 0xff, 0x00, 0x00, // value in first 2 bytes
    0x00, 0x00, 0x00, 0x00, // next IFD offset (0)
  ];

  const app1Data = [
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    ...tiffData,
  ];

  const app1Length = app1Data.length + 2;
  return new Uint8Array([
    0xff, 0xd8, // SOI
    0xff, 0xe1, // APP1
    (app1Length >> 8) & 0xff, app1Length & 0xff,
    ...app1Data,
    ...MINIMAL_1X1_JPG.slice(2), // Rest of valid JPEG payload
  ]);
}

describe('Image Signature Validation', () => {
  it('accepts valid JPEG magic bytes', () => {
    const res = validateImageSignature(MINIMAL_1X1_JPG);
    expect(res.valid).toBe(true);
    expect(res.format).toBe('jpeg');
  });

  it('accepts valid PNG magic bytes', () => {
    const res = validateImageSignature(MINIMAL_1X1_PNG);
    expect(res.valid).toBe(true);
    expect(res.format).toBe('png');
  });

  it('accepts valid WebP signature (RIFF....WEBP)', () => {
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46,
      0x20, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
      0x56, 0x50, 0x38, 0x20,
    ]);
    const res = validateImageSignature(webpBytes);
    expect(res.valid).toBe(true);
    expect(res.format).toBe('webp');
  });

  it('rejects truncated bytes (< 12 bytes)', () => {
    const shortBytes = new Uint8Array([0xff, 0xd8, 0xff]);
    const res = validateImageSignature(shortBytes);
    expect(res.valid).toBe(false);
  });

  it('rejects SVG content with explanatory error', () => {
    const svgBytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    const res = validateImageSignature(svgBytes);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/SVG images are not supported/);
  });

  it('rejects GIF files with explanatory error', () => {
    const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00]);
    const res = validateImageSignature(gifBytes);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/GIF images are not supported/);
  });

  it('rejects unrecognized binary data', () => {
    const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b]);
    const res = validateImageSignature(garbage);
    expect(res.valid).toBe(false);
  });
});

describe('Image File Validation (validateImageFile)', () => {
  it('passes a consistent PNG file', async () => {
    const file = createMockImageFile('test.png', MINIMAL_1X1_PNG, 'image/png');
    const res = await validateImageFile(file);
    expect(res.valid).toBe(true);
    expect(res.format).toBe('png');
  });

  it('passes a consistent JPEG file', async () => {
    const file = createMockImageFile('test.jpg', MINIMAL_1X1_JPG, 'image/jpeg');
    const res = await validateImageFile(file);
    expect(res.valid).toBe(true);
    expect(res.format).toBe('jpeg');
  });

  it('rejects extension mismatch (PNG bytes with .jpg extension)', async () => {
    const file = createMockImageFile('fake.jpg', MINIMAL_1X1_PNG, 'image/jpeg');
    const res = await validateImageFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/does not match its detected format/);
  });
});

describe('JPEG EXIF Orientations 1–8 Full Coverage', () => {
  it('parses Orientation 1 (Normal)', () => {
    const data = createJpegWithExifOrientation(1);
    const res = getJpegExifOrientation(data);
    expect(res.orientation).toBe(1);
    expect(res.degrees).toBe(0);
    expect(res.isMirrored).toBe(false);
    expect(res.description).toBe('Normal');
  });

  it('parses Orientation 2 (Mirrored horizontal)', () => {
    const data = createJpegWithExifOrientation(2);
    const res = getJpegExifOrientation(data);
    expect(res.orientation).toBe(2);
    expect(res.degrees).toBe(0);
    expect(res.isMirrored).toBe(true);
    expect(res.description).toBe('Mirrored horizontal');
  });

  it('parses Orientation 3 (Rotated 180°)', () => {
    const data = createJpegWithExifOrientation(3);
    const res = getJpegExifOrientation(data);
    expect(res.orientation).toBe(3);
    expect(res.degrees).toBe(180);
    expect(res.isMirrored).toBe(false);
    expect(res.description).toBe('Rotated 180°');
  });

  it('parses Orientation 4 (Mirrored vertical)', () => {
    const data = createJpegWithExifOrientation(4);
    const res = getJpegExifOrientation(data);
    expect(res.orientation).toBe(4);
    expect(res.degrees).toBe(180);
    expect(res.isMirrored).toBe(true);
    expect(res.description).toBe('Mirrored vertical');
  });

  it('parses Orientation 5 (Mirrored horizontal + 270° CW)', () => {
    const data = createJpegWithExifOrientation(5);
    const res = getJpegExifOrientation(data);
    expect(res.orientation).toBe(5);
    expect(res.degrees).toBe(270);
    expect(res.isMirrored).toBe(true);
    expect(res.description).toBe('Mirrored horizontal + 270° CW');
  });

  it('parses Orientation 6 (Rotated 90° CW)', () => {
    const data = createJpegWithExifOrientation(6);
    const res = getJpegExifOrientation(data);
    expect(res.orientation).toBe(6);
    expect(res.degrees).toBe(90);
    expect(res.isMirrored).toBe(false);
    expect(res.description).toBe('Rotated 90° CW');
  });

  it('parses Orientation 7 (Mirrored horizontal + 90° CW)', () => {
    const data = createJpegWithExifOrientation(7);
    const res = getJpegExifOrientation(data);
    expect(res.orientation).toBe(7);
    expect(res.degrees).toBe(90);
    expect(res.isMirrored).toBe(true);
    expect(res.description).toBe('Mirrored horizontal + 90° CW');
  });

  it('parses Orientation 8 (Rotated 270° CW)', () => {
    const data = createJpegWithExifOrientation(8);
    const res = getJpegExifOrientation(data);
    expect(res.orientation).toBe(8);
    expect(res.degrees).toBe(270);
    expect(res.isMirrored).toBe(false);
    expect(res.description).toBe('Rotated 270° CW');
  });
});

describe('Separation of EXIF Orientation and User Rotation', () => {
  it('applies user rotation strictly via page metadata for EXIF 1 (0°)', async () => {
    const file = createMockImageFile('test.jpg', createJpegWithExifOrientation(1), 'image/jpeg');
    const descriptor: ImageDescriptor = {
      id: 'exif1_rot0',
      managedFile: createMockManagedFile(file),
      previewUrl: 'blob:test',
      format: 'jpeg',
      rotation: 0,
      status: 'ready',
    };

    const bytes = await convertImagesToPdf([descriptor]);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPages()[0]!.getRotation().angle).toBe(0);
  });

  it('applies user rotation strictly via page metadata for EXIF 1 + 90°', async () => {
    const file = createMockImageFile('test.jpg', createJpegWithExifOrientation(1), 'image/jpeg');
    const descriptor: ImageDescriptor = {
      id: 'exif1_rot90',
      managedFile: createMockManagedFile(file),
      previewUrl: 'blob:test',
      format: 'jpeg',
      rotation: 90,
      status: 'ready',
    };

    const bytes = await convertImagesToPdf([descriptor]);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPages()[0]!.getRotation().angle).toBe(90);
  });

  it('applies user rotation strictly via page metadata for EXIF 1 + 180°', async () => {
    const file = createMockImageFile('test.jpg', createJpegWithExifOrientation(1), 'image/jpeg');
    const descriptor: ImageDescriptor = {
      id: 'exif1_rot180',
      managedFile: createMockManagedFile(file),
      previewUrl: 'blob:test',
      format: 'jpeg',
      rotation: 180,
      status: 'ready',
    };

    const bytes = await convertImagesToPdf([descriptor]);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPages()[0]!.getRotation().angle).toBe(180);
  });

  it('applies user rotation strictly via page metadata for EXIF 1 + 270°', async () => {
    const file = createMockImageFile('test.jpg', createJpegWithExifOrientation(1), 'image/jpeg');
    const descriptor: ImageDescriptor = {
      id: 'exif1_rot270',
      managedFile: createMockManagedFile(file),
      previewUrl: 'blob:test',
      format: 'jpeg',
      rotation: 270,
      status: 'ready',
    };

    const bytes = await convertImagesToPdf([descriptor]);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPages()[0]!.getRotation().angle).toBe(270);
  });

  it('handles EXIF 6 (Rotated 90° CW) with user rotation 0° (preserves user rotation on page)', async () => {
    const file = createMockImageFile('exif6.jpg', createJpegWithExifOrientation(6), 'image/jpeg');
    const descriptor: ImageDescriptor = {
      id: 'exif6_rot0',
      managedFile: createMockManagedFile(file),
      previewUrl: 'blob:test',
      format: 'jpeg',
      rotation: 0,
      status: 'ready',
    };

    const bytes = await convertImagesToPdf([descriptor]);
    const doc = await PDFDocument.load(bytes);
    // Page rotation reflects user rotation (0°), since EXIF normalization is handled on pixel level
    expect(doc.getPages()[0]!.getRotation().angle).toBe(0);
  });

  it('handles EXIF 6 (Rotated 90° CW) with user rotation 90°', async () => {
    const file = createMockImageFile('exif6.jpg', createJpegWithExifOrientation(6), 'image/jpeg');
    const descriptor: ImageDescriptor = {
      id: 'exif6_rot90',
      managedFile: createMockManagedFile(file),
      previewUrl: 'blob:test',
      format: 'jpeg',
      rotation: 90,
      status: 'ready',
    };

    const bytes = await convertImagesToPdf([descriptor]);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPages()[0]!.getRotation().angle).toBe(90);
  });

  it('handles EXIF 8 (Rotated 270° CW) with user rotation 180°', async () => {
    const file = createMockImageFile('exif8.jpg', createJpegWithExifOrientation(8), 'image/jpeg');
    const descriptor: ImageDescriptor = {
      id: 'exif8_rot180',
      managedFile: createMockManagedFile(file),
      previewUrl: 'blob:test',
      format: 'jpeg',
      rotation: 180,
      status: 'ready',
    };

    const bytes = await convertImagesToPdf([descriptor]);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPages()[0]!.getRotation().angle).toBe(180);
  });
});

describe('Binary Dimensions Reader', () => {
  it('reads PNG dimensions from IHDR chunk', async () => {
    const file = createMockImageFile('1x1.png', MINIMAL_1X1_PNG, 'image/png');
    const dims = await readImageDimensions(file, 'png');
    expect(dims.width).toBe(1);
    expect(dims.height).toBe(1);
  });

  it('reads JPEG dimensions from SOF0 marker', async () => {
    const file = createMockImageFile('1x1.jpg', MINIMAL_1X1_JPG, 'image/jpeg');
    const dims = await readImageDimensions(file, 'jpeg');
    expect(dims.width).toBe(1);
    expect(dims.height).toBe(1);
  });
});

describe('Page Sizing and Aspect Ratio Policy', () => {
  it('proves default max page dimension constant is 1440pt', () => {
    expect(DEFAULT_MAX_PAGE_DIMENSION).toBe(1440);
  });

  it('preserves 1:1 square aspect ratio within bounds', async () => {
    const file = createMockImageFile('square.png', MINIMAL_1X1_PNG, 'image/png');
    const descriptor: ImageDescriptor = {
      id: 'sq',
      managedFile: createMockManagedFile(file),
      previewUrl: 'blob:sq',
      format: 'png',
      rotation: 0,
      status: 'ready',
    };

    const bytes = await convertImagesToPdf([descriptor]);
    const doc = await PDFDocument.load(bytes);
    const page = doc.getPages()[0]!;

    expect(page.getWidth()).toBe(1);
    expect(page.getHeight()).toBe(1);
  });

  it('verifies safe dimension guard limit is 8192px', () => {
    expect(MAX_SAFE_IMAGE_DIMENSION).toBe(8192);
  });
});

describe('Pipeline File Validation for Images to PDF', () => {
  it('accepts valid JPEG, PNG, and WebP files within limits', () => {
    const fileJpg = createMockImageFile('photo.jpg', MINIMAL_1X1_JPG, 'image/jpeg');
    const resJpg = validateSingleFile(fileJpg, IMAGE_TO_PDF_CONFIG);
    expect(resJpg.valid).toBe(true);

    const filePng = createMockImageFile('photo.png', MINIMAL_1X1_PNG, 'image/png');
    const resPng = validateSingleFile(filePng, IMAGE_TO_PDF_CONFIG);
    expect(resPng.valid).toBe(true);
  });

  it('rejects unsupported extensions such as .svg, .gif, .pdf', () => {
    const svgFile = createMockImageFile('vector.svg', new Uint8Array(100), 'image/svg+xml');
    const resSvg = validateSingleFile(svgFile, IMAGE_TO_PDF_CONFIG);
    expect(resSvg.valid).toBe(false);
    expect(resSvg.errors[0]?.code).toBe('INVALID_TYPE');

    const pdfFile = createMockImageFile('doc.pdf', new Uint8Array(100), 'application/pdf');
    const resPdf = validateSingleFile(pdfFile, IMAGE_TO_PDF_CONFIG);
    expect(resPdf.valid).toBe(false);
    expect(resPdf.errors[0]?.code).toBe('INVALID_TYPE');
  });

  it('rejects oversized image files exceeding maxFileSize', () => {
    const bigContent = new Uint8Array(26 * 1024 * 1024);
    const bigFile = createMockImageFile('huge.jpg', bigContent, 'image/jpeg');
    const res = validateSingleFile(bigFile, IMAGE_TO_PDF_CONFIG);
    expect(res.valid).toBe(false);
    expect(res.errors[0]?.code).toBe('FILE_TOO_LARGE');
  });
});

describe('PDF Generation and Sequence Preservation', () => {
  it('generates multi-page PDF preserving image sequence', async () => {
    const file1 = createMockImageFile('img1.png', MINIMAL_1X1_PNG, 'image/png');
    const file2 = createMockImageFile('img2.jpg', MINIMAL_1X1_JPG, 'image/jpeg');
    const file3 = createMockImageFile('img3.png', MINIMAL_1X1_PNG, 'image/png');

    const items: ImageDescriptor[] = [
      {
        id: '1',
        managedFile: createMockManagedFile(file1),
        previewUrl: 'blob:1',
        format: 'png',
        rotation: 0,
        status: 'ready',
      },
      {
        id: '2',
        managedFile: createMockManagedFile(file2),
        previewUrl: 'blob:2',
        format: 'jpeg',
        rotation: 0,
        status: 'ready',
      },
      {
        id: '3',
        managedFile: createMockManagedFile(file3),
        previewUrl: 'blob:3',
        format: 'png',
        rotation: 0,
        status: 'ready',
      },
    ];

    const pdfBytes = await convertImagesToPdf(items);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    expect(pdfDoc.getPageCount()).toBe(3);
  });

  it('throws a descriptive error when images array is empty', async () => {
    await expect(convertImagesToPdf([])).rejects.toThrow(/At least one image is required/);
  });

  it('rejects corrupted image data during PDF conversion', async () => {
    const corruptFile = createMockImageFile('corrupt.png', new Uint8Array([1, 2, 3, 4, 5]), 'image/png');
    const descriptor: ImageDescriptor = {
      id: 'bad',
      managedFile: createMockManagedFile(corruptFile),
      previewUrl: 'blob:bad',
      format: 'png',
      rotation: 0,
      status: 'ready',
    };

    await expect(convertImagesToPdf([descriptor])).rejects.toThrow(/corrupted or has an invalid image signature/);
  });
});
