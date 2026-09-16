export type TargetSizeUnit = 'KB' | 'MB' | 'GB';

/**
 * Validates and parses user-entered target file size into exact bytes using standard binary units.
 * 1 KB = 1024 bytes
 * 1 MB = 1024 * 1024 bytes
 * 1 GB = 1024 * 1024 * 1024 bytes
 */
export function parseTargetSizeBytes(
  value: string,
  unit: TargetSizeUnit,
): { bytes: number | null; error: string | null } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { bytes: null, error: 'Please enter a target file size.' };
  }

  const num = Number(trimmed);
  if (isNaN(num)) {
    return { bytes: null, error: 'Please enter a valid numeric file size.' };
  }

  if (!Number.isFinite(num)) {
    return { bytes: null, error: 'Target file size must be a finite number.' };
  }

  if (num <= 0) {
    return { bytes: null, error: 'Target file size must be greater than zero.' };
  }

  let multiplier = 1024;
  if (unit === 'KB') multiplier = 1024;
  else if (unit === 'MB') multiplier = 1024 * 1024;
  else if (unit === 'GB') multiplier = 1024 * 1024 * 1024;

  const totalBytes = num * multiplier;

  if (totalBytes > 1024 * 1024 * 1024 * 10 || totalBytes > Number.MAX_SAFE_INTEGER) {
    return { bytes: null, error: 'Target file size exceeds maximum supported limit.' };
  }

  return { bytes: Math.round(totalBytes), error: null };
}

