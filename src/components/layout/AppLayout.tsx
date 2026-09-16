import { useEffect, type FC } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SkipLink } from '@/components/layout/SkipLink';
import { MobileQuickTools } from '@/components/common/MobileQuickTools';

export const AppLayout: FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // If navigation targets an in-page anchor, smoothly scroll to that element
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // For any link-driven route navigation (PUSH/REPLACE), reset scroll position to top
    if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [location.pathname, location.key, location.hash, navigationType]);

  // When navigating routes, location.key ensures route entrance transitions and fresh lifecycles;
  // when navigating to an in-page hash anchor, location.pathname prevents remounting the page.
  const pageKey = location.hash ? location.pathname : location.key;

  return (
    <div className="min-h-screen flex flex-col text-foreground antialiased selection:bg-primary/20 selection:text-primary relative z-10">
      <SkipLink />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none" key={pageKey}>
        <Outlet />
      </main>
      <Footer />
      <MobileQuickTools />
    </div>
  );
};


