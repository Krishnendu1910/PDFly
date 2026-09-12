import { describe, it, expect } from 'vitest';
import {
  computePipelineMetrics,
  reorderFileList,
  removeFileFromList,
} from '@/lib/utils/pipeline';
import {
  validateBatch,
  generateRuntimeId,
  createFileFingerprint,
} from '@/lib/utils/file';
import { MERGE_PDF_CONFIG, PDF_ONLY_CONFIG } from '@/constants/file';
import type { FileValidationError, ManagedFile } from '@/types/file';

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

function createMockManagedFile(
  name: string,
  size: number,
  type = 'application/pdf',
  lastModified = 1700000000000,
): ManagedFile {
  const file = createMockFile(name, size, type, lastModified);
  return {
    id: generateRuntimeId(),
    fingerprint: createFileFingerprint(file),
    file,
    name,
    size,
    formattedSize: `${size} B`,
    type,
    extension: '.pdf',
    lastModified,
    status: 'ready',
  };
}

describe('Pipeline Behavior: File Ingestion & Validation', () => {
  it('adds valid files and constructs valid ManagedFile records', () => {
    const file1 = createMockFile('doc1.pdf', 1024);
    const file2 = createMockFile('doc2.pdf', 2048);

    const result = validateBatch([file1, file2], MERGE_PDF_CONFIG);

    expect(result.validFiles).toHaveLength(2);
    expect(result.rejectedFiles).toHaveLength(0);

    const [first, second] = result.validFiles;
    expect(first?.name).toBe('doc1.pdf');
    expect(first?.size).toBe(1024);
    expect(first?.status).toBe('ready');
    expect(first?.fingerprint).toBe(createFileFingerprint(file1));
    expect(first?.id).toBeTruthy();
    expect(second?.id).toBeTruthy();
    expect(first?.id).not.toBe(second?.id);

    expect(second?.name).toBe('doc2.pdf');
    expect(second?.size).toBe(2048);
  });

  it('rejects invalid files: empty, oversized, and wrong extension', () => {
    const emptyFile = createMockFile('empty.pdf', 0);
    const oversizedFile = createMockFile('huge.pdf', 60 * 1024 * 1024); // Exceeds 50MB
    const badExtFile = createMockFile('virus.exe', 1000, 'application/x-msdownload');

    const result = validateBatch([emptyFile, oversizedFile, badExtFile], MERGE_PDF_CONFIG);

    expect(result.validFiles).toHaveLength(0);
    expect(result.rejectedFiles).toHaveLength(3);

    const codes = result.rejectedFiles.map((r) => r.errors[0]?.code);
    expect(codes).toContain('FILE_EMPTY');
    expect(codes).toContain('FILE_TOO_LARGE');
    expect(codes).toContain('INVALID_TYPE');
  });

  it('detects and rejects duplicate files with identical metadata fingerprint', () => {
    const originalFile = createMockFile('report.pdf', 5000, 'application/pdf', 12345);
    const duplicateFile = createMockFile('report.pdf', 5000, 'application/pdf', 12345);
    const modifiedFile = createMockFile('report.pdf', 5001, 'application/pdf', 12345); // Different size

    // First file intake
    const initialBatch = validateBatch([originalFile], MERGE_PDF_CONFIG);
    expect(initialBatch.validFiles).toHaveLength(1);

    // Intake with existing files
    const duplicateBatch = validateBatch(
      [duplicateFile, modifiedFile],
      MERGE_PDF_CONFIG,
      initialBatch.validFiles,
    );

    // Duplicate is rejected
    expect(duplicateBatch.rejectedFiles).toHaveLength(1);
    expect(duplicateBatch.rejectedFiles[0]?.errors[0]?.code).toBe('DUPLICATE_FILE');
    expect(duplicateBatch.rejectedFiles[0]?.errors[0]?.message).toContain('identical metadata');

    // File with different size is accepted
    expect(duplicateBatch.validFiles).toHaveLength(1);
    expect(duplicateBatch.validFiles[0]?.size).toBe(5001);
  });

  it('enforces maximum file count limit across cumulative additions', () => {
    const config = { ...MERGE_PDF_CONFIG, maxFiles: 2 };
    const file1 = createMockFile('doc1.pdf', 100);
    const file2 = createMockFile('doc2.pdf', 200);
    const file3 = createMockFile('doc3.pdf', 300);

    const result = validateBatch([file1, file2, file3], config);

    expect(result.validFiles).toHaveLength(2);
    expect(result.rejectedFiles).toHaveLength(1);
    expect(result.rejectedFiles[0]?.errors[0]?.code).toBe('TOO_MANY_FILES');
  });
});

