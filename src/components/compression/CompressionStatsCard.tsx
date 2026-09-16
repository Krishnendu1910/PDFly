import { type FC } from 'react';
import {
  DownloadSimple as Download,
  CheckCircle as CheckCircle2,
  Info,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Sparkle as Sparkles,
  Target,
} from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatFileSize } from '@/lib/utils/file';
import type { CompressionResult } from '@/lib/pdf';

export interface CompressionStatsCardProps {
  result: CompressionResult;
  onDownload?: () => void;
  disabled?: boolean;
}

export const CompressionStatsCard: FC<CompressionStatsCardProps> = ({
  result,
  onDownload,
  disabled = false,
}) => {
  const {
    originalBytes,
    compressedBytes,
    bytesSaved,
    percentSaved,
    mode,
    isReduced,
    characteristics,
    targetSizeBytes,
    targetReached,
  } = result;

  const isTargetMode = mode === 'target';
  const isSuccessful = isTargetMode ? (targetReached ?? false) : isReduced;

  return (
    <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-6">
      {/* Header Result Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isSuccessful
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {isSuccessful ? (
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            ) : isTargetMode ? (
              <Target className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Info className="w-6 h-6" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isTargetMode ? (
                <Badge variant={targetReached ? 'success' : 'outline'} size="sm">
                  {targetReached ? 'Target Reached' : 'Target Not Reached'}
                </Badge>
              ) : (
                <Badge variant={isReduced ? 'success' : 'outline'} size="sm">
                  {isReduced ? 'Compression Successful' : 'Already Optimized'}
                </Badge>
              )}
              <Badge variant="secondary" size="sm" className="capitalize">
                {isTargetMode ? 'Target Size' : `${mode} Mode`}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {isTargetMode
                ? targetReached
                  ? 'Target size reached.'
                  : 'Target size could not be reached with the available compression settings.'
                : isReduced
                  ? `Reduced by ${percentSaved}%`
                  : 'No Size Reduction Possible'}
            </h2>
          </div>
        </div>

        {onDownload && (
          <Button
            size="lg"
            onClick={onDownload}
            disabled={disabled}
            className="w-full sm:w-auto shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            <span>Download PDF</span>
          </Button>
        )}
      </div>

      {/* Metrics Grid */}
      {isTargetMode && targetSizeBytes ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground block mb-1">Original Size</span>
            <span className="text-base sm:text-lg font-bold font-mono text-foreground">
              {formatFileSize(originalBytes)}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground block mb-1">Target Size</span>
            <span className="text-base sm:text-lg font-bold font-mono text-primary">
              ≤ {formatFileSize(targetSizeBytes)}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground block mb-1">Compressed Size</span>
            <span
              className={`text-base sm:text-lg font-bold font-mono ${
                targetReached
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-foreground'
              }`}
            >
              {formatFileSize(compressedBytes)}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground block mb-1">Space Saved</span>
            <span
              className={`text-base sm:text-lg font-bold font-mono ${
                isReduced
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }`}
            >
              {isReduced ? formatFileSize(bytesSaved) : '0 B'}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-secondary/30 col-span-2 sm:col-span-1">
            <span className="text-xs text-muted-foreground block mb-1">Reduction Ratio</span>
            <span
              className={`text-base sm:text-lg font-bold font-mono ${
                isReduced
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }`}
            >
              {isReduced ? `-${percentSaved}%` : '0%'}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground block mb-1">Original Size</span>
            <span className="text-base sm:text-lg font-bold font-mono text-foreground">
              {formatFileSize(originalBytes)}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground block mb-1">Compressed Size</span>
            <span className="text-base sm:text-lg font-bold font-mono text-foreground">
              {formatFileSize(compressedBytes)}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground block mb-1">Space Saved</span>
            <span
              className={`text-base sm:text-lg font-bold font-mono ${
                isReduced
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }`}
            >
              {isReduced ? formatFileSize(bytesSaved) : '0 B'}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-secondary/30">
            <span className="text-xs text-muted-foreground block mb-1">Reduction Ratio</span>
            <span
              className={`text-base sm:text-lg font-bold font-mono ${
                isReduced
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }`}
            >
              {isReduced ? `-${percentSaved}%` : '0%'}
            </span>
          </div>
        </div>
      )}

      {/* Visual Size Comparison Bar */}
      {isReduced && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>{formatFileSize(compressedBytes)}</span>
            <span>{formatFileSize(originalBytes)}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden flex">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(5, 100 - percentSaved)}%` }}
            />
          </div>
        </div>
      )}

      {/* Explanatory Note if Not Reduced */}
      {!isReduced && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <div>
            <span className="font-semibold block mb-0.5">Why was this file not compressed?</span>
            This PDF consists primarily of pre-optimized streams or vector and font elements that cannot be reduced further without degrading text or layout quality. We never overwrite files with larger outputs.
          </div>
        </div>
      )}

      {/* Explanatory Note if Target Mode and Target Not Reached but Reduced */}
      {isTargetMode && !targetReached && isReduced && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <div>
            <span className="font-semibold block mb-0.5">Target Size Status</span>
            The document was compressed to the maximum extent possible ({formatFileSize(compressedBytes)}) while preserving text sharpness and layout fidelity, but could not be reduced all the way to your target of {targetSizeBytes ? formatFileSize(targetSizeBytes) : 'the requested size'}.
          </div>
        </div>
      )}

      {/* Document Profile Summary */}
      <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            {characteristics.pageCount} {characteristics.pageCount === 1 ? 'page' : 'pages'}
          </span>

          <span className="flex items-center gap-1.5 capitalize">
            {characteristics.contentType === 'image-heavy' ? (
              <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {characteristics.contentType.replace('-', ' ')} profile
          </span>

          {characteristics.imageCount > 0 && (
            <span>
              {characteristics.imageCount} {characteristics.imageCount === 1 ? 'image' : 'images'} detected
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-foreground font-medium">
          <span>Selectable text & vectors preserved</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
