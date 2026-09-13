import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export const AboutPage: FC = () => {
  useDocumentTitle(
    'About',
    'Learn about PDFly, our browser-based document toolkit, and our commitment to privacy.',
  );
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 15 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="py-12 sm:py-16"
    >
      <Container size="md">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            About PDFly
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Fast, simple PDF utilities that run entirely in your browser.
          </p>
        </div>

        {/* Narrative Content */}
        <div className="space-y-6 text-foreground text-base sm:text-lg leading-relaxed">
          <p className="text-muted-foreground">
            Most online PDF tools require you to upload confidential documents — like contracts, financial statements, and personal records — to remote servers. PDFly solves this by performing all document processing directly on your computer or phone.
          </p>
          <p className="text-muted-foreground">
            Your files are loaded into local browser memory and never leave your device. Because there are no uploads or remote queues, your tasks finish faster and your personal documents stay completely private.
          </p>

          {/* Action Links */}
          <div className="pt-6 flex flex-wrap items-center gap-4">
            <Link to={ROUTES.TOOLS}>
              <Button size="md">
                Explore Tools
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </Link>
            <Link to={ROUTES.PRIVACY}>
              <Button variant="outline" size="md">
                Privacy Policy
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </motion.div>
  );
};

