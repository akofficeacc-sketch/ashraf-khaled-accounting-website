"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgePercent, Clock3, MessageCircle, X } from "lucide-react";
import { CONTACT, content } from "@/lib/site-content";
import { useLang } from "./lang-provider";

/**
 * Shy-but-noticeable side offer popup.
 *
 * Behaviour (per owner's request):
 * - Anchored to the bottom corner of the viewport — never blocks the content.
 * - Appears shortly after page load.
 * - When closed (X) it RE-APPEARS every 10 seconds — persistent by design.
 * - Politely stays hidden while the contact section is on screen (the offer
 *   CTA scrolls there anyway) and pauses on the mobile menu being open.
 * - Smooth slide-up animation, fully bilingual, dismissible via keyboard
 *   (Escape) and screen-reader friendly (role=dialog + aria-live=polite).
 */

/** Delay before the very first appearance. */
const FIRST_SHOW_DELAY_MS = 4_000;
/** Re-show interval after every dismissal. */
const RESHOW_INTERVAL_MS = 10_000;

export function OfferPopup() {
  const { lang } = useLang();
  const t = content[lang].offerPopup;

  const [visible, setVisible] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);
  const contactInViewRef = React.useRef(false);
  const scheduleRef = React.useRef<(delay: number) => void>(() => undefined);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  /**
   * Schedule the next appearance. Kept in a ref so the timeout callback can
   * re-schedule itself without a use-before-declaration error.
   */
  const scheduleShow = React.useCallback((delay: number) => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      // Skip while the contact section is on screen (popup would be redundant).
      if (!contactInViewRef.current) setVisible(true);
      else scheduleRef.current(RESHOW_INTERVAL_MS); // try again later
    }, delay);
  }, []);

  // Keep the self-scheduling ref current (inside an effect, per React 19 rules).
  React.useEffect(() => {
    scheduleRef.current = scheduleShow;
  }, [scheduleShow]);

  // Initial appearance + cleanup.
  React.useEffect(() => {
    scheduleShow(FIRST_SHOW_DELAY_MS);
    return clearTimer;
  }, [scheduleShow]);

  // Track whether the contact section is in view (popup would be redundant).
  React.useEffect(() => {
    const contact = document.getElementById("contact");
    if (!contact || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        contactInViewRef.current = entries.some((e) => e.isIntersecting);
      },
      { threshold: 0.25 },
    );
    observer.observe(contact);
    return () => observer.disconnect();
  }, []);

  const close = React.useCallback(() => {
    setVisible(false);
    // Owner's request: re-appear every 10 seconds even after being closed.
    scheduleShow(RESHOW_INTERVAL_MS);
  }, [scheduleShow]);

  // Escape key closes the popup.
  React.useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, close]);

  const onCtaClick = () => {
    close(); // navigates to #contact and re-arms the 10s cycle
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key="offer-popup"
          role="dialog"
          aria-label={t.a11yLabel}
          aria-live="polite"
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.96 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 end-4 z-[70] w-[calc(100vw-2rem)] max-w-[360px] sm:bottom-6 sm:end-6"
        >
          <div className="relative border-t-2 border-primary bg-white text-[#153b2c] shadow-[0_18px_44px_-22px_rgba(15,17,21,0.25)] dark:bg-[#252b2f] dark:text-[#f2f4f8] dark:shadow-[0_18px_44px_-22px_rgba(0,0,0,0.6)]">
            {/* close — z-10 keeps it above the content row that follows it */}
            <button
              type="button"
              onClick={close}
              aria-label={t.close}
              className="absolute end-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-[4px] text-[#61736a] transition-colors hover:bg-black/5 hover:text-[#153b2c] active:bg-black/10 focus-visible:outline-2 focus-visible:outline-ring before:absolute before:-inset-2 before:content-[''] dark:text-[#a9b8b0] dark:hover:bg-white/10 dark:hover:text-white dark:active:bg-white/15"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="flex items-start gap-3.5 p-4 pe-10 sm:p-5 sm:pe-11">
              <span className="mt-0.5 hidden h-11 w-11 shrink-0 place-items-center rounded-md border border-[#dfcf9e] bg-[#f4e5b8] text-[#825d08] sm:grid dark:border-[#715d2f] dark:bg-[#33290f] dark:text-[#f3d283]">
                <BadgePercent className="h-5 w-5" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#f4e5b8] px-2 py-0.5 text-[10px] font-semibold ltr:tracking-wide rtl:tracking-normal text-[#825d08] dark:bg-[#33290f] dark:text-[#f3d283]">
                  <Clock3 className="h-3 w-3" aria-hidden="true" />
                  {t.badge}
                </span>
                <h3 className="mt-2 text-[15px] font-bold leading-6 text-[#153b2c] dark:text-[#f2f4f8]">
                  {t.title}
                </h3>
                <p className="mt-1 text-[12.5px] leading-6 text-[#5d6a63] dark:text-[#b5c0ba]">{t.copy}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-[#d8dfd5] p-4 pt-3.5 sm:p-5 sm:pt-3.5 dark:border-white/10">
              <a
                href="#contact"
                onClick={onCtaClick}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-[4px] bg-gold-metallic px-4 py-2.5 text-[13px] font-bold text-on-gold transition-[filter] hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px"
              >
                {t.cta}
                <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden="true" />
              </a>
              <a
                href={CONTACT.ashraf.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-[4px] border border-[#c8d2cb] px-4 py-2 text-[12px] font-medium text-[#3d5348] transition-colors hover:border-[#153b2c] hover:text-[#153b2c] dark:border-white/20 dark:text-[#d2dbd6] dark:hover:border-white/60 dark:hover:text-white"
                aria-label={lang === "ar" ? "واتساب مباشر" : "Direct WhatsApp"}
              >
                <MessageCircle className="h-3.5 w-3.5 text-[#128c7e]" aria-hidden="true" />
                {lang === "ar" ? "واتساب" : "WhatsApp"}
              </a>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