describe('Pipeline Behavior: Derived Metrics & Action Validation', () => {
  it('calculates metrics correctly for empty pipeline', () => {
    const metrics = computePipelineMetrics([], MERGE_PDF_CONFIG);

    expect(metrics.count).toBe(0);
    expect(metrics.totalBytes).toBe(0);
    expect(metrics.formattedTotalSize).toBe('0 B');
    expect(metrics.hasFiles).toBe(false);
    expect(metrics.canAddMore).toBe(true);
    // Merge PDF requires at least 2 files
    expect(metrics.isValidForAction).toBe(false);
  });

  it('validates minFiles constraint: 1 file is invalid for Merge, 2 files is valid', () => {
    const file1 = createMockManagedFile('doc1.pdf', 1024);
    const file2 = createMockManagedFile('doc2.pdf', 2048);

    // 1 file for Merge PDF -> invalid
    const metrics1 = computePipelineMetrics([file1], MERGE_PDF_CONFIG);
    expect(metrics1.count).toBe(1);
    expect(metrics1.isValidForAction).toBe(false);
    expect(metrics1.canAddMore).toBe(true);

    // 2 files for Merge PDF -> valid!
    const metrics2 = computePipelineMetrics([file1, file2], MERGE_PDF_CONFIG);
    expect(metrics2.count).toBe(2);
    expect(metrics2.isValidForAction).toBe(true);
    expect(metrics2.totalBytes).toBe(3072);
  });

  it('enforces canAddMore flag when maxFiles limit is reached', () => {
    const config = { ...PDF_ONLY_CONFIG, maxFiles: 2 };
    const file1 = createMockManagedFile('doc1.pdf', 1024);
    const file2 = createMockManagedFile('doc2.pdf', 2048);

    const metrics = computePipelineMetrics([file1, file2], config);
    expect(metrics.count).toBe(2);
    expect(metrics.canAddMore).toBe(false);
    expect(metrics.isValidForAction).toBe(true);
  });
});

describe('Pipeline Behavior: File Removal & Error Cleanup', () => {
  it('removes the specified file and cleans its associated errors', () => {
    const file1 = createMockManagedFile('doc1.pdf', 100);
    const file2 = createMockManagedFile('doc2.pdf', 200);

    const initialErrors: FileValidationError[] = [
      { code: 'FILE_TOO_LARGE', fileName: 'doc1.pdf', message: 'Error on doc1' },
      { code: 'FILE_EMPTY', fileName: 'doc2.pdf', message: 'Error on doc2' },
    ];

    const { updatedFiles, updatedErrors } = removeFileFromList(
      [file1, file2],
      initialErrors,
      file1.id,
    );

    expect(updatedFiles).toHaveLength(1);
    expect(updatedFiles[0]?.id).toBe(file2.id);

    // Error for doc1 should be removed, error for doc2 preserved
    expect(updatedErrors).toHaveLength(1);
    expect(updatedErrors[0]?.fileName).toBe('doc2.pdf');
  });

  it('handles removal of nonexistent id gracefully', () => {
    const file1 = createMockManagedFile('doc1.pdf', 100);
    const { updatedFiles, updatedErrors } = removeFileFromList([file1], [], 'nonexistent-id');

    expect(updatedFiles).toHaveLength(1);
    expect(updatedErrors).toHaveLength(0);
  });
});

describe('Pipeline Behavior: List Reordering & Bounds Safety', () => {
  const fileA = createMockManagedFile('a.pdf', 100);
  const fileB = createMockManagedFile('b.pdf', 200);
  const fileC = createMockManagedFile('c.pdf', 300);
  const originalList = [fileA, fileB, fileC];

  it('reorders forward correctly (move down)', () => {
    // Move A from index 0 to index 1 -> [B, A, C]
    const reordered = reorderFileList(originalList, 0, 1);
    expect(reordered.map((f) => f.name)).toEqual(['b.pdf', 'a.pdf', 'c.pdf']);
  });

  it('reorders backward correctly (move up)', () => {
    // Move C from index 2 to index 1 -> [A, C, B]
    const reordered = reorderFileList(originalList, 2, 1);
    expect(reordered.map((f) => f.name)).toEqual(['a.pdf', 'c.pdf', 'b.pdf']);
  });

  it('safely handles out-of-bounds and negative indices without mutating', () => {
    expect(reorderFileList(originalList, -1, 1)).toEqual(originalList);
    expect(reorderFileList(originalList, 0, 5)).toEqual(originalList);
    expect(reorderFileList(originalList, 5, 1)).toEqual(originalList);
    expect(reorderFileList(originalList, 1, -2)).toEqual(originalList);
  });

  it('returns exact same array reference if fromIndex equals toIndex', () => {
    const reordered = reorderFileList(originalList, 1, 1);
    expect(reordered).toEqual(originalList);
  });
});

