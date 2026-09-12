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

  // Remove .pdf extension if present so we can cap the base name cleanly
  const hasPdfExt = clean.toLowerCase().endsWith('.pdf');
  let baseWithoutExt = hasPdfExt ? clean.slice(0, -4) : clean;

  // Collapse multiple consecutive spaces or underscores
  baseWithoutExt = baseWithoutExt.replace(/\s+/g, ' ').replace(/_+/g, '_').trim();

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
 * Automatically cleans up the ephemeral Object URL to prevent memory leaks.
 */
export function downloadPdfBytes(
  bytes: Uint8Array | ArrayBuffer,
  filename: string,
): void {
  const safeName = sanitizeDownloadFilename(filename, 'document.pdf');
  const buffer = bytes instanceof Uint8Array ? (bytes.buffer as ArrayBuffer) : bytes;
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
