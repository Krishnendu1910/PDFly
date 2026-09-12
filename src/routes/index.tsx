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

// Lazy-load PDF tool pages so pdf-lib / pdfjs-dist are not in the main landing bundle
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
            path: 'pdf-to-images',
            element: <ToolPlaceholderPage toolId="pdf-to-images" />,
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
