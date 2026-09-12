import { useState, useId, type FC } from 'react';
import {
  Download,
  CheckCircle2,
  RefreshCw,
  FileCheck,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { downloadPdfBytes } from '@/lib/pdf/utils/download';
import { formatFileSize } from '@/lib/utils/file';
import {
  prepareSafeDownloadFilename,
  stripPdfExtension,
  getSplitDefaultFilename,
} from '@/utils/filenameUtils';

export interface OutputFileItem {
  id: string;
  pdfBytes: Uint8Array;
  defaultFilename: string;
  label?: string; // e.g. "Pages 1–3" or "All Pages"
  pageCount?: number;
  byteSize?: number;
}

export interface DownloadResultDocketProps {
  outputs: OutputFileItem[];
  toolName?: string;
  toolIdentifier?: string; // e.g. "[TOOL // 01 · SHEET STACKER]"
  isSplitBatch?: boolean;
  onReset?: () => void;
  onDownloadSuccess?: (filename: string) => void;
  className?: string;
}

export const DownloadResultDocket: FC<DownloadResultDocketProps> = ({
  outputs,
  toolName = 'Document',
  toolIdentifier = '[DISCHARGE // IN-MEMORY]',
  isSplitBatch = false,
  onReset,
  onDownloadSuccess,
  className = '',
}) => {
  const isMulti = isSplitBatch || outputs.length > 1;
  const singleInputId = useId();

  // State for single-output mode
  const initialSingleName = outputs[0] ? stripPdfExtension(outputs[0].defaultFilename) : 'document';
  const [singleFilename, setSingleFilename] = useState<string>(initialSingleName);
  const [isDownloadingSingle, setIsDownloadingSingle] = useState(false);
  const [downloadSuccessSingle, setDownloadSuccessSingle] = useState(false);

  // State for multi-output mode (Split batch)
  const [batchBaseName, setBatchBaseName] = useState<string>('');
  const [itemFilenames, setItemFilenames] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    outputs.forEach((item) => {
      initial[item.id] = stripPdfExtension(item.defaultFilename);
    });
    return initial;
  });
  const [downloadedItems, setDownloadedItems] = useState<Record<string, boolean>>({});
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadAllSuccess, setDownloadAllSuccess] = useState(false);

  // Total combined size
  const totalCombinedBytes = outputs.reduce((sum, item) => sum + (item.byteSize || item.pdfBytes.byteLength), 0);

  // --- Single Download Handler ---
  const handleDownloadSingle = () => {
    if (outputs.length === 0 || isDownloadingSingle) return;
    const item = outputs[0];
    const safeName = prepareSafeDownloadFilename(singleFilename, item.defaultFilename);

    setIsDownloadingSingle(true);
    try {
      downloadPdfBytes(item.pdfBytes, safeName);
      setDownloadSuccessSingle(true);
      onDownloadSuccess?.(safeName);
    } finally {
      setTimeout(() => {
        setIsDownloadingSingle(false);
      }, 800);
    }
  };

  // --- Individual Item Download Handler (Multi-mode) ---
  const handleDownloadItem = (item: OutputFileItem) => {
    const currentName = itemFilenames[item.id] || stripPdfExtension(item.defaultFilename);
    const safeName = prepareSafeDownloadFilename(currentName, item.defaultFilename);

    try {
      downloadPdfBytes(item.pdfBytes, safeName);
      setDownloadedItems((prev) => ({ ...prev, [item.id]: true }));
      onDownloadSuccess?.(safeName);
    } catch {
      // Error handled safely by downloadPdfBytes validation
    }
  };

  // --- Download All Handler (Multi-mode) ---
  const handleDownloadAll = async () => {
    if (outputs.length === 0 || isDownloadingAll) return;

    setIsDownloadingAll(true);
    setDownloadAllSuccess(false);

    try {
      for (let i = 0; i < outputs.length; i++) {
        const item = outputs[i];
        const currentName = itemFilenames[item.id] || stripPdfExtension(item.defaultFilename);
        const safeName = prepareSafeDownloadFilename(currentName, item.defaultFilename);

        downloadPdfBytes(item.pdfBytes, safeName);
        setDownloadedItems((prev) => ({ ...prev, [item.id]: true }));
        onDownloadSuccess?.(safeName);

        // Stagger browser downloads slightly to prevent download queue drops
        if (i < outputs.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
      setDownloadAllSuccess(true);
    } finally {
      setTimeout(() => {
        setIsDownloadingAll(false);
      }, 1000);
    }
  };

  // --- Apply Custom Base Name to All Outputs ---
  const handleApplyBatchBase = () => {
    if (!batchBaseName.trim()) return;
    const cleanBase = stripPdfExtension(batchBaseName.trim());

    const updated: Record<string, string> = {};
    outputs.forEach((item, idx) => {
      const generated = getSplitDefaultFilename({
        customBaseName: cleanBase,
        index: idx + 1,
        totalOutputs: outputs.length,
      });
      updated[item.id] = stripPdfExtension(generated);
    });

    setItemFilenames(updated);
  };

  if (outputs.length === 0) {
    return null;
  }

  // =========================================================================
  // SINGLE OUTPUT RENDERING
  // =========================================================================
  if (!isMulti) {
    const item = outputs[0];
    const byteSize = item.byteSize || item.pdfBytes.byteLength;
    const formattedSize = formatFileSize(byteSize);
    const sanitizedPreview = prepareSafeDownloadFilename(singleFilename, item.defaultFilename);

    return (
      <section
        aria-label="Document discharge docket"
        className={`relative border border-border rounded-[4px] bg-card p-6 sm:p-8 space-y-6 shadow-none select-none transition-all ${className}`}
      >
        {/* Architectural Corner Crop Marks */}
        <span className="absolute top-2 left-2 text-[10px] font-mono text-muted-foreground/60 select-none leading-none">┌</span>
        <span className="absolute top-2 right-2 text-[10px] font-mono text-muted-foreground/60 select-none leading-none">┐</span>
        <span className="absolute bottom-2 left-2 text-[10px] font-mono text-muted-foreground/60 select-none leading-none">└</span>
        <span className="absolute bottom-2 right-2 text-[10px] font-mono text-muted-foreground/60 select-none leading-none">┘</span>

        {/* Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-archival-green dark:bg-[#2BB064]" aria-hidden="true" />
            <span className="font-mono text-xs uppercase tracking-wider text-archival-green dark:text-[#2BB064] font-semibold">
              {toolIdentifier}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground uppercase">
            <span>PDF // BINARY STREAM</span>
            <span>·</span>
            <span className="font-semibold text-foreground">{formattedSize}</span>
          </div>
        </div>

        {/* Main Docket Content */}
        <div className="space-y-4">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-foreground tracking-tight uppercase">
              {toolName} Result Ready
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              Your document has been assembled directly in local browser memory. Verify or update the output filename before downloading.
            </p>
          </div>

          {/* Filename Input Field */}
          <div className="space-y-2 pt-2">
            <label
              htmlFor={singleInputId}
              className="block font-mono text-xs uppercase tracking-wider text-foreground font-semibold"
            >
              Output Filename
            </label>

            <div className="flex items-stretch rounded-[3px] border border-border bg-background focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all overflow-hidden max-w-xl">
              <input
                id={singleInputId}
                type="text"
                value={singleFilename}
                onChange={(e) => setSingleFilename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleDownloadSingle();
                  }
                }}
                placeholder="Enter filename"
                aria-label="Output filename"
                className="flex-1 px-3.5 py-2 font-mono text-xs sm:text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
              />
              <div className="px-3 flex items-center justify-center font-mono text-xs text-muted-foreground border-l border-border bg-muted/30 select-none">
                .pdf
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono text-[11px] text-muted-foreground pt-1">
              <span>
                Target designation:{' '}
                <strong className="text-foreground">{sanitizedPreview}</strong>
              </span>
              <span className="text-[10px] text-muted-foreground/80">
                (Extension added automatically)
              </span>
            </div>
          </div>
        </div>

        {/* Action Trigger Rail */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {onReset ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onReset}
              className="font-mono text-xs uppercase tracking-wider order-2 sm:order-1"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
              <span>Process Another Document</span>
            </Button>
          ) : (
            <div className="order-2 sm:order-1" />
          )}

          <div className="flex items-center gap-3 order-1 sm:order-2">
            {downloadSuccessSingle && (
              <span
                role="status"
                aria-live="polite"
                className="hidden sm:inline-flex items-center gap-1.5 font-mono text-xs text-archival-green dark:text-[#2BB064] uppercase"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Discharged</span>
              </span>
            )}

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isDownloadingSingle}
              onClick={handleDownloadSingle}
              className="font-mono text-xs uppercase tracking-wider w-full sm:w-auto font-semibold"
            >
              <Download className="w-4 h-4 mr-1.5" aria-hidden="true" />
              <span>{isDownloadingSingle ? 'Discharging...' : 'Download PDF'}</span>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // MULTI-OUTPUT RENDERING (SPLIT BATCH)
  // =========================================================================
  return (
    <section
      aria-label="Split batch discharge docket"
      className={`relative border border-border rounded-[4px] bg-card p-6 sm:p-8 space-y-6 shadow-none select-none transition-all ${className}`}
    >
      {/* Architectural Corner Crop Marks */}
      <span className="absolute top-2 left-2 text-[10px] font-mono text-muted-foreground/60 select-none leading-none">┌</span>
      <span className="absolute top-2 right-2 text-[10px] font-mono text-muted-foreground/60 select-none leading-none">┐</span>
      <span className="absolute bottom-2 left-2 text-[10px] font-mono text-muted-foreground/60 select-none leading-none">└</span>
      <span className="absolute bottom-2 right-2 text-[10px] font-mono text-muted-foreground/60 select-none leading-none">┘</span>

      {/* Batch Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-archival-green dark:text-[#2BB064]" aria-hidden="true" />
          <span className="font-mono text-xs uppercase tracking-wider text-archival-green dark:text-[#2BB064] font-semibold">
            {toolIdentifier} · {outputs.length} {outputs.length === 1 ? 'FILE READY' : 'FILES READY'}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground uppercase">
          <span>COMBINED SIZE</span>
          <span>·</span>
          <span className="font-semibold text-foreground">{formatFileSize(totalCombinedBytes)}</span>
        </div>
      </div>

      {/* Batch Description */}
      <div>
        <h2 className="font-display font-bold text-xl sm:text-2xl text-foreground tracking-tight uppercase">
          Split Output Manifest
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
          {outputs.length} discrete PDF {outputs.length === 1 ? 'document was' : 'documents were'} generated in browser memory. Rename individual outputs or apply a global base name before discharging.
        </p>
      </div>

      {/* Global Batch Base Renaming Strip */}
      <div className="p-4 rounded-[3px] bg-muted/40 border border-border space-y-2">
        <label
          htmlFor="batch-prefix-input"
          className="block font-mono text-xs uppercase tracking-wider text-foreground font-semibold"
        >
          Batch Prefix (Applies 1-Based Numbering)
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
          <input
            id="batch-prefix-input"
            type="text"
            value={batchBaseName}
            onChange={(e) => setBatchBaseName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyBatchBase();
              }
            }}
            placeholder="e.g. Quarterly Report"
            aria-label="Batch prefix for all split outputs"
            className="flex-1 px-3.5 py-1.5 font-mono text-xs rounded-[3px] border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyBatchBase}
            className="font-mono text-xs uppercase tracking-wider whitespace-nowrap"
          >
            Apply to All
          </Button>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">
          Generates <code className="text-foreground">Prefix-1.pdf</code>, <code className="text-foreground">Prefix-2.pdf</code>, etc.
        </p>
      </div>

      {/* Output Documents Ledger */}
      <div className="border border-border rounded-[4px] bg-card divide-y divide-border overflow-hidden">
        {outputs.map((item, index) => {
          const itemIndex = String(index + 1).padStart(2, '0');
          const currentName = itemFilenames[item.id] ?? stripPdfExtension(item.defaultFilename);
          const safeName = prepareSafeDownloadFilename(currentName, item.defaultFilename);
          const itemByteSize = item.byteSize || item.pdfBytes.byteLength;
          const isItemDownloaded = !!downloadedItems[item.id];

          return (
            <div
              key={item.id}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
            >
              {/* Item Info */}
              <div className="flex items-start md:items-center gap-3.5 min-w-0 flex-1">
                <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0 mt-2 md:mt-0">
                  [{itemIndex}]
                </span>

                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground uppercase">
                    <FileCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                    {item.label && <span className="font-semibold text-foreground">{item.label}</span>}
                    <span>•</span>
                    <span>{formatFileSize(itemByteSize)}</span>
                    {item.pageCount && (
                      <>
                        <span>•</span>
                        <span>{item.pageCount} {item.pageCount === 1 ? 'Page' : 'Pages'}</span>
                      </>
                    )}
                  </div>

                  {/* Filename Input for this item */}
                  <div className="flex items-stretch rounded-[3px] border border-border bg-background focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all overflow-hidden max-w-md">
                    <input
                      type="text"
                      value={currentName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItemFilenames((prev) => ({ ...prev, [item.id]: val }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleDownloadItem(item);
                        }
                      }}
                      aria-label={`Filename for output ${index + 1}`}
                      className="flex-1 px-3 py-1 font-mono text-xs text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
                    />
                    <div className="px-2.5 flex items-center justify-center font-mono text-[11px] text-muted-foreground border-l border-border bg-muted/30 select-none">
                      .pdf
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Item Download Button */}
              <div className="flex items-center justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                {isItemDownloaded && (
                  <span className="font-mono text-[11px] text-archival-green dark:text-[#2BB064] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Downloaded</span>
                  </span>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadItem(item)}
                  className="font-mono text-xs uppercase tracking-wider rounded-[3px]"
                  title={`Download ${safeName}`}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Action Trigger Rail */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {onReset ? (
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onReset}
            className="font-mono text-xs uppercase tracking-wider order-2 sm:order-1"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
            <span>Process Another Document</span>
          </Button>
        ) : (
          <div className="order-2 sm:order-1" />
        )}

        <div className="flex items-center gap-3 order-1 sm:order-2">
          {downloadAllSuccess && (
            <span
              role="status"
              aria-live="polite"
              className="hidden sm:inline-flex items-center gap-1.5 font-mono text-xs text-archival-green dark:text-[#2BB064] uppercase"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>All Files Discharged</span>
            </span>
          )}

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={isDownloadingAll}
            onClick={handleDownloadAll}
            className="font-mono text-xs uppercase tracking-wider w-full sm:w-auto font-semibold"
          >
            <Download className="w-4 h-4 mr-1.5" aria-hidden="true" />
            <span>
              {isDownloadingAll
                ? 'Discharging Batch...'
                : `Download All (${outputs.length} ${outputs.length === 1 ? 'Document' : 'Documents'})`}
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
};
