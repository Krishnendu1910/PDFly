export type CompressionMode = 'quality' | 'balanced' | 'strong';

export type PdfContentType = 'image-heavy' | 'text-vector' | 'mixed';

export interface PdfCharacteristics {
  pageCount: number;
  imageCount: number;
  totalImageBytes: number;
  fileSizeBytes: number;
  contentType: PdfContentType;
}

export interface CompressionOptions {
  mode?: CompressionMode;
  onProgress?: (stage: string, percent: number) => void;
}

export interface CompressionResult {
  originalBytes: number;
  compressedBytes: number;
  bytesSaved: number;
  percentSaved: number;
  mode: CompressionMode;
  isReduced: boolean;
  characteristics: PdfCharacteristics;
  outputBytes: Uint8Array;
}

