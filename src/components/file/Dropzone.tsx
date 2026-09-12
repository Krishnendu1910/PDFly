import {
  useRef,
  useState,
  useId,
  type FC,
  type DragEvent,
  type ChangeEvent,
} from 'react';
import { UploadCloud, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { FileValidationConfig } from '@/types/file';
import { formatFileSize } from '@/lib/utils/file';
import { DEFAULT_MAX_FILE_SIZE } from '@/constants/file';

export interface DropzoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  config?: FileValidationConfig;
  disabled?: boolean;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const Dropzone: FC<DropzoneProps> = ({
  onFilesSelected,
  config = {},
  disabled = false,
  multiple = true,
  title = 'Select or drop PDF documents',
  subtitle,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const inputId = useId();

  const maxSizeFormatted = formatFileSize(config.maxFileSize ?? DEFAULT_MAX_FILE_SIZE);
  const acceptedTypesText = config.acceptExtensions?.join(', ') || 'PDF';
  const defaultSubtitle = `Supports ${acceptedTypesText} up to ${maxSizeFormatted} each`;
  const helpText = subtitle ?? defaultSubtitle;

  const acceptAttribute = [
    ...(config.acceptMimeTypes ?? []),
    ...(config.acceptExtensions ?? []),
  ].join(',');

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so re-selecting the same file name triggers onChange if needed
      e.target.value = '';
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'group relative flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed transition-all duration-200',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
        isDragOver
          ? 'border-primary bg-primary/10 scale-[1.01] shadow-md'
          : 'border-border bg-card/60 hover:border-primary/50 hover:bg-card shadow-xs',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className,
      )}
    >
      {/* Native file input, fully accessible to screen readers and keyboard navigation */}
      <input
        id={inputId}
        type="file"
        multiple={multiple}
        accept={acceptAttribute || undefined}
        disabled={disabled}
        onChange={handleFileInputChange}
        aria-label={`${title}. ${helpText}`}
        className="sr-only focus:outline-none"
      />

      {/* Semantic label associating the entire visual area with the native file input */}
      <label
        htmlFor={inputId}
        className={cn(
          'w-full h-full p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer select-none rounded-2xl',
          disabled && 'cursor-not-allowed',
        )}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200',
            isDragOver
              ? 'bg-primary text-primary-foreground scale-110'
              : 'bg-primary/10 text-primary group-hover:scale-105',
          )}
          aria-hidden="true"
        >
          {isDragOver ? (
            <FileUp className="w-8 h-8 animate-bounce" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        <span className="text-lg sm:text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
          {isDragOver ? 'Drop files here to add' : title}
        </span>

        <span className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {helpText}
        </span>

        {/* Visual button indicator rendered as span to avoid invalid nested button semantics */}
        <span
          className={cn(
            'inline-flex items-center justify-center font-medium rounded-lg px-4 py-2 text-sm transition-all duration-150',
            isDragOver
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          )}
          aria-hidden="true"
        >
          Browse From Device
        </span>
      </label>
    </div>
  );
};
