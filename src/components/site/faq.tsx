"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { content } from "@/lib/site-content";
import { useLang } from "./lang-provider";
import { DirArrow, Eyebrow, Reveal } from "./primitives";

export function Faq() {
  const { lang } = useLang();
  const t = content[lang].faq;
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return t.items;
    return t.items.filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        (lang === "ar" && (item.q.includes(query.trim()) || item.a.includes(query.trim())))
    );
  }, [query, t.items, lang]);

  return (
    <section id="faq" className="scroll-mt-24 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <Reveal>
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl font-black leading-[1.25] tracking-tight text-foreground md:text-4xl">
              {t.title}
            </h2>
            <a
              href="#contact"
              className="group mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-gold-2"
            >
              {t.contactLink}
              <DirArrow className="transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
            </a>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative mt-8">
              <Search
                className="pointer-events-none absolute inset-y-0 start-4 my-auto h-4 w-4 text-muted-foreground/60"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchLabel}
                className="w-full rounded-md border border-input bg-card py-3 pe-4 ps-11 text-sm font-medium text-foreground shadow-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none focus:ring-0"
              />
            </div>
          </Reveal>
        </div>

        <div>
          {filtered.length === 0 ? (
            <p className="rounded-2xl bg-muted/50 p-6 text-center text-sm leading-7 text-muted-foreground">
              {t.noResults}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((item) => (
                <details key={item.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-extrabold text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                    <span className="text-[15px] leading-7">{item.q}</span>
                    <span className="shrink-0 text-muted-foreground transition-all duration-300 group-open:rotate-180 group-open:text-primary">
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </summary>
                  <div className="pb-6">
                    <p className="max-w-2xl text-sm leading-8 text-muted-foreground">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
