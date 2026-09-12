import type { FileValidationConfig, FileValidationError, ManagedFile } from '@/types/file';
import { formatFileSize } from '@/lib/utils/file';
import { DEFAULT_MAX_FILES } from '@/constants/file';

export interface PipelineMetrics {
  totalBytes: number;
  formattedTotalSize: string;
  count: number;
  hasFiles: boolean;
  canAddMore: boolean;
  isValidForAction: boolean;
  minFilesRequired: number;
  maxFilesAllowed: number;
}

/**
 * Computes derived metrics and validation state for a collection of managed files.
 */
export function computePipelineMetrics(
  files: readonly ManagedFile[],
  config?: FileValidationConfig,
): PipelineMetrics {
  const maxFilesAllowed = config?.maxFiles ?? DEFAULT_MAX_FILES;
  const minFilesRequired = config?.minFiles ?? 1;
  const count = files.length;
  const totalBytes = files.reduce((acc, curr) => acc + curr.size, 0);

  return {
    totalBytes,
    formattedTotalSize: formatFileSize(totalBytes),
    count,
    hasFiles: count > 0,
    canAddMore: count < maxFilesAllowed,
    isValidForAction: count >= minFilesRequired && count <= maxFilesAllowed,
    minFilesRequired,
    maxFilesAllowed,
  };
}

/**
 * Pure function to reorder items in an immutable array.
 * Safely guards against out-of-bounds indices and no-op moves.
 */
export function reorderFileList(
  files: readonly ManagedFile[],
  fromIndex: number,
  toIndex: number,
): ManagedFile[] {
  if (
    fromIndex < 0 ||
    fromIndex >= files.length ||
    toIndex < 0 ||
    toIndex >= files.length ||
    fromIndex === toIndex
  ) {
    return [...files];
  }

  const result = [...files];
  const [movedItem] = result.splice(fromIndex, 1);
  if (movedItem) {
    result.splice(toIndex, 0, movedItem);
  }
  return result;
}

/**
 * Pure function to remove a file and any associated file-specific errors.
 */
export function removeFileFromList(
  files: readonly ManagedFile[],
  errors: readonly FileValidationError[],
  idToRemove: string,
): { updatedFiles: ManagedFile[]; updatedErrors: FileValidationError[] } {
  const fileToRemove = files.find((f) => f.id === idToRemove);
  const updatedFiles = files.filter((f) => f.id !== idToRemove);
  const updatedErrors = fileToRemove
    ? errors.filter((err) => err.fileName !== fileToRemove.name)
    : [...errors];

  return { updatedFiles, updatedErrors };
}

