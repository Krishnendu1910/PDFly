import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  getFileExtension,
  generateRuntimeId,
  createFileFingerprint,
  isFileTypeAccepted,
  validateSingleFile,
  validateBatch,
} from '@/lib/utils/file';
import type { FileValidationConfig, ManagedFile } from '@/types/file';
import { PDF_ONLY_CONFIG, IMAGE_TO_PDF_CONFIG } from '@/constants/file';

// Helper to construct simulated File objects in tests
function createMockFile(
  name: string,
  size: number,
  type = 'application/pdf',
  lastModified = 1700000000000,
): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type, lastModified });
}

describe('formatFileSize', () => {
  it('formats zero and negative values cleanly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(-10)).toBe('0 B');
  });

  it('formats bytes, kilobytes, megabytes, and gigabytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

describe('getFileExtension', () => {
  it('extracts lowercase extensions including leading dot', () => {
    expect(getFileExtension('document.pdf')).toBe('.pdf');
    expect(getFileExtension('IMAGE.PNG')).toBe('.png');
    expect(getFileExtension('report.2024.FINAL.PDF')).toBe('.pdf');
  });

  it('handles files with no extension or hidden dotfiles', () => {
    expect(getFileExtension('noextension')).toBe('');
    expect(getFileExtension('.gitignore')).toBe('');
    expect(getFileExtension('')).toBe('');
  });
});

describe('createFileFingerprint', () => {
  it('produces identical deterministic fingerprint for identical file metadata', () => {
    const file1 = createMockFile('contract.pdf', 2048, 'application/pdf', 123456789);
    const file2 = createMockFile('contract.pdf', 2048, 'application/pdf', 123456789);
    expect(createFileFingerprint(file1)).toBe(createFileFingerprint(file2));
  });

  it('produces different fingerprints when size, name, or lastModified differ', () => {
    const file1 = createMockFile('doc.pdf', 1000, 'application/pdf', 100);
    const file2 = createMockFile('doc.pdf', 2000, 'application/pdf', 100);
    const file3 = createMockFile('other.pdf', 1000, 'application/pdf', 100);
    expect(createFileFingerprint(file1)).not.toBe(createFileFingerprint(file2));
    expect(createFileFingerprint(file1)).not.toBe(createFileFingerprint(file3));
  });
});

describe('isFileTypeAccepted', () => {
  const config: FileValidationConfig = {
    acceptMimeTypes: ['application/pdf'],
    acceptExtensions: ['.pdf'],
  };

  it('accepts file with valid MIME and extension', () => {
    const file = createMockFile('doc.pdf', 1000, 'application/pdf');
    expect(isFileTypeAccepted(file, config)).toBe(true);
  });

  it('accepts file by extension even if MIME type is empty from browser', () => {
    const file = createMockFile('doc.pdf', 1000, '');
    expect(isFileTypeAccepted(file, config)).toBe(true);
  });

  it('rejects unsupported file type', () => {
    const file = createMockFile('script.exe', 1000, 'application/x-msdownload');
    expect(isFileTypeAccepted(file, config)).toBe(false);
  });
});

describe('validateSingleFile', () => {
  it('passes a valid PDF file within size limits', () => {
    const file = createMockFile('report.pdf', 5 * 1024 * 1024, 'application/pdf');
    const result = validateSingleFile(file, PDF_ONLY_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('rejects an empty 0-byte file', () => {
    const file = createMockFile('empty.pdf', 0, 'application/pdf');
    const result = validateSingleFile(file, PDF_ONLY_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe('FILE_EMPTY');
  });

  it('rejects an oversized file', () => {
    const max = 10 * 1024 * 1024;
    const config: FileValidationConfig = { ...PDF_ONLY_CONFIG, maxFileSize: max };
    const file = createMockFile('huge.pdf', 15 * 1024 * 1024, 'application/pdf');
    const result = validateSingleFile(file, config);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe('FILE_TOO_LARGE');
  });

  it('passes a valid image file with IMAGE_TO_PDF_CONFIG', () => {
    const file = createMockFile('photo.jpg', 2 * 1024 * 1024, 'image/jpeg');
    const result = validateSingleFile(file, IMAGE_TO_PDF_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('rejects extension mismatch where extension is not in allowed list', () => {
    // File has PDF MIME but .txt extension
    const file = createMockFile('fake.txt', 1000, 'application/pdf');
    const result = validateSingleFile(file, PDF_ONLY_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe('INVALID_TYPE');
  });

  it('rejects unsupported file type with clear error', () => {
    const file = createMockFile('image.bmp', 5000, 'image/bmp');
    const result = validateSingleFile(file, PDF_ONLY_CONFIG);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe('INVALID_TYPE');
  });

  it('rejects duplicate file already in selection', () => {
    const file = createMockFile('doc.pdf', 1000, 'application/pdf', 555);
    const existing: ManagedFile = {
      id: generateRuntimeId(),
      fingerprint: createFileFingerprint(file),
      file,
      name: file.name,
      size: file.size,
      formattedSize: '1 KB',
      type: file.type,
      extension: '.pdf',
      lastModified: file.lastModified,
      status: 'ready',
    };

    const result = validateSingleFile(file, PDF_ONLY_CONFIG, [existing]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.code).toBe('DUPLICATE_FILE');
  });
});

describe('validateBatch', () => {
  it('enforces maximum file limit across batches', () => {
    const config: FileValidationConfig = { ...PDF_ONLY_CONFIG, maxFiles: 2 };
    const file1 = createMockFile('doc1.pdf', 100, 'application/pdf', 1);
    const file2 = createMockFile('doc2.pdf', 100, 'application/pdf', 2);
    const file3 = createMockFile('doc3.pdf', 100, 'application/pdf', 3);

    const result = validateBatch([file1, file2, file3], config);
    expect(result.validFiles.length).toBe(2);
    expect(result.rejectedFiles.length).toBe(1);
    expect(result.rejectedFiles[0]?.errors[0]?.code).toBe('TOO_MANY_FILES');
  });

  it('filters valid files and groups rejected files with specific errors', () => {
    const validFile = createMockFile('valid.pdf', 1024, 'application/pdf', 10);
    const emptyFile = createMockFile('empty.pdf', 0, 'application/pdf', 20);
    const wrongType = createMockFile('bad.txt', 500, 'text/plain', 30);

    const result = validateBatch([validFile, emptyFile, wrongType], PDF_ONLY_CONFIG);
    expect(result.validFiles.length).toBe(1);
    expect(result.validFiles[0]?.name).toBe('valid.pdf');
    expect(result.rejectedFiles.length).toBe(2);
  });
});
