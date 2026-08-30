"use client";

import { MessageCircle, Phone } from "lucide-react";
import { content } from "@/lib/site-content";
import { useLang } from "./lang-provider";
import { Eyebrow, ExtArrow, Reveal, btnWhite } from "./primitives";
import { LogoMark } from "./logo";

export function About() {
  const { lang } = useLang();
  const t = content[lang].about;

  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden bg-deep py-20 text-cream lg:py-28">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal variant="right">
            <div>
              <Eyebrow light>{t.eyebrow}</Eyebrow>
              <h2 className="mt-5 text-3xl font-black leading-[1.25] tracking-tight md:text-4xl">{t.title}</h2>
              <p className="mt-5 max-w-lg text-[15px] leading-8 text-cream/70">{t.copy}</p>
              <a href="#contact" className={btnWhite + " mt-8"}>
                {t.cta}
                <ExtArrow />
              </a>
            </div>
          </Reveal>

          <Reveal variant="left" delay={0.1}>
             <aside className="border-s-2 border-gold/70 py-1 ps-7 pe-0 sm:ps-9">
              <LogoMark className="h-24 w-24" />
              <h3 className="mt-5 text-xl font-extrabold leading-8 text-cream">{t.asideTitle}</h3>
              <p className="mt-3 text-sm leading-8 text-cream/65">{t.asideCopy}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {t.chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-[4px] border border-white/10 px-3.5 py-1.5 text-[11px] font-medium text-cream/60"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </aside>
          </Reveal>
        </div>

        <div className="mt-24">
          <Reveal>
            <div className="text-center">
              <Eyebrow light>{t.teamEyebrow}</Eyebrow>
              <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">{t.teamTitle}</h2>
            </div>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
            {t.members.map((m, i) => (
              <Reveal key={m.tel} variant="scale" delay={i * 0.12}>
                 <article className="group flex h-full flex-col items-center border-t-2 border-[#b98214]/85 pb-2 pt-7 text-center sm:pt-8">
                  <h3 className="text-xl font-black text-cream">{m.name}</h3>
                  <p className="mt-1 text-sm font-bold text-gold">{m.role}</p>
                  <p className="mt-2 text-xs leading-6 text-cream/60">{m.spec}</p>

                  <div className="mt-6 flex w-full flex-col gap-2.5">
                    <a
                      href={`tel:${m.tel}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] bg-cream px-5 py-3 text-sm font-semibold text-deep-2 transition-colors hover:bg-white"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      <span dir="ltr">{m.phone}</span>
                    </a>
                    <a
                      href={m.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[4px] border border-cream/25 px-5 py-3 text-sm font-semibold text-cream transition-colors hover:border-gold/60 hover:text-gold"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      {m.whatsappLabel}
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
