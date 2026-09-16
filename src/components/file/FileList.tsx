import { type FC } from 'react';
import { Trash } from '@/components/icons';
import { FileCard } from '@/components/file/FileCard';
import { Button } from '@/components/ui/Button';
import type { ManagedFile } from '@/types/file';

export interface FileListProps {
  files: readonly ManagedFile[];
  totalSizeFormatted: string;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  disabled?: boolean;
}

export const FileList: FC<FileListProps> = ({
  files,
  totalSizeFormatted,
  onRemoveFile,
  onClearFiles,
  onMoveUp,
  onMoveDown,
  disabled = false,
}) => {
  if (files.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-border">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <span>Selected Files</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {files.length}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total batch size: <strong className="text-foreground font-medium">{totalSizeFormatted}</strong>
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onClearFiles}
          className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
          Clear All
        </Button>
      </div>

      {/* Cards List */}
      <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
        {files.map((file, index) => (
          <FileCard
            key={file.id}
            file={file}
            index={index}
            totalFiles={files.length}
            onRemove={onRemoveFile}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};

