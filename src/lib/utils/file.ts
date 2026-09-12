import type {
  FileValidationConfig,
  FileValidationError,
  FileValidationResult,
  FileBatchValidationResult,
  ManagedFile,
} from '@/types/file';
import { DEFAULT_MAX_FILE_SIZE, DEFAULT_MAX_FILES } from '@/constants/file';

/**
 * Formats byte values into human-readable strings (e.g., '1.5 MB', '340 KB', '0 B').
 */
export function formatFileSize(bytes: number, decimals = 1): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);

  if (safeIndex === 0) {
    return `${bytes} B`;
  }

  const value = parseFloat((bytes / Math.pow(k, safeIndex)).toFixed(dm));
  return `${value} ${sizes[safeIndex]}`;
}

/**
 * Extracts normalized lowercase file extension including leading dot (e.g., '.pdf').
 */
export function getFileExtension(filename: string): string {
  if (!filename) return '';
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.substring(lastDotIndex).toLowerCase();
}

/**
 * Generates a unique, runtime-stable identifier for an ingested file instance.
 *
 * Guarantees:
 * - Unique across all files ingested during the application session
 * - Stable across reorders and removals
 * - Safe for React list keying
 * - Zero binary reads, zero memory overhead (no ArrayBuffer / Blob / base64)
 */
export function generateRuntimeId(prefix = 'file'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // Safe fallback if crypto.randomUUID is unavailable
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${randomPart}`;
}

/**
 * Computes a lightweight metadata fingerprint used exclusively for duplicate detection.
 *
 * NOTE ON DUPLICATE SEMANTICS:
 * This fingerprint is a metadata heuristic (exact raw filename, byte size, lastModified timestamp, and MIME type),
 * NOT a cryptographic content hash (such as SHA-256).
 *
 * Key Design Principles:
 * 1. Exact Raw Filename: Uses file.name directly without lossy character substitution (e.g., 'my/file.pdf' vs 'my_file.pdf'
 *    remain distinct, preventing false-positive duplicate collisions).
 * 2. Immediate Responsiveness: Generates synchronously in microseconds during drag-and-drop or file picking.
 * 3. Zero Memory Overhead: Avoids reading gigabytes of binary data into browser memory (ArrayBuffer / Blob)
 *    simply to check for duplicate items during initial user selection.
 * 4. Client Protection: Prevents browser tab freezes, memory exhaustion, and garbage collection spikes.
 */
export function createFileFingerprint(file: File): string {
  const mime = file.type || 'application/octet-stream';
  return `${file.name}:${file.size}:${file.lastModified}:${mime}`;
}

/**
 * @deprecated Use generateRuntimeId for internal identity or createFileFingerprint for duplicate detection.
 */
export const generateFileId = createFileFingerprint;

/**
 * Checks whether a given file matches the allowed MIME types or extensions.
 */
export function isFileTypeAccepted(file: File, config: FileValidationConfig): boolean {
  const { acceptMimeTypes, acceptExtensions } = config;

  // If no type filters defined, accept all
  if (!acceptMimeTypes?.length && !acceptExtensions?.length) {
    return true;
  }

  const fileExt = getFileExtension(file.name);

  // If extensions are configured, the file extension MUST match
  if (acceptExtensions?.length) {
    const extMatches = acceptExtensions.some((ext) => {
      const normalizedExt = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
      return normalizedExt === fileExt;
    });
    if (!extMatches) {
      return false;
    }
  }

  // If MIME types are configured and browser reported a non-empty MIME type, it must match
  if (acceptMimeTypes?.length && file.type) {
    const fileMime = file.type.toLowerCase();
    const mimeMatches = acceptMimeTypes.some((mime) => {
      const lowerMime = mime.toLowerCase();
      if (lowerMime.endsWith('/*')) {
        const prefix = lowerMime.slice(0, -1);
        return fileMime.startsWith(prefix);
      }
      return lowerMime === fileMime;
    });
    if (!mimeMatches) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a single file against configuration and existing files.
 */
export function validateSingleFile(
  file: File,
  config: FileValidationConfig,
  existingFiles: readonly ManagedFile[] = [],
): FileValidationResult {
  const errors: FileValidationError[] = [];
  const maxFileSize = config.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;

  // 1. Empty file check
  if (file.size === 0 && !config.allowEmpty) {
    errors.push({
      code: 'FILE_EMPTY',
      message: `The file "${file.name}" is empty (0 bytes).`,
      fileName: file.name,
    });
  }

  // 2. File size check
  if (file.size > maxFileSize) {
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `"${file.name}" (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${formatFileSize(maxFileSize)}.`,
      fileName: file.name,
      details: `Maximum allowed size is ${formatFileSize(maxFileSize)}.`,
    });
  }

  // 3. File type check
  if (!isFileTypeAccepted(file, config)) {
    const allowed = [
      ...(config.acceptExtensions ?? []),
      ...(config.acceptMimeTypes ?? []),
    ].join(', ');

    errors.push({
      code: 'INVALID_TYPE',
      message: `"${file.name}" is not a supported file type.`,
      fileName: file.name,
      details: allowed ? `Accepted types: ${allowed}` : undefined,
    });
  }

  // 4. Duplicate file check using dedicated metadata fingerprint
  if (!config.allowDuplicates && existingFiles.length > 0) {
    const candidateFingerprint = createFileFingerprint(file);
    const isDuplicate = existingFiles.some(
      (existing) => (existing.fingerprint || createFileFingerprint(existing.file)) === candidateFingerprint,
    );
    if (isDuplicate) {
      errors.push({
        code: 'DUPLICATE_FILE',
        message: `"${file.name}" has identical metadata (name, size, and timestamp) to a file already in your selection.`,
        fileName: file.name,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a batch of files, checking individual file validity and batch constraints.
 */
export function validateBatch(
  newFiles: readonly File[],
  config: FileValidationConfig,
  currentFiles: readonly ManagedFile[] = [],
): FileBatchValidationResult {
  const maxFiles = config.maxFiles ?? DEFAULT_MAX_FILES;
  const validFiles: ManagedFile[] = [];
  const rejectedFiles: { file: File; errors: FileValidationError[] }[] = [];

  // Track simulated list for cumulative duplicate checking during this batch
  const cumulativeFiles: ManagedFile[] = [...currentFiles];

  for (const file of newFiles) {
    // Check batch file count limit
    if (cumulativeFiles.length >= maxFiles) {
      rejectedFiles.push({
        file,
        errors: [
          {
            code: 'TOO_MANY_FILES',
            message: `Cannot add "${file.name}". The maximum limit of ${maxFiles} files has been reached.`,
            fileName: file.name,
          },
        ],
      });
      continue;
    }

    const result = validateSingleFile(file, config, cumulativeFiles);

    if (result.valid) {
      const managedFile: ManagedFile = {
        id: generateRuntimeId(),
        fingerprint: createFileFingerprint(file),
        file,
        name: file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
        extension: getFileExtension(file.name),
        lastModified: file.lastModified,
        status: 'ready',
      };

      validFiles.push(managedFile);
      cumulativeFiles.push(managedFile);
    } else {
      rejectedFiles.push({
        file,
        errors: result.errors,
      });
    }
  }

  return {
    validFiles,
    rejectedFiles,
  };
}
