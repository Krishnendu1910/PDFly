import type { ManagedFile } from '@/types/file';
import type { PdfRotationAngle } from '../types';

export type ImageFormat = 'jpeg' | 'png' | 'webp';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageDescriptor {
  /** Stable runtime identifier */
  id: string;
  /** Ingested managed file reference */
  managedFile: ManagedFile;
  /** Ephemeral object URL for preview rendering */
  previewUrl: string;
  /** Natural dimensions of the image */
  dimensions?: ImageDimensions;
  /** Cumulative user rotation (degrees clockwise) */
  rotation: PdfRotationAngle;
  /** Detected or declared image format */
  format: ImageFormat;
  /** Loading/processing state */
  status: 'pending' | 'ready' | 'error';
  /** Error message if loading or validation failed */
  errorMessage?: string;
}

export interface ImageToPdfOptions {
  /** Maximum page dimension in points (1 pt = 1/72 inch). Default is 1440 (~20 inches) */
  maxPageDimension?: number;
  /** Progress callback invoked per image */
  onProgress?: (current: number, total: number, percentage: number) => void;
}

export interface MagicByteValidationResult {
  valid: boolean;
  format?: ImageFormat;
  error?: string;
}

