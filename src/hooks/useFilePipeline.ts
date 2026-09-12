import { useState, useCallback, useMemo } from 'react';
import type {
  FileValidationConfig,
  FileValidationError,
  ManagedFile,
} from '@/types/file';
import { validateBatch } from '@/lib/utils/file';
import {
  computePipelineMetrics,
  reorderFileList,
  removeFileFromList,
} from '@/lib/utils/pipeline';

export interface UseFilePipelineOptions {
  config?: FileValidationConfig;
  initialFiles?: ManagedFile[];
  onFilesChange?: (files: ManagedFile[]) => void;
  onError?: (errors: FileValidationError[]) => void;
}

export interface UseFilePipelineReturn {
  files: ManagedFile[];
  errors: FileValidationError[];
  isDragOver: boolean;
  totalBytes: number;
  formattedTotalSize: string;
  count: number;
  hasFiles: boolean;
  canAddMore: boolean;
  isValidForAction: boolean;
  minFilesRequired: number;
  maxFilesAllowed: number;
  addFiles: (incoming: FileList | File[] | null | undefined) => {
    addedCount: number;
    rejectedCount: number;
  };
  removeFile: (id: string) => void;
  clearFiles: () => void;
  clearErrors: () => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  setIsDragOver: (isOver: boolean) => void;
}

export function useFilePipeline(options: UseFilePipelineOptions = {}): UseFilePipelineReturn {
  const { config = {}, initialFiles = [], onFilesChange, onError } = options;
  const [files, setFiles] = useState<ManagedFile[]>(initialFiles);
  const [errors, setErrors] = useState<FileValidationError[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const metrics = useMemo(() => {
    return computePipelineMetrics(files, config);
  }, [files, config]);

  const addFiles = useCallback(
    (incoming: FileList | File[] | null | undefined) => {
      if (!incoming || incoming.length === 0) {
        return { addedCount: 0, rejectedCount: 0 };
      }

      const fileArray: File[] = Array.from(incoming);
      const batchResult = validateBatch(fileArray, config, files);

      if (batchResult.rejectedFiles.length > 0) {
        const newErrors = batchResult.rejectedFiles.flatMap((r) => r.errors);
        setErrors((prev) => [...prev, ...newErrors]);
        onError?.(newErrors);
      }

      if (batchResult.validFiles.length > 0) {
        setFiles((prev) => {
          const updated = [...prev, ...batchResult.validFiles];
          onFilesChange?.(updated);
          return updated;
        });
      }

      return {
        addedCount: batchResult.validFiles.length,
        rejectedCount: batchResult.rejectedFiles.length,
      };
    },
    [config, files, onFilesChange, onError],
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prevFiles) => {
        setErrors((prevErrors) => {
          const { updatedFiles, updatedErrors } = removeFileFromList(prevFiles, prevErrors, id);
          onFilesChange?.(updatedFiles);
          return updatedErrors;
        });
        const { updatedFiles } = removeFileFromList(prevFiles, [], id);
        return updatedFiles;
      });
    },
    [onFilesChange],
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
    setErrors([]);
    onFilesChange?.([]);
  }, [onFilesChange]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const reorderFiles = useCallback(
    (fromIndex: number, toIndex: number) => {
      setFiles((prev) => {
        const updated = reorderFileList(prev, fromIndex, toIndex);
        if (updated !== prev) {
          onFilesChange?.(updated);
        }
        return updated;
      });
    },
    [onFilesChange],
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index > 0) {
        reorderFiles(index, index - 1);
      }
    },
    [reorderFiles],
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index < files.length - 1) {
        reorderFiles(index, index + 1);
      }
    },
    [files.length, reorderFiles],
  );

  return {
    files,
    errors,
    isDragOver,
    totalBytes: metrics.totalBytes,
    formattedTotalSize: metrics.formattedTotalSize,
    count: metrics.count,
    hasFiles: metrics.hasFiles,
    canAddMore: metrics.canAddMore,
    isValidForAction: metrics.isValidForAction,
    minFilesRequired: metrics.minFilesRequired,
    maxFilesAllowed: metrics.maxFilesAllowed,
    addFiles,
    removeFile,
    clearFiles,
    clearErrors,
    reorderFiles,
    moveUp,
    moveDown,
    setIsDragOver,
  };
}

