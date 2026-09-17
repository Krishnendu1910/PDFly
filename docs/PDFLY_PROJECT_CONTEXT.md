# PDFly — Project Context

## 1. Project Overview

PDFly is a browser-based PDF toolkit focused on useful, privacy-conscious PDF operations without requiring users to upload documents to a processing server.

Current release baseline: **v1**

Product direction:
- Professional
- Simple
- Clean
- Intentional
- Tool-first
- Friendly but not childish
- No unnecessary UI or technical jargon

PDFly should feel like a real public internet product, not an AI-generated demo.

## 2. Current v1 Scope

PDFly currently contains **15 PDF tools**:

1. Merge PDF
2. Split PDF
3. Reorder PDF
4. Rotate PDF
5. Remove Pages
6. Extract Pages
7. Images to PDF
8. PDF to Images
9. PDF to Markdown
10. Compress PDF
11. Page Numbers
12. Watermark
13. Crop PDF
14. Sign PDF
15. Protect PDF (Lock / Unlock)

### Homepage — Popular PDF Tools

The current six-tool order is intentionally:

1. Images to PDF
2. PDF to Images
3. Merge PDF
4. Compress PDF
5. Split PDF
6. Sign PDF

Do not change this order casually.

## 3. Technology Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- React Router
- pdf-lib
- PDF.js (`pdfjs-dist`)
- QPDF WASM
- Web Workers
- Phosphor Icons
- Manrope
- DM Mono

The icon system has migrated away from Lucide.

**Do not reintroduce `lucide-react`.**

## 4. PDF Processing Architecture

PDFly is designed around local browser processing:

Browser → file validation → appropriate PDF engine → Web Worker where appropriate → generated output → preview/result → download

### Engines

**pdf-lib** — used for many PDF manipulation and generation operations.

**PDF.js** — used primarily for PDF rendering and text/content extraction.

**QPDF WASM** — used for operations requiring structural/security-oriented PDF processing, including Protect/Unlock.

### Architecture principle

Do not introduce a new PDF processing library merely because it is convenient. First inspect the existing architecture and determine whether existing engines can support the feature safely.

## 5. Privacy and Security

PDFly's processing model is intentionally local.

Documents should not be uploaded to remote conversion/processing services.

Do not introduce:
- remote document processing
- file uploads to third-party APIs
- analytics that transmit document contents
- fetch/XHR/beacon/WebSocket document transfer
- hidden document telemetry

### PDF.js hardening

Current configuration includes:
- `enableScripting: false`
- `isEvalSupported: false`
- `disableAutoFetch: true`
- `disableStream: true`

Do not weaken these settings without a documented, reviewed reason.

### Encryption

Do not bypass PDF encryption.

Do not use `ignoreEncryption: true`.

Encrypted PDF handling should respect the existing architecture and user-facing error mapping.

## 6. QPDF / Protect-Unlock

QPDF WASM is already part of the production architecture.

Protect/Unlock PDF must remain intact when modifying unrelated features.

Do not remove QPDF infrastructure simply because a future feature does not need it.

## 7. File and Download Architecture

PDFly has centralized handling for generated-file downloads and filename changes.

Important behavior:
- Generated files can be renamed before download.
- `.pdf` extension handling is automatic where appropriate.
- Filename sanitization protects against unsafe/path-traversal-style names and problematic filenames.
- Split outputs receive sensible numbered filenames.
- Download All preserves individual output names.
- No ZIP requirement for the current Split workflow.

When adding tools, **reuse the existing download/rename system**.

Do not create duplicate filename or download implementations.

## 8. UX and Design System

The product visual direction is:

**Professional utility + friendly personality.**

Approximate philosophy:
- 70% professional utility
- 20% friendly personality
- 10% playful character

### Avoid
- purple/blue AI-style gradients
- glowing buttons
- glassmorphism
- blobs
- excessive decorative animation
- generic AI imagery
- unnecessary technical/developer labels

### Current visual system
- Phosphor Icons
- Manrope for primary UI typography
- DM Mono for limited metadata/technical contexts
- neutral light surfaces
- subtle dark-mode grid
- colorful tool identity
- clean product utility aesthetic

Motion should be subtle and purposeful.

Respect reduced-motion preferences.

## 9. Responsive Design

PDFly must work across mobile phones, tablets, and desktop.

Important widths:
- 375
- 390
- 430
- 768
- 800
- 834
- 900
- 1024
- 1280
- 1440

Desktop uses a tools mega-menu.

Mobile uses full-screen navigation and a small-screen quick-action/FAB for the six popular tools.

Avoid horizontal overflow and clipped/truncated navigation.

## 10. Accessibility

Existing accessibility expectations:
- keyboard navigation
- visible focus states
- semantic controls
- accessible labels
- screen-reader status announcements
- accessible errors
- reduced-motion support
- no information conveyed by color alone

New tools must preserve these standards.

## 11. Development Methodology

PDFly is developed **phase-by-phase**.

Never implement the entire roadmap in one shot.

For each phase:
1. Define exact scope.
2. Implement only that scope.
3. Stop.
4. Audit.
5. Review.
6. Run tests.
7. Commit/push only after approval.

