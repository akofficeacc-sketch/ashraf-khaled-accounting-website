"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  FileText,
  Percent,
  Receipt,
  TrendingUp,
  Wallet,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { content } from "@/lib/site-content";
import { useLang } from "./lang-provider";
import { DirArrow, ExtArrow, Reveal, SectionHead } from "./primitives";
import { cn } from "@/lib/utils";

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  percent: Percent,
  file: FileText,
  check: CheckCircle2,
  building: Building2,
  invoice: Receipt,
  wallet: Wallet,
  trending: TrendingUp,
};

export function Services() {
  const { lang } = useLang();
  const t = content[lang].services;
  const [filter, setFilter] = React.useState("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const filtered = React.useMemo(
    () => (filter === "all" ? t.items : t.items.filter((s) => s.cat === filter)),
    [filter, t.items]
  );

  return (
    <section id="services" className="relative scroll-mt-24 overflow-hidden bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow={t.eyebrow} title={t.title} sub={t.sub} />

        {/* Filter Tabs & View Toggle */}
        <Reveal delay={0.15}>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-3">
            <div
              role="tablist"
              aria-label={lang === "ar" ? "تصفية الخدمات" : "Filter services"}
              className="flex snap-x gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap"
            >
              {t.filters.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "shrink-0 rounded-[4px] px-4 py-2 text-xs sm:text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-ring",
                      active
                        ? "bg-deep text-cream"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 rounded-[6px] border border-border bg-card p-1 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label={lang === "ar" ? "عرض كشبكة" : "Grid view"}
                className={cn(
                  "p-1.5 rounded-[4px] transition-colors",
                  viewMode === "grid" ? "bg-deep text-cream" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label={lang === "ar" ? "عرض كقائمة" : "List view"}
                className={cn(
                  "p-1.5 rounded-[4px] transition-colors",
                  viewMode === "list" ? "bg-deep text-cream" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Reveal>

        {/* Content Render: Bento Grid vs Editorial List */}
        <div className="mt-8">
          <AnimatePresence mode="popLayout">
            {viewMode === "grid" ? (
              <motion.div
                key="grid-view"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filtered.map((s, i) => {
                  const Icon = serviceIcons[s.icon] ?? BookOpen;
                  return (
                    <motion.article
                      layout
                      key={s.key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-border/80 bg-card p-6 transition-colors duration-300 hover:border-gold/60"
                    >
                        <span
                          className="absolute inset-x-0 top-0 h-[2px] bg-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          aria-hidden="true"
                        />

                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="grid h-11 w-11 place-items-center rounded-[6px] border border-border text-gold transition-colors duration-300 group-hover:border-gold/50 group-hover:text-gold-2">
                            <Icon className="h-6 w-6" aria-hidden="true" />
                          </span>
                          <span
                            className="select-none text-2xl font-black text-muted-foreground/20 transition-colors group-hover:text-gold/40"
                            aria-hidden="true"
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>

                        <h3 className="mt-5 text-lg font-extrabold text-foreground transition-colors group-hover:text-primary">
                          {s.title}
                        </h3>
                        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                          {s.desc}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-border/50">
                        <a
                          href="#contact"
                          className="inline-flex items-center gap-2 text-xs font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-primary transition-colors group-hover:text-gold-2"
                        >
                          <span>{t.discuss}</span>
                          <ExtArrow className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                        </a>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="list-view"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="divide-y divide-border/60"
              >
                {filtered.map((s, i) => {
                  const Icon = serviceIcons[s.icon] ?? BookOpen;
                  return (
                    <motion.article
                      layout
                      key={s.key}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                      className="group relative"
                    >
                      <a href="#contact" aria-label={`${t.discuss}: ${s.title}`} className="absolute inset-0 z-10" />
                      <div className="grid grid-cols-[auto_1fr] items-start gap-x-5 py-6 transition-colors duration-300 group-hover:bg-secondary/30 sm:grid-cols-[64px_auto_1fr_auto] sm:items-center sm:gap-x-6 sm:px-4 sm:rounded-xl">
                        <span
                          className="select-none text-3xl font-black leading-none tracking-tight text-primary/15 transition-colors duration-300 group-hover:text-gold/50 md:text-4xl"
                          aria-hidden="true"
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Icon
                          className="mt-1.5 hidden h-5 w-5 text-primary/60 transition-colors duration-300 group-hover:text-primary sm:block"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <h3 className="text-lg font-extrabold text-foreground transition-colors duration-300 group-hover:text-primary md:text-xl">
                            {s.title}
                          </h3>
                          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{s.desc}</p>
                        </div>
                        <span className="hidden items-center gap-2 text-sm font-bold text-muted-foreground/60 transition-all duration-300 group-hover:text-gold-2 sm:inline-flex">
                          {t.discuss}
                          <ExtArrow className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                        </span>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
