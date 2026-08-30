"use client";

import { content } from "@/lib/site-content";
import { useLang } from "./lang-provider";
import { Eyebrow, Reveal, SectionHead } from "./primitives";
import { LogoMark } from "./logo";
import { Calculator, Layers3, MapPin } from "lucide-react";

const cardStatIcons = {
  map: MapPin,
  layers: Layers3,
  calculator: Calculator,
} as const;

export function Why() {
  const { lang } = useLang();
  const t = content[lang].why;
  const bars = [46, 78, 58, 92, 66, 84, 40, 72, 55];

  return (
    <section id="why" className="scroll-mt-24 bg-muted/50 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <Reveal variant="left">
          <div className="relative isolate overflow-hidden rounded-lg bg-deep-2 p-8 text-cream sm:p-10">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
            />
            <p className="relative z-10 text-sm font-bold text-cream/75">{t.cardLocation}</p>

            <div className="relative z-10 mt-8 flex h-44 items-end justify-center gap-2.5 sm:h-52 sm:gap-3" aria-hidden="true">
              {bars.map((h, i) => {
                const emph = i % 3 === 0;
                return (
                  <span key={i} className="relative flex h-full w-full max-w-[28px] items-end sm:max-w-[30px]">
                    {/* Track — full column height, faint cream */}
                    <span className="absolute inset-0 rounded-t-[4px] bg-cream/[0.06]" />
                    {/* Fill — gold gradient rising to the cap, staggered rise-in */}
                    <span
                      className="bar-rise relative flex w-full flex-col"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.12}s` }}
                    >
                      <span
                        className={
                          "block h-1.5 w-full rounded-t-[4px] bg-gold-metallic " +
                          (emph ? "shadow-[0_0_16px_rgba(200,147,14,0.5)]" : "opacity-70")
                        }
                      />
                      <span
                        className={
                          "w-full flex-1 " +
                          (emph
                            ? "bg-gradient-to-b from-gold/45 via-gold/15 to-transparent"
                            : "bg-gradient-to-b from-gold/20 via-gold/[0.07] to-transparent")
                        }
                      />
                    </span>
                  </span>
                );
              })}
              {/* Baseline hairline */}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-cream/15" />
            </div>

            <div className="absolute left-1/2 top-[53%] z-10 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_7px_14px_rgba(4,22,15,0.28)]">
              <span className="why-card-ring why-card-ring-outer" aria-hidden="true" />
              <span className="why-card-ring why-card-ring-middle" aria-hidden="true" />
              <span className="why-card-ring why-card-ring-inner" aria-hidden="true" />
              <LogoMark className="h-28 w-28 [&_img]:brightness-[1.03] [&_img]:saturate-[0.78] [&_img]:contrast-[1.06]" />
            </div>

            <div className="relative z-10 mt-8 grid grid-cols-3 overflow-hidden rounded-md border border-gold/25 bg-deep/[0.28]" aria-label={lang === "ar" ? "إحصائيات المكتب" : "Office statistics"}>
              {t.cardStats.map((stat, i) => {
                const Icon = cardStatIcons[stat.icon];
                return (
                  <div
                    key={stat.label}
                    className="why-card-stat group relative flex min-h-[116px] flex-col items-center justify-center px-2 py-4 text-center first:border-s-0"
                    style={{ "--stat-delay": `${i * 0.14}s` } as React.CSSProperties}
                  >
                    <Icon className="mb-2 h-5 w-5 text-gold transition-transform duration-300 group-hover:-translate-y-0.5" strokeWidth={1.8} aria-hidden="true" />
                    <strong className="why-card-stat-value text-2xl font-black leading-none text-gold-metallic">{stat.value}</strong>
                    <span className="mt-2 max-w-[9rem] text-[10px] font-bold leading-4 text-cream/70 sm:text-[11px] sm:leading-5">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal variant="right">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h2 className="mt-4 text-3xl font-black leading-[1.25] tracking-tight text-foreground md:text-4xl">
              {t.title}
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-8 text-muted-foreground">{t.copy}</p>
          </Reveal>

          <div className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {t.benefits.map((b, i) => (
              <Reveal key={b.n} variant="right" delay={0.08 + i * 0.07}>
                <div className="group relative ps-5">
                  <span
                    className="absolute inset-y-0 start-0 w-[2px] bg-gold/60 transition-colors duration-300 group-hover:bg-gold"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-black tracking-widest text-gold-metallic">{b.n}</span>
                  <h3 className="mt-1.5 text-base font-extrabold text-foreground">{b.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Process() {
  const { lang } = useLang();
  const t = content[lang].process;

  return (
    <section className="py-20 lg:py-24" aria-label={t.title}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead align="center" eyebrow={t.eyebrow} title={t.title} />

        <div className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div className="absolute inset-x-16 top-7 hidden border-t-2 border-dashed border-border lg:block" aria-hidden="true" />
          {t.steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1} className="relative text-center lg:text-start">
              <span className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-deep font-mono text-lg font-semibold tabular-nums text-gold-metallic lg:mx-0">
                {s.n}
                {i < t.steps.length - 1 && (
                  <i
                    className="absolute top-1/2 hidden h-3 w-3 -translate-y-1/2 rounded-[3px] border border-border bg-background end-[-34px] lg:block"
                    aria-hidden="true"
                  />
                )}
              </span>
              <h3 className="mt-5 text-lg font-extrabold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Journey() {
  const { lang } = useLang();
  const t = content[lang].journey;

  return (
    <section className="bg-muted/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead align="center" eyebrow={t.eyebrow} title={t.title} sub={t.sub} />

        <div className="relative mx-auto mt-14 max-w-3xl">
          <span
            className="absolute inset-y-2 start-[27px] w-px bg-border sm:left-1/2 sm:-translate-x-1/2"
            aria-hidden="true"
          />
          <ol className="space-y-10">
            {t.milestones.map((m, i) => (
              <li key={m.tag}>
                <Reveal variant={i % 2 === 0 ? "right" : "left"} delay={0.05}>
                  <div
                    className={
                      "relative flex items-start gap-5 sm:w-1/2 " +
                      (i % 2 === 0 ? "sm:ms-auto sm:ps-12" : "sm:me-auto sm:flex-row-reverse sm:pe-12 sm:text-end")
                    }
                  >
                    <span
                      className={
                        "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-md border-2 border-background bg-deep font-mono text-base font-semibold tabular-nums text-gold-metallic sm:absolute sm:top-0 sm:-mt-1 " +
                        (i % 2 === 0 ? "sm:start-[-28px]" : "sm:end-[-28px]")
                      }
                    >
                      {i + 1}
                    </span>
                    <div className="transition-colors duration-300 hover:bg-secondary/40 sm:p-2">
                      <span className="text-[11px] font-black tracking-widest text-gold-metallic">{m.tag}</span>
                      <h3 className="mt-1.5 text-base font-extrabold text-foreground">{m.title}</h3>
                      <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{m.desc}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
