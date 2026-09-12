export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  PRIVACY: '/privacy',
  TOOLS: '/tools',
  TOOL_MERGE: '/tools/merge',
  TOOL_SPLIT: '/tools/split',
  TOOL_REORDER: '/tools/reorder',
  TOOL_ROTATE: '/tools/rotate',
  TOOL_IMAGES_TO_PDF: '/tools/images-to-pdf',
  TOOL_COMPRESS: '/tools/compress',
  TOOL_PDF_TO_IMAGES: '/tools/pdf-to-images',
  TOOL_DETAIL: (slug: string) => `/tools/${slug}`,
} as const;

