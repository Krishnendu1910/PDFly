import { useState, useMemo, type FC } from 'react';
import { Search, X, Layers, Filter } from 'lucide-react';
import { TOOLS } from '@/constants/tools';
import type { ToolCategory } from '@/types/tools';
import { Container } from '@/components/ui/Container';
import { ToolCard } from '@/components/marketing/ToolCard';
import { Button } from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const categories: { id: ToolCategory; label: string }[] = [
  { id: 'all', label: 'All Tools' },
  { id: 'organize', label: 'Organize' },
  { id: 'edit', label: 'Edit' },
  { id: 'convert', label: 'Convert' },
  { id: 'optimize', label: 'Optimize' },
];

export const ToolsIndexPage: FC = () => {
  useDocumentTitle('PDF Tools', 'Browse all client-side PDF tools in the PDFly catalog.');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory =
        activeCategory === 'all' || tool.category === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="py-12 sm:py-16 space-y-10">
      <Container size="lg">
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Browser Toolkit</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Explore All PDF Tools
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Every tool in PDFly is designed to operate directly in your browser memory. Select a utility below to view its workflow and parameters.
          </p>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filter tools by category"
            className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none"
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? TOOLS.length
                  : TOOLS.filter((t) => t.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search
              className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools..."
              aria-label="Search tools by name or description"
              className="w-full pl-9.5 pr-8 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Results Grid */}
        <div className="mt-8">
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool, idx) => (
                <ToolCard key={tool.id} tool={tool} index={idx} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card/50 max-w-md mx-auto space-y-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
                <Filter className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No tools found</h3>
              <p className="text-sm text-muted-foreground">
                No tools matched &quot;{searchQuery}&quot; in the {activeCategory === 'all' ? 'catalog' : activeCategory} category.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
              >
                Reset filters
              </Button>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};
