"use client";

import * as React from "react";
import { BadgePercent, Clock3 } from "lucide-react";
import { content } from "@/lib/site-content";
import { useLang } from "./lang-provider";
import { EtaPanel } from "./eta-panel";
import { Eyebrow, Reveal, btnGold } from "./primitives";

/**
 * Dedicated, SEO-rich section for Egyptian Tax Authority (ETA) news & laws.
 *
 * Why a full section (not a hidden tab):
 * - Static, indexable Arabic/English copy loaded with real search queries
 *   (أخبار مصلحة الضرائب المصرية، مستجدات الضرائب في مصر، القوانين الضريبية…)
 * - Semantic headings (<h2>/<h3>), descriptive outbound links to eta.gov.eg
 * - The live news list complements the static copy for freshness.
 * - Includes a small offer advertisement for the office's free consultation.
 */
export function EtaSection() {
  const { lang } = useLang();
  const t = content[lang].etaSection;

  return (
    <section
      id="eta-news"
      aria-labelledby="eta-news-heading"
      className="relative scroll-mt-24 overflow-hidden border-y border-primary/10 bg-secondary/30 py-20 lg:py-28"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* section head */}
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>{t.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              id="eta-news-heading"
              className="mt-4 text-balance text-3xl font-black leading-[1.3] tracking-tight md:text-4xl"
            >
              {t.title}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-5 text-[15px] leading-8 text-muted-foreground">{t.sub}</p>
          </Reveal>
        </div>

        {/* SEO copy blocks */}
        <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-2">
          <Reveal delay={0.1}>
            <p className="h-full border-t border-border pt-5 text-[13.5px] leading-7 text-foreground/75">
              {t.seoCopy1}
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <p className="h-full border-t-2 border-gold/50 pt-5 text-[13.5px] leading-7 text-foreground/75">
              {t.seoCopy2}
            </p>
          </Reveal>
        </div>

        {/* live ETA panel (news + laws) */}
        <Reveal delay={0.12} className="mt-8">
          <EtaPanel className="mx-auto max-w-5xl" />
        </Reveal>

        {/* offer advertisement */}
        <Reveal delay={0.1} className="mt-8">
           <aside
             aria-label={t.offerTitle}
             className="relative mx-auto max-w-5xl border-t-2 border-gold/50 pt-6 sm:pt-8"
           >
            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] border border-gold/30 text-gold">
                  <BadgePercent className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black ltr:tracking-wider rtl:tracking-normal text-gold-metallic">
                    <Clock3 className="h-3 w-3" aria-hidden="true" />
                    {t.offerBadge}
                  </span>
                  <h3 className="mt-2 text-xl font-black text-foreground">{t.offerTitle}</h3>
                  <p className="mt-1 max-w-xl text-[13.5px] leading-7 text-muted-foreground">{t.offerCopy}</p>
                </div>
              </div>
              <a href="#contact" className={btnGold + " shrink-0"}>
                {t.offerCta}
              </a>
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
