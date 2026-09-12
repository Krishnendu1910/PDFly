import { useEffect } from 'react';

export function useDocumentTitle(title?: string, description?: string): void {
  useEffect(() => {
    const defaultTitle = 'PDFly — Simple PDF Tools, Right in Your Browser';
    document.title = title ? `${title} | PDFly` : defaultTitle;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }, [title, description]);
}

