# PDFly — Simple PDF Tools, Right in Your Browser

PDFly is a fast, privacy-respecting, client-side web application for everyday PDF tasks. Unlike standard online PDF utilities that upload sensitive documents to remote servers, PDFly performs document parsing, page manipulation, image conversion, and compression directly inside your browser.

> **Privacy Guarantee**: Files are processed locally in the browser and are not uploaded for processing.

---

## Features

PDFly provides focused, single-purpose utilities for working with PDF documents:

* **Merge PDF** (`/tools/merge`): Combine multiple PDF documents into a single file, preserving original order, page contents, and vector text.
* **Split PDF** (`/tools/split`): Extract specific pages, discrete page ranges (e.g. `1-3, 5, 8-10`), or extract all pages into a new document.
* **Reorder PDF** (`/tools/reorder`): Interactively reorganize page sequence via drag-and-drop or accessible keyboard controls.
* **Rotate PDF** (`/tools/rotate`): Permanently adjust document page orientations (90°, 180°, 270° clockwise) individually or in bulk without re-rasterizing text.
* **Images to PDF** (`/tools/images-to-pdf`): Convert JPEG, PNG, and WebP images into a standardized PDF, with EXIF orientation normalization (including mirrored orientations) and proportional scaling.
* **Compress PDF** (`/tools/compress`): Reduce PDF file sizes by selectively optimizing embedded JPEG image streams while preserving vector lines, selectable text, and document geometry.
* **PDF to Images** (`/tools/pdf-to-images`): **Coming Soon** — Interface shell and routing established; conversion engine planned for a future update.

---

## Tech Stack

* **Framework & Build**: [React 18](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/), [Vite 6](https://vite.dev/)
* **Routing**: [React Router v6](https://reactrouter.com/) (Single Page Application architecture)
* **Styling & Animation**: [Tailwind CSS v3](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **PDF Manipulation Engine**: [`pdf-lib`](https://pdf-lib.js.org/) (pure client-side PDF generation and page tree assembly)
* **PDF Rendering Engine**: [`pdfjs-dist`](https://mozilla.github.io/pdf.js/) (sandboxed web worker for thumbnail extraction)
* **Testing**: [Vitest](https://vitest.dev/) with jsdom

---

## Architecture & Security Posture

1. **Client-Side Processing**: All document parsing, manipulation, and rendering run entirely inside the user's browser memory. Files are processed locally in the browser and are not uploaded for processing. The application contains no analytics or telemetry trackers.
2. **Worker Isolation**: PDF thumbnail rendering is delegated to a dedicated PDF.js web worker (`pdf.worker.min.mjs`), isolated from the main UI thread.
3. **Execution Hardening**: PDF.js is initialized with `enableScripting: false` (blocking embedded PDF JavaScript) and `isEvalSupported: false` (preventing dynamic code evaluation).
4. **Defensive Resource Limits**:
   * Split range expansion limit: 2,000 pages max per operation.
   * Cumulative merge limit: 5,000 pages max across input files.
   * Reorder & rotate limits: 2,000 pages max per document.
   * Batch image conversion limit: 100 images max per operation.
   * Canvas dimension safety boundary: 8,192px maximum dimension to prevent browser tab crashes.
5. **Memory Cleanup**: Ephemeral `blob:` object URLs are revoked immediately after preview rendering or download triggering. PDF.js document and page handles are destroyed in `finally` blocks.
6. **Download Integrity**: Generated PDF downloads are atomically validated against the standard `%PDF-` magic byte signature before initiating browser downloads, and output filenames are sanitized against path traversal and OS device names.

---

## Local Development

### Prerequisites

* Node.js 18+ or 20+
* npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/Krishnendu1910/PDFly.git
cd PDFly

# Install dependencies
npm install

# Start local development server
npm run dev
```

The local development server will start at `http://localhost:5173`.

### Verification Commands

```bash
# Run unit and security test suites (161 tests)
npm test -- --run

# Run ESLint
npm run lint

# Run TypeScript type check
npm run type-check

# Run production build
npm run build
```

---

## Production Build

To build the static production distribution:

```bash
npm run build
```

The output is written to the `dist/` directory:
* Standard static assets (HTML, CSS, JavaScript, SVG)
* Pre-bundled PDF.js web worker (`dist/assets/pdf.worker.min-*.mjs`)
* Fully self-contained SPA suitable for static hosting

---

## Deployment

PDFly is a client-side Single Page Application (SPA) that requires no backend server or database. It can be deployed to any static hosting provider.

### Recommended Providers

* **Vercel**: Configuration is provided in `vercel.json` with SPA route rewrites.
* **Cloudflare Pages / Netlify**: Configuration is provided in `public/_redirects` (`/* /index.html 200`) for SPA history fallback.
* **GitHub Pages**: Can be served via GitHub Actions deploying the `dist/` directory.

### Requirements for Static Hosting

* HTTPS enabled (required for modern Web APIs like `createImageBitmap` and `crypto.randomUUID`).
* SPA fallback: All non-asset routes (e.g. `/tools/merge`, `/privacy`) must resolve to `index.html` with HTTP 200.

---

## Technical Limitations

* **Browser Memory Constraints**: Because all operations run in client RAM, processing extremely large documents (e.g., >100 MB files or hundreds of uncompressed scan images) may reach browser tab memory limits on constrained devices.
* **Encrypted Documents**: Password-protected and encrypted PDFs cannot be processed. Users must remove document passwords before uploading.
* **CPU Intensity**: Complex operations like image recompression and thumbnail rendering run on the user's CPU; processing time is dependent on local hardware capabilities.
* **Browser Canvas Boundaries**: Canvas allocations are bounded to 8,192px max dimension to prevent out-of-memory errors on mobile browsers.

---

## License

This project is currently private and proprietary. All rights reserved.

