"use client";

import { BookOpen, Building2, FileText, Percent, Receipt, Star, TrendingUp, Wallet } from "lucide-react";
import { content } from "@/lib/site-content";
import { useLang } from "./lang-provider";
import { DirArrow, Reveal, SectionHead } from "./primitives";

const insightIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  percent: Percent,
  file: FileText,
  building: Building2,
  invoice: Receipt,
  wallet: Wallet,
  trending: TrendingUp,
};

export function Testimonials() {
  const { lang } = useLang();
  const t = content[lang].testimonials;

  return (
    <section id="testimonials" className="scroll-mt-24 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow={t.eyebrow} title={t.title} sub={t.sub} />

        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {t.items.map((item, i) => (
            <Reveal key={item.name} variant="up" delay={i * 0.08}>
              <figure className="flex h-full flex-col border-t-2 border-foreground/85 pt-5">
                <div className="flex gap-1 text-gold" role="img" aria-label="5 / 5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-gold" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-8 text-foreground/85">“{item.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-xs font-semibold tabular-nums text-accent-foreground">
                    {item.initials}
                  </span>
                  <div className="leading-tight">
                    <strong className="block text-sm font-extrabold text-foreground">{item.name}</strong>
                    <small className="mt-0.5 block text-xs text-muted-foreground">{item.role}</small>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Insights() {
  const { lang } = useLang();
  const t = content[lang].insights;

  return (
    <section id="insights" className="scroll-mt-24 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead eyebrow={t.eyebrow} title={t.title} sub={t.sub} />

        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((item, i) => {
            const Icon = insightIcons[item.icon] ?? FileText;
            return (
              <Reveal key={item.title} variant="up" delay={(i % 3) * 0.08}>
                <article className="group flex h-full flex-col border-t border-border pt-6 transition-colors duration-300 hover:border-gold/50">
                  <span className="grid h-11 w-11 place-items-center rounded-[6px] border border-border bg-card text-gold-2 transition-colors duration-300 group-hover:border-gold/50">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <span className="mt-4 w-fit text-[11px] font-semibold ltr:uppercase ltr:tracking-widest rtl:tracking-normal text-muted-foreground">
                    {item.cat}
                  </span>
                  <h3 className="mt-1.5 text-base font-extrabold leading-7 text-foreground transition-colors duration-300 group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-7 text-muted-foreground">{item.desc}</p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{item.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.read}</span>
                    </div>
                    <a
                      href="#contact"
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary transition-colors hover:text-gold-2"
                    >
                      {t.readMore}
                      <DirArrow className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
