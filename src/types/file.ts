export type FileStatus =
  | 'idle'
  | 'validating'
  | 'ready'
  | 'processing'
  | 'completed'
  | 'error';

export type FileValidationErrorCode =
  | 'INVALID_TYPE'
  | 'FILE_TOO_LARGE'
  | 'FILE_EMPTY'
  | 'DUPLICATE_FILE'
  | 'TOO_MANY_FILES'
  | 'TOO_FEW_FILES'
  | 'UNKNOWN_ERROR';

export interface FileValidationError {
  code: FileValidationErrorCode;
  message: string;
  fileName?: string;
  details?: string;
}

export interface ManagedFile {
  /** Unique internal runtime identifier for session tracking and React keying */
  id: string;
  /** Lightweight metadata fingerprint used exclusively for duplicate detection */
  fingerprint: string;
  /** Primary reference to native browser File object (no binary duplication in state) */
  file: File;
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  extension: string;
  lastModified: number;
  status: FileStatus;
  errors?: FileValidationError[];
}

export interface FileValidationConfig {
  /** Allowed MIME types, e.g. ['application/pdf'] */
  acceptMimeTypes?: readonly string[];
  /** Allowed file extensions, e.g. ['.pdf'] */
  acceptExtensions?: readonly string[];
  /** Maximum file size allowed in bytes */
  maxFileSize?: number;
  /** Maximum total number of files in the batch */
  maxFiles?: number;
  /** Minimum number of files required for an operation */
  minFiles?: number;
  /** Whether duplicate files are permitted (default: false) */
  allowDuplicates?: boolean;
  /** Whether 0-byte empty files are permitted (default: false) */
  allowEmpty?: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  errors: FileValidationError[];
}

export interface FileBatchValidationResult {
  validFiles: ManagedFile[];
  rejectedFiles: {
    file: File;
    errors: FileValidationError[];
  }[];
}

