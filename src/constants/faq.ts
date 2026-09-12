export interface FAQItemData {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: readonly FAQItemData[] = [
  {
    id: 'free',
    question: 'Is PDFly free to use?',
    answer:
      'Yes. PDFly is built as an open-access toolkit with zero paywalls, subscription tiers, or feature locks for standard PDF manipulation tasks.',
  },
  {
    id: 'uploads',
    question: 'Are my files uploaded to a remote server?',
    answer:
      'No. PDFly is architected for client-side processing. Operations are designed to run in your local web browser using JavaScript and WebAssembly, so your files do not need to be transmitted to our servers.',
  },
  {
    id: 'tools',
    question: 'Which tools are currently planned?',
    answer:
      'The initial suite includes Merge PDF, Split PDF, Reorder Pages, Rotate Pages, Images to PDF, PDF to Images, and PDF Compression.',
  },
  {
    id: 'mobile',
    question: 'Does PDFly work on mobile devices?',
    answer:
      'Yes, the interface is fully responsive on smartphones and tablets. However, processing speed and memory handling for very large multi-page documents may vary depending on your mobile device’s hardware and browser limits.',
  },
  {
    id: 'offline',
    question: 'Can I use PDFly completely offline?',
    answer:
      'Currently, an active internet connection is required to initially load the application in your browser. Full offline Progressive Web App (PWA) caching and service workers are planned for a subsequent update.',
  },
  {
    id: 'limits',
    question: 'Are there file size limitations?',
    answer:
      'Because all processing takes place within your browser’s available memory, practical limits depend on your computer or phone RAM. Most standard documents up to 50MB–100MB are handled comfortably by modern browsers.',
  },
] as const;

