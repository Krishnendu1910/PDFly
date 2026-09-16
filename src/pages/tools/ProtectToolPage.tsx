import { useState, useEffect, useMemo, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  ToolIcon,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  LockKey,
  LockKeyOpen,
  Eye,
  EyeSlash,
  CheckCircle,
  WarningCircle,
  Lightning,
} from '@/components/icons';
import { ROUTES } from '@/constants/routes';
import { PDF_ONLY_CONFIG } from '@/constants/file';
import { useFilePipeline } from '@/hooks/useFilePipeline';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dropzone } from '@/components/file/Dropzone';
import { FileErrorBanner } from '@/components/file/FileErrorBanner';
import { ProcessingOverlay } from '@/components/pdf/ProcessingOverlay';
import { DownloadResultDocket, type OutputFileItem } from '@/components/download';
import { getDefaultDownloadFilename } from '@/utils/filenameUtils';
import {
  protectPdf,
  unlockPdf,
  detectPdfProtection,
  PdfOperationError,
  type PdfProtectionState,
} from '@/lib/pdf';
import type { FileValidationError } from '@/types/file';

const PROTECT_CONFIG = {
  ...PDF_ONLY_CONFIG,
  maxFiles: 1,
  minFiles: 1,
};

type ToolMode = 'protect' | 'unlock';

