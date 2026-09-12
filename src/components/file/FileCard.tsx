import { type FC } from 'react';
import { FileText, Image as ImageIcon, File, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';
import type { ManagedFile } from '@/types/file';

export interface FileCardProps {
  file: ManagedFile;
  index: number;
  totalFiles: number;
  onRemove: (id: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  disabled?: boolean;
}

export const FileCard: FC<FileCardProps> = ({
  file,
  index,
  totalFiles,
  onRemove,
  onMoveUp,
  onMoveDown,
  disabled = false,
}) => {
  const isFirst = index === 0;
  const isLast = index === totalFiles - 1;

  // Determine file icon based on MIME type / extension
  const getFileIcon = () => {
    if (file.type.includes('pdf') || file.extension === '.pdf') {
      return <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />;
    }
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />;
    }
    return <File className="w-5 h-5 text-muted-foreground" aria-hidden="true" />;
  };

  return (
    <div
      className={cn(
        'group flex items-center justify-between p-3 sm:p-4 rounded-xl border border-border bg-card shadow-xs transition-all duration-150',
        'hover:border-primary/40 hover:shadow-sm',
        disabled && 'opacity-60 pointer-events-none',
      )}
    >
      {/* File Details */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
        {/* Sequence Badge */}
        <span
          className="hidden sm:inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[11px] font-mono font-semibold text-muted-foreground shrink-0"
          aria-label={`File ${index + 1} of ${totalFiles}`}
        >
          {index + 1}
        </span>

        {/* File Icon */}
        <div className="w-10 h-10 rounded-lg bg-secondary/80 border border-border flex items-center justify-center shrink-0">
          {getFileIcon()}
        </div>

        {/* Name and Metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              title={file.name}
              className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-md"
            >
              {file.name}
            </p>
            <Badge variant="outline" size="sm" className="hidden sm:inline-flex text-[10px] uppercase font-mono">
              {file.extension.replace('.', '') || 'file'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{file.formattedSize}</span>
            <span>&bull;</span>
            <span className="capitalize text-emerald-600 dark:text-emerald-400 font-medium">
              {file.status === 'ready' ? 'Ready' : file.status}
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Reordering Controls */}
        {totalFiles > 1 && onMoveUp && onMoveDown && (
          <div className="flex items-center border border-border/80 rounded-lg bg-background/60 p-0.5 mr-1">
            <button
              type="button"
              disabled={disabled || isFirst}
              onClick={() => onMoveUp(index)}
              aria-label={`Move ${file.name} up`}
              title="Move up"
              className={cn(
                'min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:opacity-30 disabled:pointer-events-none',
              )}
            >
              <ArrowUp className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={disabled || isLast}
              onClick={() => onMoveDown(index)}
              aria-label={`Move ${file.name} down`}
              title="Move down"
              className={cn(
                'min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:opacity-30 disabled:pointer-events-none',
              )}
            >
              <ArrowDown className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Remove Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRemove(file.id)}
          aria-label={`Remove ${file.name}`}
          title={`Remove ${file.name}`}
          className={cn(
            'min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:opacity-40 disabled:pointer-events-none',
          )}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

