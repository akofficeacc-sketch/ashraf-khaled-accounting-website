"use client";

import * as React from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowUp, Calculator, Clock3, Mail, MapPin, Menu, MessageCircle, Moon, Phone, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { CONTACT } from "@/lib/site-content";
import { useLang } from "./lang-provider";
import { Logo, LogoMark } from "./logo";
import { btnGold, btnPrimary } from "./primitives";

/* ---------------------------------- topbar ---------------------------------- */

function LocalTime({ className }: { className?: string }) {
  const { lang } = useLang();
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!now) return null;

  const hour = now.getHours();
  const greeting =
    lang === "ar"
      ? hour < 12
        ? "صباح الخير"
        : hour < 18
          ? "مساء الخير"
          : "مساء النور"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";
  const time = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  return (
    <time
      dateTime={now.toISOString()}
      className={cn(
        "items-center gap-1.5 whitespace-nowrap text-cream/65",
        className ?? "hidden xl:inline-flex"
      )}
      aria-label={`${greeting} — ${time}`}
    >
      <Clock3 className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
      <span>{greeting}</span>
      <span className="text-cream/35" aria-hidden="true">•</span>
      <span dir="ltr">{time}</span>
    </time>
  );
}

export function Topbar() {
  const { lang } = useLang();
  const c = CONTACT;
  return (
    <div className="hidden border-b-2 border-gold/85 bg-deep-2 text-cream/75 md:block">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 text-xs sm:px-6">
        <div className="flex items-center gap-5">
          <a
            href={`mailto:${c.email}`}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-gold"
            dir="ltr"
          >
            <Mail className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            {c.email}
          </a>
          <span className="hidden h-3 w-px bg-cream/15 lg:block" aria-hidden="true" />
          <a
            href={`tel:${c.ashraf.tel}`}
            className="hidden items-center gap-1.5 transition-colors hover:text-gold lg:inline-flex"
            dir="ltr"
          >
            <Phone className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            {c.ashraf.display}
          </a>
          <a
            href={`tel:${c.khaled.tel}`}
            className="hidden items-center gap-1.5 transition-colors hover:text-gold lg:inline-flex"
            dir="ltr"
          >
            <Phone className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            {c.khaled.display}
          </a>
        </div>
        <div className="flex items-center gap-5">
          <LocalTime />
          <a
          href={c.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={lang === "ar" ? "افتح الموقع على خرائط جوجل" : "Open on Google Maps"}
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-gold"
        >
          <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            {lang === "ar" ? c.addressShortAr : c.addressShortEn}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- header ---------------------------------- */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { lang } = useLang();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
      aria-label={isDark ? (lang === "ar" ? "الوضع الفاتح" : "Light mode") : lang === "ar" ? "الوضع الداكن" : "Dark mode"}
      title={isDark ? (lang === "ar" ? "الوضع الفاتح" : "Light mode") : lang === "ar" ? "الوضع الداكن" : "Dark mode"}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
    </button>
  );
}

function LangToggle() {
  const { lang, toggle } = useLang();
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-10 min-w-10 items-center justify-center rounded-[4px] border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      aria-label={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      title={lang === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {lang === "ar" ? "EN" : "عربي"}
    </button>
  );
}

export function Header() {
  const { lang } = useLang();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "#services", label: lang === "ar" ? "الخدمات" : "Services" },
    { href: "#why", label: lang === "ar" ? "لماذا نحن" : "Why Us" },
    { href: "#about", label: lang === "ar" ? "عن الشركة" : "About" },
    { href: "#contact", label: lang === "ar" ? "تواصل معنا" : "Contact" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-[#ecf5ef] shadow-[0_10px_26px_-16px_rgba(194,145,19,0.62)] dark:bg-background"
          : "border-b border-transparent bg-[#f1f7f4] dark:bg-background"
      )}
    >
      {/* scroll progress */}
      <motion.span
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left bg-primary rtl:origin-right"
        style={{ scaleX: progress }}
        aria-hidden="true"
      />
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />

        <nav
          aria-label={lang === "ar" ? "الشركة" : "Company"}
          className={cn(
            "hidden items-center gap-7 rounded-full border border-border/70 bg-card/75 px-5 py-2 shadow-sm backdrop-blur-sm transition-all duration-300 lg:flex dark:border-white/10 dark:bg-white/[0.06]",
          )}
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
              {/* editorial underline — gold hairline slides in */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-center scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <LangToggle />
          <a href="#contact" className={cn(btnGold, "hidden px-5 py-2.5 md:inline-flex")}>
            {lang === "ar" ? "تحدث مع مستشار" : "Talk to a Consultant"}
          </a>
          <button
            type="button"
            className="inline-flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full text-foreground transition-colors hover:bg-secondary lg:hidden"
            aria-label={lang === "ar" ? "القائمة" : "Menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{lang === "ar" ? "القائمة" : "Menu"}</span>
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <>
                <i className="block h-[2px] w-5 rounded-full bg-current" />
                <i className="block h-[2px] w-5 rounded-full bg-current" />
                <i className="block h-[2px] w-5 rounded-full bg-current" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border bg-background lg:hidden"
          >
            <nav aria-label={lang === "ar" ? "الشركة" : "Company"} className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
              {links.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 rounded-md px-4 py-3 text-base font-bold text-foreground transition-colors hover:bg-secondary"
                >
                  <span className="font-mono text-[11px] font-medium tabular-nums text-muted-foreground" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {l.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className={cn(btnPrimary, "mt-2 w-full")}
              >
                {lang === "ar" ? "تحدث مع مستشار" : "Talk to a Consultant"}
              </a>
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
                <LocalTime className="flex w-full justify-center rounded-md bg-secondary/60 px-4 py-3 text-sm font-bold text-foreground" />
                <a
                  href={`tel:${CONTACT.ashraf.tel}`}
                  className="flex items-center justify-between rounded-md bg-secondary/60 px-4 py-3 text-sm font-bold"
                >
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "أشرف منسي" : "Ashraf Mansy"}
                  </span>
                  <span dir="ltr" className="inline-flex items-center gap-1.5 text-primary">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {CONTACT.ashraf.display}
                  </span>
                </a>
                <a
                  href={`tel:${CONTACT.khaled.tel}`}
                  className="flex items-center justify-between rounded-md bg-secondary/60 px-4 py-3 text-sm font-bold"
                >
                  <span className="text-muted-foreground">
                    {lang === "ar" ? "خالد الصادق" : "Khaled El-Sadek"}
                  </span>
                  <span dir="ltr" className="inline-flex items-center gap-1.5 text-primary">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {CONTACT.khaled.display}
                  </span>
                </a>
                <a
                  href={`mailto:${CONTACT.email}`}
                  dir="ltr"
                  className="flex items-center gap-2 rounded-md px-4 py-3 text-sm font-bold text-primary"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {CONTACT.email}
                </a>
                <a
                  href={CONTACT.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md bg-secondary/60 px-4 py-3 text-sm font-bold"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-gold-2" aria-hidden="true" />
                  <span>{lang === "ar" ? CONTACT.addressShortAr : CONTACT.addressShortEn}</span>
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ---------------------------------- footer ---------------------------------- */

export function Footer() {
  const { lang } = useLang();
  const year = new Date().getFullYear();

  const links = [
    { href: "#services", label: lang === "ar" ? "الخدمات" : "Services" },
    { href: "#why", label: lang === "ar" ? "لماذا نحن" : "Why Us" },
    { href: "#tools", label: lang === "ar" ? "حاسبة الضرائب" : "Tax Calculator" },
    { href: "#about", label: lang === "ar" ? "عن الشركة" : "About" },
    { href: "#faq", label: lang === "ar" ? "الأسئلة الشائعة" : "FAQ" },
    { href: "#insights", label: lang === "ar" ? "مقالات" : "Insights" },
  ];

  const services =
    lang === "ar"
      ? ["المحاسبة ومسك الدفاتر", "ضريبة القيمة المضافة", "الإقرارات الضريبية", "تأسيس الشركات", "الرواتب وكشوف الأجور"]
      : ["Accounting & Bookkeeping", "VAT", "Tax Returns", "Company Setup", "Payroll"];

  return (
    <footer className="mt-auto bg-deep-2 text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-14 w-14" />
            <span className="flex flex-col leading-tight">
              <span className="text-[10.5px] font-semibold text-cream/60">
                {lang === "ar" ? "مكتب محاسبة" : "Accounting Office"}
              </span>
              <span className="text-[15px] font-extrabold text-cream">
                {lang === "ar" ? "أشرف منسي وخالد الصادق" : "Ashraf & Khaled"}
              </span>
            </span>
          </div>
          <p className="max-w-xs text-sm leading-7 text-cream/60">
            {lang === "ar"
              ? "محاسبة وضرائب ومسك دفاتر وتأسيس شركات — وضوح في أرقامك وثقة في كل خطوة."
              : "Accounting, tax, bookkeeping and company setup — clarity in your numbers, confidence in every step."}
          </p>
          <a
            href={`mailto:${CONTACT.email}`}
            dir="ltr"
            className="inline-flex items-center gap-2 text-sm font-bold text-gold transition-opacity hover:opacity-80"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {CONTACT.email}
          </a>
        </div>

        <nav aria-label={lang === "ar" ? "روابط سريعة" : "Quick links"}>
          <h3 className="mb-4 text-sm font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-[#cbd3da]">
            {lang === "ar" ? "روابط سريعة" : "Quick Links"}
          </h3>
          <ul className="space-y-2.5">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-sm text-cream/75 transition-colors hover:text-gold">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="mb-4 text-sm font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-[#cbd3da]">
            {lang === "ar" ? "أبرز الخدمات" : "Top Services"}
          </h3>
          <ul className="space-y-2.5">
            {services.map((s) => (
              <li key={s}>
                <a href="#services" className="text-sm text-cream/75 transition-colors hover:text-gold">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-[#cbd3da]">
            {lang === "ar" ? "تواصل معنا" : "Contact Us"}
          </h3>
          <ul className="space-y-3 text-sm">
            {[
              {
                name: lang === "ar" ? "أشرف منسي" : "Ashraf Mansy",
                phone: CONTACT.ashraf.display,
                tel: CONTACT.ashraf.tel,
                wa: CONTACT.ashraf.whatsapp,
              },
              {
                name: lang === "ar" ? "خالد الصادق" : "Khaled El-Sadek",
                phone: CONTACT.khaled.display,
                tel: CONTACT.khaled.tel,
                wa: CONTACT.khaled.whatsapp,
              },
            ].map((p) => (
              <li key={p.tel} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="w-24 shrink-0 font-bold text-cream/60">{p.name}</span>
                <a
                  href={`tel:${p.tel}`}
                  dir="ltr"
                  className="font-bold text-cream transition-colors hover:text-gold"
                >
                  {p.phone}
                </a>
                <a
                  href={p.wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-cream/20 text-cream/70 transition-colors hover:border-gold/60 hover:text-gold"
                  aria-label={`${p.name} — ${lang === "ar" ? "واتساب" : "WhatsApp"}`}
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
            <li className="flex items-start gap-2 pt-1 text-cream/60">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <a
                href={CONTACT.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm leading-6 transition-colors hover:text-gold"
              >
                <span className="block">
                  {lang === "ar" ? CONTACT.addressAr : CONTACT.addressEn}
                </span>
                <span className="mt-0.5 block text-xs text-cream/50">
                  {lang === "ar" ? CONTACT.addressAr2 : CONTACT.addressEn2}
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10 relative">
        <span className="rule-gold absolute inset-x-0 top-0 opacity-60" aria-hidden="true" />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-center text-xs text-cream/50 sm:flex-row sm:px-6 sm:text-start">
          <p>
            © {year} {lang === "ar" ? "مكتب محاسبة أشرف منسي وخالد الصادق" : "Ashraf & Khaled Accounting Office"} —{" "}
            {lang === "ar" ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </p>
          <a
            href={CONTACT.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-gold"
          >
            <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            {lang === "ar" ? "مصطفى كامل، الإسكندرية" : "Mustafa Kamel, Alexandria"}
          </a>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------- Back to Top ------------------------------- */

export function BackToTop() {
  const { lang } = useLang();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          aria-label={lang === "ar" ? "العودة للأعلى" : "Back to top"}
          title={lang === "ar" ? "العودة للأعلى" : "Back to top"}
          className="fixed bottom-6 start-6 z-40 flex h-11 w-11 items-center justify-center rounded-[6px] border border-border bg-card text-foreground transition-colors hover:border-foreground focus-visible:outline-2 focus-visible:outline-ring active:translate-y-px"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------- Sticky CTA Dock --------------------------- */

export function StickyCta() {
  const { lang } = useLang();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {scrolled && (
        <motion.aside
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          aria-label={lang === "ar" ? "إجراءات سريعة" : "Quick actions"}
          className="fixed bottom-5 end-5 z-40 flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 shadow-[0_16px_40px_-16px_rgba(15,17,21,0.35)]"
        >
          <a
            href={CONTACT.ashraf.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            title={lang === "ar" ? "محادثة واتساب فورية" : "WhatsApp Consultation"}
            className="flex items-center gap-2 rounded-full bg-[#128c7e] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#0f7a6e]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{lang === "ar" ? "استشارة واتساب" : "WhatsApp Chat"}</span>
          </a>

          <a
            href="#tools"
            title={lang === "ar" ? "حاسبات الضرائب" : "Tax Calculator"}
            className="hidden md:flex items-center gap-1.5 rounded-full bg-secondary/80 px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
          >
            <Calculator className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            <span>{lang === "ar" ? "حاسبة الضرائب" : "Calculators"}</span>
          </a>

          <a
            href="#contact"
            className="flex items-center gap-1.5 rounded-full bg-gold-metallic px-4 py-2.5 text-xs font-bold text-on-gold transition-[filter] hover:brightness-105 active:translate-y-px"
          >
            <span>{lang === "ar" ? "احجز موعد" : "Book Now"}</span>
          </a>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
