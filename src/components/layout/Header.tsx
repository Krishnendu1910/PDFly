import { useState, useEffect, useRef, type FC } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  List,
  X,
  CaretDown,
  SquaresFour,
  ArrowRight,
} from "@/components/icons";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ROUTES } from "@/constants/routes";
import { TOOL_MAP } from "@/constants/tools";
import { getToolTheme } from "@/lib/theme/toolTheme";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils/cn";

const DROPDOWN_CATEGORIES = [
  {
    title: "Organize",
    toolIds: ["merge", "split", "reorder", "remove-pages", "extract", "rotate"],
  },
  {
    title: "Convert",
    toolIds: ["images-to-pdf", "pdf-to-images", "pdf-to-markdown"],
  },
  {
    title: "Edit",
    toolIds: ["crop", "page-numbers", "watermark"],
  },
  {
    title: "Optimize & Security",
    toolIds: ["compress", "sign", "protect"],
  },
] as const;

export const Header: FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
  }, [location.pathname]);

  // Click outside to close tools dropdown
  useEffect(() => {
    if (!toolsDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setToolsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [toolsDropdownOpen]);

  // Escape key closes menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setToolsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          {/* LEFT SECTION: Logo + Tools Dropdown + Direct Links */}
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            {/* Brand Logo */}
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2 text-foreground font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
              aria-label="PDFly home"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-xs">
                <FileText className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="font-display tracking-tight font-bold">PDFly</span>
            </Link>

            {/* Tools Mega-Dropdown (Desktop & Tablet) */}
            <div className="md:static lg:relative hidden md:block" ref={dropdownRef}>
              <button
                type="button"
                aria-expanded={toolsDropdownOpen}
                aria-haspopup="true"
                onClick={() => setToolsDropdownOpen((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  toolsDropdownOpen
                    ? "bg-muted text-foreground"
                    : "text-foreground hover:bg-muted/70",
                )}
              >
                <SquaresFour className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Tools</span>
                <CaretDown
                  className={cn(
                    "w-3.5 h-3.5 text-muted-foreground transition-transform duration-150",
                    toolsDropdownOpen && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>

              {/* Dropdown Menu Panel */}
              <AnimatePresence>
                {toolsDropdownOpen && (
                  <motion.div
                    initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
                    animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute top-full mt-2 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden",
                      // Tablet (768px – 1023px): contained inside viewport with minimum 16px margins
                      "left-4 sm:left-6 w-[min(720px,calc(100vw-48px))] max-w-[calc(100vw-32px)]",
                      // Desktop (>= 1024px): anchored directly below Tools button
                      "lg:left-0 lg:w-[760px] lg:max-w-none",
                    )}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
                      {DROPDOWN_CATEGORIES.map((cat) => {
                        const isOrganize = cat.title === "Organize";
                        const isOptimize = cat.title === "Optimize & Security";

                        return (
                          <div
                            key={cat.title}
                            className={cn(
                              "space-y-2",
                              isOrganize && "md:row-span-2 lg:row-span-1",
                              isOptimize && "md:col-span-2 lg:col-span-1",
                            )}
                          >
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                              {cat.title}
                            </h4>
                            <div
                              className={cn(
                                "space-y-0.5",
                                isOptimize &&
                                  "md:grid md:grid-cols-3 md:gap-2 md:space-y-0 lg:space-y-0.5 lg:grid-cols-1 lg:gap-0",
                              )}
                            >
                              {cat.toolIds.map((id) => {
                                const tool = TOOL_MAP[id];
                                if (!tool) return null;
                                const theme = getToolTheme(tool.id || tool.slug);
                                const Icon = tool.icon;
                                return (
                                  <Link
                                    key={tool.id}
                                    to={ROUTES.TOOL_DETAIL(tool.slug)}
                                    onClick={() => setToolsDropdownOpen(false)}
                                    className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted text-foreground transition-colors group"
                                  >
                                    <span
                                      className={cn(
                                        "w-6 h-6 rounded flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105",
                                        theme.iconBg,
                                      )}
                                    >
                                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                                    </span>
                                    <span className="text-xs font-medium group-hover:text-primary transition-colors">
                                      {tool.name}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Dropdown Footer Action */}
                    <div className="border-t border-border bg-muted/40 px-5 py-2.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        All tools process documents locally in your browser.
                      </span>
                      <Link
                        to={ROUTES.TOOLS}
                        onClick={() => setToolsDropdownOpen(false)}
                        className="font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        <span>Explore All 15 Tools</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Direct Category Links (Desktop) */}
            <nav aria-label="Quick Tools Navigation" className="hidden lg:flex items-center gap-1">
              <Link
                to={ROUTES.TOOL_DETAIL("merge")}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Merge
              </Link>
              <Link
                to={ROUTES.TOOL_DETAIL("compress")}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Compress
              </Link>
              <Link
                to={ROUTES.TOOL_DETAIL("images-to-pdf")}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Convert
              </Link>
              <Link
                to={ROUTES.TOOL_DETAIL("crop")}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Edit
              </Link>
              <Link
                to={ROUTES.TOOL_DETAIL("sign")}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Sign
              </Link>
            </nav>
          </div>

          {/* RIGHT SECTION: Desktop Theme Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
          </div>

          {/* Mobile Header Bar: Theme Toggle & Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              ref={triggerRef}
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <List className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Navigation Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-navigation"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden md:hidden"
          >
            {/* Top Bar inside Full-Screen Menu */}
            <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-border bg-background shrink-0">
              <Link
                to={ROUTES.HOME}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-foreground font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
                aria-label="PDFly home"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-xs">
                  <FileText className="w-5 h-5" aria-hidden="true" />
                </span>
                <span className="font-display tracking-tight font-bold">PDFly</span>
              </Link>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Scrollable Tool Categories Body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
              {DROPDOWN_CATEGORIES.map((cat) => (
                <div key={cat.title} className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                    {cat.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.toolIds.map((id) => {
                      const tool = TOOL_MAP[id];
                      if (!tool) return null;
                      const theme = getToolTheme(tool.id || tool.slug);
                      const Icon = tool.icon;
                      return (
                        <Link
                          key={tool.id}
                          to={ROUTES.TOOL_DETAIL(tool.slug)}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-muted/60 text-xs font-medium text-foreground transition-colors shadow-2xs"
                        >
                          <span
                            className={cn(
                              "w-6 h-6 rounded flex items-center justify-center shrink-0",
                              theme.iconBg,
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                          </span>
                          <span className="truncate">{tool.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Bottom CTA Action */}
              <div className="pt-4 border-t border-border pb-8">
                <Link
                  to={ROUTES.TOOLS}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-xs hover:bg-primary/90 transition-colors"
                >
                  <span>Explore All 15 Tools</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
