import type { FileValidationConfig } from '@/types/file';

export const FILE_MIME_TYPES = {
  PDF: 'application/pdf',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
} as const;

export const FILE_EXTENSIONS = {
  PDF: ['.pdf'],
  IMAGES: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

/** Default maximum file size: 50 MB (in bytes) to prevent client-side browser memory crashes */
export const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Default maximum number of files per batch operation */
export const DEFAULT_MAX_FILES = 25;

/** Standard validation configuration for tools accepting only PDF files */
export const PDF_ONLY_CONFIG: Readonly<FileValidationConfig> = {
  acceptMimeTypes: [FILE_MIME_TYPES.PDF],
  acceptExtensions: FILE_EXTENSIONS.PDF,
  maxFileSize: DEFAULT_MAX_FILE_SIZE,
  maxFiles: DEFAULT_MAX_FILES,
  minFiles: 1,
  allowDuplicates: false,
  allowEmpty: false,
};

/** Specific validation configuration for Merge PDF (requires at least 2 files) */
export const MERGE_PDF_CONFIG: Readonly<FileValidationConfig> = {
  ...PDF_ONLY_CONFIG,
  minFiles: 2,
  maxFiles: 30,
};

/** Specific validation configuration for Images to PDF */
export const IMAGE_TO_PDF_CONFIG: Readonly<FileValidationConfig> = {
  acceptMimeTypes: [FILE_MIME_TYPES.JPEG, FILE_MIME_TYPES.PNG, FILE_MIME_TYPES.WEBP],
  acceptExtensions: FILE_EXTENSIONS.IMAGES,
  maxFileSize: 25 * 1024 * 1024, // 25 MB per image
  maxFiles: 50,
  minFiles: 1,
  allowDuplicates: false,
  allowEmpty: false,
};

/** Specific validation configuration for Compress PDF (single PDF file) */
export const COMPRESS_PDF_CONFIG: Readonly<FileValidationConfig> = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};