describe('Pipeline Behavior: Runtime ID & Duplicate Fingerprint Separation', () => {
  it('assigns unique runtime IDs to distinct ingested files', () => {
    const file1 = createMockFile('document1.pdf', 1000);
    const file2 = createMockFile('document2.pdf', 1000);

    const result = validateBatch([file1, file2], MERGE_PDF_CONFIG);
    expect(result.validFiles).toHaveLength(2);

    const [managed1, managed2] = result.validFiles;
    expect(managed1?.id).toBeTruthy();
    expect(managed2?.id).toBeTruthy();
    expect(managed1?.id).not.toBe(managed2?.id);
    expect(managed1?.id.startsWith('file_')).toBe(true);
    expect(managed2?.id.startsWith('file_')).toBe(true);
  });

  it('preserves runtime IDs when files are reordered', () => {
    const fileA = createMockFile('a.pdf', 100);
    const fileB = createMockFile('b.pdf', 200);
    const fileC = createMockFile('c.pdf', 300);

    const { validFiles } = validateBatch([fileA, fileB, fileC], MERGE_PDF_CONFIG);
    const [idA, idB, idC] = validFiles.map((f) => f.id);

    // Move A from index 0 to 2 -> [B, C, A]
    const reordered = reorderFileList(validFiles, 0, 2);

    expect(reordered[0]?.name).toBe('b.pdf');
    expect(reordered[0]?.id).toBe(idB);

    expect(reordered[1]?.name).toBe('c.pdf');
    expect(reordered[1]?.id).toBe(idC);

    expect(reordered[2]?.name).toBe('a.pdf');
    expect(reordered[2]?.id).toBe(idA);
  });

  it('preserves runtime IDs of remaining files when a file is removed', () => {
    const fileA = createMockFile('a.pdf', 100);
    const fileB = createMockFile('b.pdf', 200);
    const fileC = createMockFile('c.pdf', 300);

    const { validFiles } = validateBatch([fileA, fileB, fileC], MERGE_PDF_CONFIG);
    const [idA, idB, idC] = validFiles.map((f) => f.id);

    // Remove B
    const { updatedFiles } = removeFileFromList(validFiles, [], idB!);

    expect(updatedFiles).toHaveLength(2);
    expect(updatedFiles[0]?.name).toBe('a.pdf');
    expect(updatedFiles[0]?.id).toBe(idA);

    expect(updatedFiles[1]?.name).toBe('c.pdf');
    expect(updatedFiles[1]?.id).toBe(idC);
  });

  it('correctly distinguishes files that would collide under naive name sanitization', () => {
    // Collision scenario: 'my/file.pdf' vs 'my_file.pdf' with matching size and timestamp
    const timestamp = 1700000000000;
    const fileWithSlash = createMockFile('my/file.pdf', 2048, 'application/pdf', timestamp);
    const fileWithUnderscore = createMockFile('my_file.pdf', 2048, 'application/pdf', timestamp);

    // 1. Ingest both in the same batch
    const batchResult = validateBatch([fileWithSlash, fileWithUnderscore], MERGE_PDF_CONFIG);

    // Both files must be accepted because their exact metadata fingerprints differ
    expect(batchResult.validFiles).toHaveLength(2);
    expect(batchResult.rejectedFiles).toHaveLength(0);

    const [managedSlash, managedUnderscore] = batchResult.validFiles;

    // Internal runtime IDs must be completely unique
    expect(managedSlash?.id).not.toBe(managedUnderscore?.id);

    // Metadata fingerprints must accurately distinguish the raw filenames
    expect(managedSlash?.fingerprint).not.toBe(managedUnderscore?.fingerprint);
    expect(managedSlash?.fingerprint).toContain('my/file.pdf');
    expect(managedUnderscore?.fingerprint).toContain('my_file.pdf');

    // 2. An actual identical duplicate of 'my/file.pdf' is still rejected
    const exactDuplicate = createMockFile('my/file.pdf', 2048, 'application/pdf', timestamp);
    const duplicateCheck = validateBatch([exactDuplicate], MERGE_PDF_CONFIG, batchResult.validFiles);

    expect(duplicateCheck.validFiles).toHaveLength(0);
    expect(duplicateCheck.rejectedFiles).toHaveLength(1);
    expect(duplicateCheck.rejectedFiles[0]?.errors[0]?.code).toBe('DUPLICATE_FILE');
  });
});

