"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Clock, FileCheck2, Lock, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { content } from "@/lib/site-content";
import { useLang } from "./lang-provider";
import { DirArrow, ExtArrow, Eyebrow, Reveal, btnPrimary } from "./primitives";
import { LogoMark } from "./logo";

const trustIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  badge: BadgeCheck,
  lock: Lock,
  invoice: FileCheck2,
  clock: Clock,
  chat: MessageCircle,
};

function Ring({ pct }: { pct: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="5"
          strokeLinecap="butt"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold tabular-nums text-foreground">
        {pct}%
      </span>
    </div>
  );
}

export function Hero() {
  const { lang } = useLang();
  const t = content[lang];
  const d = t.hero.dashboard;
  const titleWords = t.hero.title.split(" ");
  const titleLead = titleWords.slice(0, -1).join(" ");
  const titleAccent = titleWords[titleWords.length - 1] ?? "";
  const [arabicLead, arabicSecond = ""] = lang === "ar" ? t.hero.title.split("، ") : ["", ""];
  const arabicSecondWords = arabicSecond.split(" ");
  const arabicSecondLead = arabicSecondWords.slice(0, -1).join(" ");
  const arabicSecondAccent = arabicSecondWords[arabicSecondWords.length - 1] ?? "";

  return (
    <section id="top" className="hero-shell relative pt-8 pb-16 lg:pt-14 lg:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-start gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-20">
          {/* Left column — headline & CTAs */}
          <div className="max-w-xl">
            <Reveal>
              <Eyebrow>{t.hero.eyebrow}</Eyebrow>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[1.18] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                {lang === "ar" ? (
                  <>
                    <span className="hero-arabic-title block">{arabicLead}،</span>
                    <span className="hero-arabic-title relative top-[2px] block">
                      {arabicSecondLead}{" "}
                      <span className="relative text-gold-metallic rtl:left-1">{arabicSecondAccent}</span>
                    </span>
                  </>
                ) : (
                  <>
                    {titleLead} <span className="relative text-gold-metallic">{titleAccent}</span>
                  </>
                )}
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-6 max-w-lg text-[15px] leading-8 text-muted-foreground sm:text-base sm:leading-9">{t.hero.lead}</p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#contact" className={btnPrimary}>
                  {t.hero.ctaPrimary}
                  <ExtArrow />
                </a>
                <a
                  href="#tools"
                  className="group inline-flex items-center justify-center gap-2 rounded-[4px] border border-border px-5 py-2.5 text-[13.5px] font-semibold text-foreground transition-colors duration-200 hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px"
                >
                  {t.hero.ctaSecondary}
                  <DirArrow className="transition-transform duration-200 group-hover:-translate-x-0.5 rtl:group-hover:-translate-x-0.5 ltr:group-hover:translate-x-0.5" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <div className="mt-8 flex flex-wrap gap-2">
                {t.hero.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-[4px] border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right column — client statement panel */}
          <Reveal variant="scale" delay={0.15} className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative overflow-hidden rounded-[8px] border border-border/70 border-t-2 border-t-gold bg-[#f4f8f6] shadow-[0_22px_55px_-28px_rgba(11,74,56,0.5)] dark:border-white/10 dark:border-t-gold/80 dark:bg-[#145b46]/75 dark:shadow-[0_24px_70px_-28px_rgba(0,0,0,0.72)] dark:backdrop-blur-sm">
              {/* Panel header */}
              <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-5">
                <div className="flex items-center gap-3">
                  <LogoMark className="h-14 w-14" />
                  <div className="leading-tight">
                    <span className="block text-[10px] font-medium ltr:uppercase ltr:tracking-[0.18em] rtl:tracking-normal text-muted-foreground">{d.brand}</span>
                    <strong className="mt-0.5 block text-[15px] font-bold tracking-tight text-foreground">{d.brandSub}</strong>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-[4px] border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  {d.live}
                </span>
              </div>

              {/* Filing status row */}
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border px-6 py-5">
                <span className="grid h-11 w-11 place-items-center rounded-[6px] border border-border text-primary">
                  <FileCheck2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="leading-tight">
                  <span className="block text-xs font-medium text-muted-foreground">{d.statusLabel}</span>
                  <strong className="mt-0.5 block text-sm font-bold text-foreground">{d.statusValue}</strong>
                </div>
                <span className="rounded-[4px] border border-primary/30 px-2.5 py-1 font-mono text-[11px] font-semibold tabular-nums text-primary">
                  {d.ready}
                </span>
              </div>

              {/* Progress row */}
              <div className="flex items-center justify-between gap-6 border-b border-border px-6 py-5">
                <div>
                  <span className="block text-xs font-medium text-muted-foreground">{d.progressLabel}</span>
                  <strong className="mt-0.5 block text-base font-bold tracking-tight text-foreground">{d.progressValue}</strong>
                  <span className="mt-1 block text-[11px] font-medium text-muted-foreground">
                    <span className="text-primary" aria-hidden="true">●</span>{" "}
                    {lang === "ar" ? "100% متوافق مع منظومة الضرائب" : "100% compliant with the ETA system"}
                  </span>
                </div>
                <Ring pct={d.progressPct} />
              </div>

              {/* Stepper */}
              <div className="border-b border-border px-6 py-5">
                <div className="flex items-start justify-between gap-2">
                  {d.steps.map((step, i) => (
                    <React.Fragment key={step}>
                      <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                        <span className="grid h-7 w-7 place-items-center rounded-[4px] border border-border bg-secondary font-mono text-[11px] font-semibold tabular-nums text-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-[10px] font-medium leading-tight text-muted-foreground">{step}</p>
                      </div>
                      {i < d.steps.length - 1 && <div className="mb-4 h-px flex-1 bg-border" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Footer strip (formerly floating pills) */}
              <div className="flex divide-x divide-border rtl:divide-x-reverse">
                <div className="flex flex-1 items-start gap-2.5 px-6 py-4">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                  <div className="leading-tight">
                    <strong className="block text-xs font-bold text-foreground">{d.floatTopTitle}</strong>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">{d.floatTopSub}</span>
                  </div>
                </div>
                <div className="flex flex-1 items-start gap-2.5 px-6 py-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                  <div className="leading-tight">
                    <strong className="block text-xs font-bold text-foreground">{d.floatBottomTitle}</strong>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">{d.floatBottomSub}</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Metrics band — bank-statement numerals between hairlines */}
        <div className="mt-16 grid grid-cols-2 gap-y-8 border-y border-border py-9 sm:gap-6 lg:grid-cols-4">
          {t.metrics.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.06} className="text-center lg:text-start">
              <strong className="block font-mono text-3xl font-semibold tracking-tight tabular-nums text-foreground sm:text-4xl">
                {m.value}
              </strong>
              <span className="mt-1.5 block text-xs font-medium text-muted-foreground sm:text-sm">{m.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Trustbar() {
  const { lang } = useLang();
  const t = content[lang];
  return (
    <section
      aria-label={lang === "ar" ? "موثوق وممتثل" : "Trusted & compliant"}
      className="border-b border-border/80 bg-card py-6 shadow-[0_9px_22px_-14px_rgba(200,147,14,0.65)] dark:shadow-[0_10px_24px_-14px_rgba(224,178,63,0.65)]"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 sm:px-6 lg:justify-between">
        {t.trust.map((item) => {
          const Icon = trustIcons[item.icon] ?? BadgeCheck;
          return (
            <div key={item.text} className="flex items-center gap-2.5">
              <Icon className="h-[17px] w-[17px] text-primary" aria-hidden="true" />
              <span className="text-[13px] font-semibold text-foreground/85">{item.text}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