export const ProtectToolPage: FC = () => {
  useDocumentTitle(
    'Protect PDF',
    'Password-protect your PDF with AES-256 encryption or unlock protected documents locally in your browser.',
  );

  const [mode, setMode] = useState<ToolMode>('protect');
  const [detectionState, setDetectionState] = useState<PdfProtectionState | 'DETECTING'>('DETECTING');

  // Protect state
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(true);
  const [allowEditing, setAllowEditing] = useState(true);

  // Unlock state
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [operationErrors, setOperationErrors] = useState<FileValidationError[]>([]);
  const [outputResult, setOutputResult] = useState<OutputFileItem | null>(null);

  const {
    files,
    errors: pipelineErrors,
    hasFiles,
    addFiles,
    clearFiles,
    clearErrors,
  } = useFilePipeline({
    config: PROTECT_CONFIG,
  });

  const activeFile = files[0];

  // Inspect encryption status upon file selection
  useEffect(() => {
    let isCancelled = false;

    if (!activeFile) {
      setDetectionState('DETECTING');
      setUserPassword('');
      setConfirmPassword('');
      setUnlockPassword('');
      setOutputResult(null);
      setOperationErrors([]);
      return;
    }

    setDetectionState('DETECTING');
    detectPdfProtection(activeFile.file)
      .then((state) => {
        if (!isCancelled) {
          setDetectionState(state);
          // Suggest mode based on file status
          if (state === 'PROTECTED') {
            setMode('unlock');
          } else {
            setMode('protect');
          }
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setDetectionState('UNPROTECTED');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFile]);

  // Compute password strength
  const passwordStrength = useMemo(() => {
    if (!userPassword) return null;
    const len = userPassword.length;
    const hasLower = /[a-z]/.test(userPassword);
    const hasUpper = /[A-Z]/.test(userPassword);
    const hasDigit = /[0-9]/.test(userPassword);
    const hasSymbol = /[^a-zA-Z0-9]/.test(userPassword);

    const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

    if (len >= 12 && variety >= 3) {
      return { label: 'Strong', color: 'text-emerald-500', bg: 'bg-emerald-500', width: 'w-full' };
    }
    if (len >= 8 && variety >= 2) {
      return { label: 'Fair', color: 'text-amber-500', bg: 'bg-amber-500', width: 'w-2/3' };
    }
    return { label: 'Weak', color: 'text-red-500', bg: 'bg-red-500', width: 'w-1/3' };
  }, [userPassword]);

  const passwordsMatch = userPassword === confirmPassword;

  const handleModeChange = (newMode: ToolMode) => {
    setMode(newMode);
    setOperationErrors([]);
  };

  const handleReset = () => {
    setOutputResult(null);
    clearFiles();
    setUserPassword('');
    setConfirmPassword('');
    setUnlockPassword('');
    setOperationErrors([]);
    setDetectionState('DETECTING');
  };

  const handleProtect = async () => {
    if (!activeFile || !userPassword || !passwordsMatch || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setOperationErrors([]);

    try {
      const result = await protectPdf(activeFile.file, {
        userPassword,
        permissions: {
          allowPrinting,
          allowCopying,
          allowEditing,
        },
        onProgress: (pct) => setProgressPercent(pct),
      });

      // Clear password state from runtime memory
      setUserPassword('');
      setConfirmPassword('');

      const defaultFilename = getDefaultDownloadFilename('protect', activeFile.name);
      setOutputResult({
        id: 'protected-output',
        pdfBytes: result.pdfBytes,
        defaultFilename,
        byteSize: result.pdfBytes.byteLength,
        label: 'Password-Protected PDF (AES-256)',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to protect PDF.';
      const code = err instanceof PdfOperationError ? err.code : 'PROCESSING_FAILED';
      setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
    }
  };

  const handleUnlock = async () => {
    if (!activeFile || !unlockPassword || isProcessing) return;

    setIsProcessing(true);
    setProgressPercent(0);
    setOperationErrors([]);

    try {
      const result = await unlockPdf(activeFile.file, {
        password: unlockPassword,
        onProgress: (pct) => setProgressPercent(pct),
      });

      // Clear password state from runtime memory
      setUnlockPassword('');

      const defaultFilename = getDefaultDownloadFilename('unlock', activeFile.name);
      setOutputResult({
        id: 'unlocked-output',
        pdfBytes: result.pdfBytes,
        defaultFilename,
        byteSize: result.pdfBytes.byteLength,
        label: 'Unlocked PDF Document',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to unlock PDF.';
      const code = err instanceof PdfOperationError ? err.code : 'PROCESSING_FAILED';
      setOperationErrors([{ code: code as FileValidationError['code'], message: msg }]);
    } finally {
      setIsProcessing(false);
      setProgressPercent(0);
    }
  };

  const allErrors = [...pipelineErrors, ...operationErrors];

  return (
    <div className="py-10 sm:py-16">
      <Container size="lg">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to={ROUTES.TOOLS}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1.5 py-1"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to all tools</span>
          </Link>
        </div>

        {/* Tool Header */}
        <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald/10 text-emerald dark:bg-emerald/20 flex items-center justify-center shrink-0">
                <ToolIcon toolId="protect" className="w-7 h-7" weight="duotone" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" size="sm">
                    Security
                  </Badge>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Protect PDF
                </h1>
              </div>
            </div>

            <Link to={ROUTES.TOOLS}>
              <Button variant="secondary" size="sm">
                Other Tools
              </Button>
            </Link>
          </div>

          <p className="pt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Password-protect your PDF document with industry-standard AES-256 encryption, or remove protection from locked files. Processed entirely on your device with zero server uploads.
          </p>
        </div>

        {/* Error Notification */}
        {allErrors.length > 0 && (
          <div className="mb-6">
            <FileErrorBanner
              errors={allErrors}
              title={
                operationErrors.length > 0 && pipelineErrors.length === 0
                  ? mode === 'protect'
                    ? 'PDF Protection Failed'
                    : 'PDF Unlock Failed'
                  : undefined
              }
              onDismiss={() => {
                clearErrors();
                setOperationErrors([]);
              }}
            />
          </div>
        )}

        {/* Workspace or Download Docket */}
        {outputResult ? (
          <DownloadResultDocket
            outputs={[outputResult]}
            toolName={mode === 'protect' ? 'Protected Document' : 'Unlocked Document'}
            onBackToEditing={() => setOutputResult(null)}
            onReset={handleReset}
          />
        ) : (
          <div className="space-y-8">
            {/* File Ingestion Dropzone */}
            {!hasFiles && (
              <Dropzone
                onFilesSelected={addFiles}
                config={PROTECT_CONFIG}
                multiple={false}
                title="Select or drop a PDF to protect or unlock"
                subtitle="Choose 1 PDF file (up to 50 MB)"
                disabled={isProcessing}
              />
            )}

            {/* Selected File & Control Area */}
            {hasFiles && activeFile && (
              <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-xs space-y-6">
                {/* File Header Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
                  <div className="truncate">
                    <h2 className="text-base font-bold text-foreground truncate">
                      {activeFile.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {activeFile.formattedSize} &bull;{' '}
                      {detectionState === 'DETECTING' ? (
                        'Analyzing encryption...'
                      ) : detectionState === 'PROTECTED' ? (
                        <span className="text-amber-500 font-semibold">Password Protected</span>
                      ) : detectionState === 'INVALID_PDF' ? (
                        <span className="text-destructive font-semibold">Invalid PDF</span>
                      ) : (
                        <span className="text-emerald font-semibold">Unprotected PDF</span>
                      )}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="text-xs text-muted-foreground hover:text-destructive shrink-0"
                  >
                    Change File
                  </Button>
                </div>

                {/* Mode Switcher Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl border border-border bg-muted/40 max-w-md">
                  <button
                    type="button"
                    onClick={() => handleModeChange('protect')}
                    className={`py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      mode === 'protect'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <LockKey className="w-4 h-4" aria-hidden="true" />
                    <span>Protect PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('unlock')}
                    className={`py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      mode === 'unlock'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <LockKeyOpen className="w-4 h-4" aria-hidden="true" />
                    <span>Unlock PDF</span>
                  </button>
                </div>

                {/* Mode 1: Protect PDF Form */}
                {mode === 'protect' && (
                  <div className="space-y-6 max-w-xl">
                    {detectionState === 'PROTECTED' && (
                      <div className="p-3.5 rounded-lg border border-amber/30 bg-amber/10 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
                        <WarningCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <strong>This PDF is already password-protected.</strong> To set a new password, unlock it first in Unlock mode.
                        </div>
                      </div>
                    )}

                    {/* Password Fields */}
                    <div className="space-y-4">
                      {/* Password Input */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="protect-password-input"
                          className="text-xs font-semibold uppercase tracking-wider text-foreground block"
                        >
                          Password
                        </label>
                        <p className="text-xs text-muted-foreground">
                          This password will be required to open the PDF.
                        </p>
                        <div className="relative">
                          <input
                            id="protect-password-input"
                            type={showUserPassword ? 'text' : 'password'}
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            placeholder="Enter password to protect document"
                            disabled={isProcessing}
                            className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowUserPassword(!showUserPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded p-1"
                            aria-label={showUserPassword ? 'Hide password' : 'Show password'}
                          >
                            {showUserPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Password Strength Gauge */}
                        {passwordStrength && (
                          <div className="pt-1.5 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-muted-foreground">Password strength:</span>
                              <span className={`font-semibold ${passwordStrength.color}`}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${passwordStrength.bg} ${passwordStrength.width} transition-all duration-300`} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password Input */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="confirm-password-input"
                          className="text-xs font-semibold uppercase tracking-wider text-foreground block"
                        >
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            id="confirm-password-input"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password to confirm"
                            disabled={isProcessing}
                            className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 ${
                              confirmPassword && !passwordsMatch
                                ? 'border-destructive focus:ring-destructive'
                                : 'border-border focus:ring-primary'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded p-1"
                            aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                          >
                            {showConfirmPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {confirmPassword && !passwordsMatch && (
                          <p className="text-xs text-destructive">Passwords do not match.</p>
                        )}
                      </div>
                    </div>

                    {/* Permissions Config */}
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                          Permissions
                        </span>
                        <p className="text-xs text-muted-foreground">
                          These settings control what compatible PDF readers allow after the document is opened.
                        </p>
                      </div>

                      <div className="space-y-2.5 p-3.5 rounded-xl border border-border bg-background">
                        <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allowPrinting}
                            onChange={(e) => setAllowPrinting(e.target.checked)}
                            disabled={isProcessing}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                          />
                          <span>Allow printing document</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allowCopying}
                            onChange={(e) => setAllowCopying(e.target.checked)}
                            disabled={isProcessing}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                          />
                          <span>Allow copying text and graphics</span>
                        </label>

                        <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-foreground cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allowEditing}
                            onChange={(e) => setAllowEditing(e.target.checked)}
                            disabled={isProcessing}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                          />
                          <span>Allow modifying document content</span>
                        </label>
                      </div>
                    </div>

                    {/* Encryption Details */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs font-mono">
                      <span className="text-muted-foreground">Standard Encryption:</span>
                      <span className="font-semibold text-emerald flex items-center gap-1.5">
                        <span>AES-256 (Revision 6)</span>
                        <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-border space-y-3">
                      <Button
                        size="lg"
                        disabled={
                          isProcessing ||
                          !userPassword ||
                          !confirmPassword ||
                          !passwordsMatch ||
                          detectionState === 'PROTECTED'
                        }
                        onClick={handleProtect}
                        className="w-full sm:w-auto shadow-sm"
                      >
                        <LockKey className="w-4 h-4 mr-2" aria-hidden="true" />
                        <span>Protect PDF</span>
                        <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                      </Button>

                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald shrink-0" aria-hidden="true" />
                        <span>Your PDF and password are processed locally in your browser. No upload required.</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Mode 2: Unlock PDF Form */}
                {mode === 'unlock' && (
                  <div className="space-y-6 max-w-xl">
                    {detectionState === 'UNPROTECTED' && (
                      <div className="p-3.5 rounded-lg border border-emerald/30 bg-emerald/10 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <strong>This PDF is not password-protected.</strong> You can already view and edit this document without a password.
                        </div>
                      </div>
                    )}

                    {/* Password Field */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="unlock-password-input"
                        className="text-xs font-semibold uppercase tracking-wider text-foreground block"
                      >
                        Password
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Enter the password used to protect this PDF.
                      </p>
                      <div className="relative">
                        <input
                          id="unlock-password-input"
                          type={showUnlockPassword ? 'text' : 'password'}
                          value={unlockPassword}
                          onChange={(e) => setUnlockPassword(e.target.value)}
                          placeholder="Enter document password"
                          disabled={isProcessing}
                          className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded p-1"
                          aria-label={showUnlockPassword ? 'Hide password' : 'Show password'}
                        >
                          {showUnlockPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-border space-y-3">
                      <Button
                        size="lg"
                        disabled={isProcessing || !unlockPassword || detectionState === 'UNPROTECTED'}
                        onClick={handleUnlock}
                        className="w-full sm:w-auto shadow-sm"
                      >
                        <LockKeyOpen className="w-4 h-4 mr-2" aria-hidden="true" />
                        <span>Unlock PDF</span>
                        <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                      </Button>

                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald shrink-0" aria-hidden="true" />
                        <span>Your PDF and password are processed locally in your browser. No upload required.</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Architecture Assurance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">100% Client-Side Encryption</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      All AES-256 encryption and decryption routines run directly in browser WebAssembly memory. Passwords never leave your device.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5 flex items-start gap-3">
                  <Lightning className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Zero Network Transmission</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Neither your file nor your passwords are ever uploaded, recorded, or sent across the network.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Container>

      {/* Processing Overlay Dialog */}
      <ProcessingOverlay
        isOpen={isProcessing}
        title={mode === 'protect' ? 'Encrypting PDF...' : 'Decrypting PDF...'}
        subtitle={
          mode === 'protect'
            ? 'Applying AES-256 standard encryption and permissions...'
            : 'Unlocking document stream with provided credentials...'
        }
        progressPercent={progressPercent}
      />
    </div>
  );
};

