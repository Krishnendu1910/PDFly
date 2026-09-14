export type PdfRotationAngle = 0 | 90 | 180 | 270;

export type PdfErrorCode =
  | 'INVALID_PDF'
  | 'CORRUPT_PDF'
  | 'ENCRYPTED_PDF'
  | 'INVALID_PAGE_RANGE'
  | 'OUT_OF_BOUNDS_PAGE'
  | 'RENDER_FAILED'
  | 'PROCESSING_FAILED'
  | 'ENGINE_LOAD_FAILED'
  | 'LIMIT_EXCEEDED'
  | 'INCORRECT_PASSWORD'
  | 'NOT_ENCRYPTED'
  | 'ALREADY_PROTECTED';

export class PdfOperationError extends Error {
  readonly code: PdfErrorCode;
  readonly details?: string;

  constructor(code: PdfErrorCode, message: string, details?: string) {
    super(message);
    this.name = 'PdfOperationError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, PdfOperationError.prototype);
  }
}

export interface PdfPageDescriptor {
  /** Stable unique runtime identifier for React keying across reorders */
  id: string;
  /** 1-based page number */
  pageNumber: number;
  /** 0-based initial original index in source document */
  originalIndex: number;
  /** Cumulative rotation applied (degrees clockwise) */
  rotation: PdfRotationAngle;
  /** Whether the page is selected for action (e.g. deletion or extraction) */
  isSelected?: boolean;
  /** Optional pre-rendered thumbnail data URL */
  thumbnailUrl?: string;
  /** Rendering state of thumbnail */
  thumbnailStatus?: 'loading' | 'loaded' | 'error';
}

export interface PdfDocumentSummary {
  pageCount: number;
  title?: string;
  author?: string;
  producer?: string;
  creationDate?: Date;
  isEncrypted: boolean;
}

export interface SplitRangeSegment {
  start: number;
  end: number;
}

export interface SplitRangeResult {
  pages: number[]; // 1-based page numbers in requested order
  segments: SplitRangeSegment[];
}