### Required audit after every phase

Check:
- functionality
- bugs
- security vulnerabilities/leaks
- implementation-plan deviation
- performance
- scalability
- concurrency/resource usage
- slow/unstable internet resilience where relevant
- UX
- accessibility
- responsive behavior
- maintainability
- regression risk
- best practices

A short deadline means a smaller MVP scope, **not lower quality**.

AI-generated code must not be blindly trusted.

ChatGPT/user controls architecture and review.

Antigravity is primarily used for implementation.

## 12. Antigravity Rules

When giving an Antigravity implementation prompt:
- Make the phase scope explicit.
- Tell Antigravity to implement ONLY that phase.
- Tell it not to start later phases.
- Require testing and audit.
- Require a final implementation report.
- Do not allow unnecessary redesign.
- Do not allow README changes unless explicitly requested.
- Do not allow Git commit/push unless explicitly requested.

## 13. Git Workflow

Git operations for PDFly should be performed through the **normal VS Code Integrated Terminal**, not Antigravity.

Preferred workflow:

```bash
git status
git diff --stat
# review changes
git add .
git commit -m "..."
git push origin main
git status
```

Before committing, run relevant verification commands.

Typical verification:

```bash
npm run type-check
npm run lint
npm test -- --runInBand
npm run build
```

Do not use destructive commands such as `git reset --hard` or `git clean -fd` unless explicitly and deliberately requested.

## 14. Testing Baseline

The latest verified stable state after reverting the abandoned Office conversion work reported:
- 54 test files passed
- 861 tests passed
- 0 failures
- TypeScript: 0 errors
- ESLint: 0 errors / 0 warnings
- Production build: successful
- Git working tree: clean
- `lucide-react`: no remaining references

Treat these as the latest known baseline, but **always rerun tests against the actual current repository before relying on them**.

## 15. Deliberately Abandoned / Deferred Office Conversion Work

An Office conversion suite was temporarily attempted and then completely reverted.

Removed:
- Word → PDF
- PDF → Word
- PowerPoint → PDF
- PDF → PowerPoint
- Excel → PDF
- PDF → Excel

Associated implementation files, tests, dependencies, routes, registry entries, and Office-specific configuration were removed.

Reason for deferral:

High-fidelity Office conversion is substantially more complex than the existing PDF operations, particularly for browser-only processing.

Do not reintroduce these tools casually.

If revisiting them later, perform a separate architecture/fidelity/licensing/browser-compatibility audit first.

## 16. Planned / Possible Future Tools

Potential future PDF tools discussed:
1. Flatten PDF
2. PDF Repair
3. Redact PDF
4. Remove Metadata
5. PDF Scanner

These are **future ideas, not part of v1**.

Do not implement them automatically.

### Important future considerations

**Flatten PDF:** flatten supported interactive form fields/annotations without unnecessarily rasterizing the entire PDF.

**PDF Repair:** attempt recoverable structural repair, potentially using QPDF. Never promise that every corrupted PDF can be repaired.

**Redact PDF:** security-critical. A black rectangle over text is NOT sufficient redaction. Underlying sensitive content must actually be removed or replaced.

**Remove Metadata:** remove supported PDF document information and metadata streams. Do not claim metadata removal equals complete PDF sanitization unless the implementation genuinely provides that.

**PDF Scanner:** potential future feature for camera/image capture, document cropping/enhancement, multi-page scanning, and eventually local OCR.

## 17. Product Philosophy

PDFly v1 does not need to compete with every large PDF platform feature-for-feature.

The current objective is to establish:
- usefulness
- reliability
- privacy
- simple UX
- fast workflows
- good responsive behavior
- trustworthy product behavior

Real-world feedback should guide future features.

Avoid speculative feature accumulation.

## 18. Continuing After a Long Gap

If development resumes after weeks or months:

1. Read this document.
2. Inspect the current repository.
3. Check `git status`.
4. Check the latest commit.
5. Review recent Git history.
6. Run type-check/lint/tests/build.
7. Compare the actual codebase against this document.
8. Treat the actual repository as the source of truth if this document and code disagree.
9. Do not assume old planned features were implemented.
10. Do not assume old bugs still exist without reproducing them.

Useful commands:

```bash
git status
git log --oneline -20
git log --decorate --oneline --graph -20
npm run type-check
npm run lint
npm test -- --runInBand
npm run build
```

## 19. Current Release Philosophy

**PDFly v1 is intentionally feature-limited.**

The current recommendation is to release the 15-tool product to real users and gather feedback before expanding the feature set.

Real-world feedback should determine whether the next work is:
- bug fixing
- UX improvement
- performance improvement
- accessibility improvement
- reliability improvement
- a new tool

Feature requests should not automatically become implementation priorities.

## 20. Source of Truth

Priority order when information conflicts:

1. **Current source code**
2. **Current tests**
3. **Current Git history**
4. **This project-context document**
5. Older conversations/plans

This document describes intended project history and decisions, but the repository is authoritative for the actual implementation.

## 21. Important Current Constraint

Do not modify the README unless explicitly requested.

The README has intentionally been left as-is while the project context is maintained separately in this document.
