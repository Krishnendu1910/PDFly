import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/pages/Home/HomePage';
import { AboutPage } from '@/pages/About/AboutPage';
import { PrivacyPage } from '@/pages/Privacy/PrivacyPage';
import { ToolsIndexPage } from '@/pages/tools/ToolsIndexPage';
import { ToolPlaceholderPage } from '@/pages/tools/ToolPlaceholderPage';
import { NotFoundPage } from '@/pages/NotFound/NotFoundPage';

const MergeToolPage = lazy(() =>
  import('@/pages/tools/MergeToolPage').then((m) => ({ default: m.MergeToolPage })),
);
const SplitToolPage = lazy(() =>
  import('@/pages/tools/SplitToolPage').then((m) => ({ default: m.SplitToolPage })),
);
const ReorderToolPage = lazy(() =>
  import('@/pages/tools/ReorderToolPage').then((m) => ({ default: m.ReorderToolPage })),
);
const RotateToolPage = lazy(() =>
  import('@/pages/tools/RotateToolPage').then((m) => ({ default: m.RotateToolPage })),
);
const ImagesToPdfToolPage = lazy(() =>
  import('@/pages/tools/ImagesToPdfToolPage').then((m) => ({ default: m.ImagesToPdfToolPage })),
);
const CompressToolPage = lazy(() =>
  import('@/pages/tools/CompressToolPage').then((m) => ({ default: m.CompressToolPage })),
);
const RemovePagesToolPage = lazy(() =>
  import('@/pages/tools/RemovePagesToolPage').then((m) => ({ default: m.RemovePagesToolPage })),
);
const ExtractToolPage = lazy(() =>
  import('@/pages/tools/ExtractToolPage').then((m) => ({ default: m.ExtractToolPage })),
);
const PdfToImagesToolPage = lazy(() =>
  import('@/pages/tools/PdfToImagesToolPage').then((m) => ({ default: m.PdfToImagesToolPage })),
);
const PageNumbersToolPage = lazy(() =>
  import('@/pages/tools/PageNumbersToolPage').then((m) => ({ default: m.PageNumbersToolPage })),
);
const WatermarkToolPage = lazy(() =>
  import('@/pages/tools/WatermarkToolPage').then((m) => ({ default: m.WatermarkToolPage })),
);
const CropToolPage = lazy(() =>
  import('@/pages/tools/CropToolPage').then((m) => ({ default: m.CropToolPage })),
);
const PdfToMarkdownToolPage = lazy(() =>
  import('@/pages/tools/PdfToMarkdownToolPage').then((m) => ({ default: m.PdfToMarkdownToolPage })),
);
const SignToolPage = lazy(() =>
  import('@/pages/tools/SignToolPage').then((m) => ({ default: m.SignToolPage })),
);

const loadingFallback = (
  <div className="py-24 flex flex-col items-center justify-center text-center space-y-3" role="status">
    <Loader2 className="w-8 h-8 text-primary animate-spin" aria-hidden="true" />
    <span className="text-sm font-medium text-muted-foreground">Loading toolkit engine...</span>
  </div>
);

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: 'privacy',
        element: <PrivacyPage />,
      },
      {
        path: 'tools',
        children: [
          {
            index: true,
            element: <ToolsIndexPage />,
          },
          {
            path: 'merge',
            element: (
              <Suspense fallback={loadingFallback}>
                <MergeToolPage />
              </Suspense>
            ),
          },
          {
            path: 'split',
            element: (
              <Suspense fallback={loadingFallback}>
                <SplitToolPage />
              </Suspense>
            ),
          },
          {
            path: 'reorder',
            element: (
              <Suspense fallback={loadingFallback}>
                <ReorderToolPage />
              </Suspense>
            ),
          },
          {
            path: 'rotate',
            element: (
              <Suspense fallback={loadingFallback}>
                <RotateToolPage />
              </Suspense>
            ),
          },
          {
            path: 'images-to-pdf',
            element: (
              <Suspense fallback={loadingFallback}>
                <ImagesToPdfToolPage />
              </Suspense>
            ),
          },
          {
            path: 'compress',
            element: (
              <Suspense fallback={loadingFallback}>
                <CompressToolPage />
              </Suspense>
            ),
          },
          {
            path: 'remove-pages',
            element: (
              <Suspense fallback={loadingFallback}>
                <RemovePagesToolPage />
              </Suspense>
            ),
          },
          {
            path: 'extract',
            element: (
              <Suspense fallback={loadingFallback}>
                <ExtractToolPage />
              </Suspense>
            ),
          },
          {
            path: 'pdf-to-images',
            element: (
              <Suspense fallback={loadingFallback}>
                <PdfToImagesToolPage />
              </Suspense>
            ),
          },
          {
            path: 'page-numbers',
            element: (
              <Suspense fallback={loadingFallback}>
                <PageNumbersToolPage />
              </Suspense>
            ),
          },
          {
            path: 'watermark',
            element: (
              <Suspense fallback={loadingFallback}>
                <WatermarkToolPage />
              </Suspense>
            ),
          },
          {
            path: 'crop',
            element: (
              <Suspense fallback={loadingFallback}>
                <CropToolPage />
              </Suspense>
            ),
          },
          {
            path: 'pdf-to-markdown',
            element: (
              <Suspense fallback={loadingFallback}>
                <PdfToMarkdownToolPage />
              </Suspense>
            ),
          },
          {
            path: 'sign',
            element: (
              <Suspense fallback={loadingFallback}>
                <SignToolPage />
              </Suspense>
            ),
          },
          {
            path: ':toolSlug',
            element: <ToolPlaceholderPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
