import type { FC } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/contexts';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { router } from '@/routes';

export const App: FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

