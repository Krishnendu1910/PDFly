import { PdfOperationError } from '../types';

/**
 * Sanitizes a filename for safe client-side browser downloading.
 * Preserves valid Unicode letters, numbers, spaces, dots, and hyphens/underscores.
 * Strips path separators, directory traversal sequences, control characters, and reserved filesystem characters.
 * Enforces a maximum base filename length (120 characters) and ensures a single `.pdf` extension.
 */
export function sanitizeDownloadFilename(name: string, fallback = 'document.pdf'): string {
  if (!name || typeof name !== 'string') return fallback;

  // Extract basename (strip all directory components and path traversal)
  const parts = name.split(/[/\\]/).filter((p) => p && p !== '.' && p !== '..');
  const rawBase = parts.pop() || fallback;

  // Remove illegal filesystem and control characters:
  // Control chars (0x00-0x1f, 0x7f) and [<>:"/\\|?*]
  // eslint-disable-next-line no-control-regex
  let clean = rawBase.replace(/[\x00-\x1f\x7f<>:"/\\|?*]/g, '_');

  // Strip trailing spaces and dots
  clean = clean.trim().replace(/[. ]+$/, '');

  if (!clean) return fallback;

  // Remove all trailing .pdf extensions (case-insensitive) so we never duplicate extensions
  let baseWithoutExt = clean.replace(/(\.pdf)+$/i, '');

  // Collapse multiple consecutive spaces or underscores and trim trailing separators
  baseWithoutExt = baseWithoutExt
    .replace(/\s+/g, ' ')
    .replace(/_+/g, '_')
    .replace(/[._ ]+$/, '')
    .trim();

  // Cap filename base length (120 chars) to prevent OS filesystem limits
  if (baseWithoutExt.length > 120) {
    baseWithoutExt = baseWithoutExt.slice(0, 120).trim();
  }

  // Neutralize Windows DOS reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(baseWithoutExt)) {
    baseWithoutExt = `_${baseWithoutExt}`;
  }

  if (!baseWithoutExt) return fallback;

  return `${baseWithoutExt}.pdf`;
}

/**
 * Triggers a browser file download from in-memory byte array or Blob.
 * Validates the PDF magic byte signature before initiating download to prevent downloading corrupt output.
 * Automatically cleans up the ephemeral Object URL to prevent memory leaks.
 */
export function downloadPdfBytes(
  bytes: Uint8Array | ArrayBuffer,
  filename: string,
): void {
  const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (!uint8 || uint8.length < 5) {
    throw new PdfOperationError('INVALID_PDF', 'Cannot download empty or truncated PDF output.');
  }

  // Validate standard PDF magic bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  if (
    uint8[0] !== 0x25 ||
    uint8[1] !== 0x50 ||
    uint8[2] !== 0x44 ||
    uint8[3] !== 0x46 ||
    uint8[4] !== 0x2d
  ) {
    throw new PdfOperationError(
      'INVALID_PDF',
      'Cannot download output: Generated data lacks valid PDF header signature.',
    );
  }

  const safeName = sanitizeDownloadFilename(filename, 'document.pdf');
  const buffer = uint8.buffer as ArrayBuffer;
  const blob = new Blob([buffer], { type: 'application/pdf' });
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = safeName;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Schedule cleanup after the browser processes the download click
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}
