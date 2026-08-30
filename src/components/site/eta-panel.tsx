"use client";

import * as React from "react";
import {
  ArrowUpLeft,
  ArrowUpRight,
  BookOpenText,
  ExternalLink,
  FileSearch,
  Landmark,
  Loader2,
  RefreshCw,
  Scale,
  ScrollText,
} from "lucide-react";
import { content, ETA } from "@/lib/site-content";
import { useLang, type Lang } from "./lang-provider";
import { cn } from "@/lib/utils";

type EtaNewsItem = {
  title: string;
  url: string;
  date: string | null;
  /** Original Arabic headline — present on machine-translated (EN) items. */
  titleAr?: string;
};

type EtaNewsResponse = {
  ok?: boolean;
  live?: boolean;
  lang?: string;
  items?: EtaNewsItem[];
  fetchedAt?: number;
};

/** Fetch with a client-side timeout so the panel never hangs. */
async function fetchEtaNews(lang: Lang): Promise<EtaNewsResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(`/api/eta-news?lang=${lang}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { ok: false };
    }
    const data = (await res.json()) as EtaNewsResponse;
    return data && typeof data === "object" ? data : { ok: false };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

function formatNewsDate(iso: string | null, lang: Lang): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Defense-in-depth: only render links that point at the official ETA portal.
 * The server already constructs URLs from a validated slug allowlist, but the
 * client never trusts API payloads blindly.
 */
function isSafeEtaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "www.eta.gov.eg";
  } catch {
    return false;
  }
}

function NewsSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-3 border-t border-cream/10 py-4">
          <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-[2px] bg-cream/20" />
          <div className="w-full space-y-2">
            <div className="h-3 w-3/4 rounded-[2px] bg-cream/15" />
            <div className="h-2.5 w-1/4 rounded-[2px] bg-cream/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExtLinkIcon() {
  const { lang } = useLang();
  const Icon = lang === "ar" ? ArrowUpLeft : ArrowUpRight;
  return <Icon className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />;
}

export function EtaPanel({ className }: { className?: string }) {
  const { lang } = useLang();
  const t = content[lang].calc.etaPanel;

  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  const [items, setItems] = React.useState<EtaNewsItem[]>([]);
  const [fetchedAt, setFetchedAt] = React.useState<number | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  /** Panel element ref — the upstream fetch only runs when it's near the viewport. */
  const panelRef = React.useRef<HTMLDivElement>(null);
  const startedRef = React.useRef(false);

  const load = React.useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) setRefreshing(true);
      const data = await fetchEtaNews(lang);
      if (data.ok && data.live && Array.isArray(data.items)) {
        // Only accept links pinned to the official ETA portal.
        const safe = data.items.filter((item) => isSafeEtaUrl(item.url));
        setItems(safe.slice(0, 5));
        setFetchedAt(data.fetchedAt ?? Date.now());
        setState("ready");
      } else if (data.ok && Array.isArray(data.items)) {
        // Upstream unreachable — show curated links only.
        setItems([]);
        setFetchedAt(null);
        setState("error");
      } else {
        setState("error");
      }
      if (isRefresh) setRefreshing(false);
    },
    [lang],
  );

  // Fetch the live news only when the panel approaches the viewport — keeps
  // the initial page load free of the upstream eta.gov.eg round-trip.
  React.useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // Fallback (very old browsers): fetch right away.
      void load(false);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !startedRef.current) {
          startedRef.current = true;
          observer.disconnect();
          void load(false);
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [load]);

  // Refetch (still deferred by the observer) when the language changes.
  React.useEffect(() => {
    if (!startedRef.current) return;
    setState("loading");
    setItems([]);
    void load(false);
  }, [load]);

  const links: { label: string; href: string; icon: React.ReactNode }[] = [
    { label: t.vatLaws, href: lang === "ar" ? ETA.vatLawsAr : ETA.vatLawsEn, icon: <Scale className="h-4 w-4" aria-hidden="true" /> },
    { label: t.incomeLaws, href: lang === "ar" ? ETA.incomeLawsAr : ETA.incomeLawsEn, icon: <ScrollText className="h-4 w-4" aria-hidden="true" /> },
    { label: t.periodicBooks, href: lang === "ar" ? ETA.periodicBooksAr : ETA.periodicBooksEn, icon: <BookOpenText className="h-4 w-4" aria-hidden="true" /> },
    { label: t.einvoice, href: lang === "ar" ? ETA.einvoiceInquiryAr : ETA.einvoiceInquiryEn, icon: <FileSearch className="h-4 w-4" aria-hidden="true" /> },
    { label: t.home, href: lang === "ar" ? ETA.homeAr : ETA.homeEn, icon: <Landmark className="h-4 w-4" aria-hidden="true" /> },
  ];

  const newsUrl = lang === "ar" ? ETA.newsAr : ETA.newsEn;
  const updatedLabel = fetchedAt
    ? new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(fetchedAt))
    : null;

  return (
    <section
      ref={panelRef}
      aria-label={t.title}
      className={cn(
        "relative border-t border-border bg-deep-2 text-cream",
        className,
      )}
    >
      {/* decorative hairline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" aria-hidden="true" />

      <div className="relative p-6 sm:p-8">

        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-gold/30 bg-transparent text-gold">
              <Landmark className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-lg font-black tracking-tight text-cream sm:text-xl">{t.title}</h3>
                <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-accent px-2 py-0.5 text-[10px] font-semibold ltr:tracking-wider rtl:tracking-normal text-accent-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                  {t.badge}
                </span>
              </div>
              <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-cream/60">{t.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-white/15 bg-transparent px-3.5 py-1.5 text-xs font-semibold text-cream/80 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-50"
            aria-label={refreshing ? t.refreshing : t.refresh}
          >
            {refreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {refreshing ? t.refreshing : t.refresh}
          </button>
        </div>

        {/* body */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {/* news */}
          <div className="border-t border-border pt-4 sm:pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-xs font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-gold-warm">{t.newsTitle}</h4>
              {updatedLabel && (
                <span className="text-[10px] font-bold text-cream/40">
                  {t.lastUpdated}: {updatedLabel}
                </span>
              )}
            </div>

            {lang === "en" && state === "ready" && items.length > 0 && (
              <p className="mb-1 text-[10px] font-semibold leading-4 text-cream/40">
                {t.translatedNote}
              </p>
            )}

            {state === "loading" ? (
              <div>
                <p className="sr-only">{t.loading}</p>
                <NewsSkeleton />
              </div>
            ) : state === "ready" && items.length > 0 ? (
              <ul className="max-h-[292px] overflow-y-auto pe-1">
                {items.map((item) => (
                  <li key={item.url}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={lang === "en" && item.titleAr ? item.titleAr : undefined}
                      className="group flex items-start gap-3 border-b border-cream/10 py-3.5"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-[2px] bg-gold/70" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-bold leading-6 text-cream/90 transition-colors group-hover:text-gold-warm">
                          {item.title}
                        </span>
                        {item.date && (
                          <time dateTime={item.date} className="mt-0.5 block text-[11px] font-semibold text-cream/40" dir="ltr">
                            {formatNewsDate(item.date, lang)}
                          </time>
                        )}
                      </span>
                      <span className="mt-1.5 text-gold-warm">
                        <ExtLinkIcon />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-dashed border-cream/15 pt-5 text-center text-[13px] leading-7 text-cream/55">
                {t.offline}
              </p>
            )}

            <a
              href={newsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-gold-warm transition-opacity hover:opacity-80"
            >
              {t.viewAll}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          {/* laws & services */}
          <div className="border-t border-border pt-4 sm:pt-5">
            <h4 className="mb-3 text-xs font-bold ltr:uppercase ltr:tracking-wider rtl:tracking-normal text-gold-warm">{t.lawsTitle}</h4>
            <ul>
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 border-b border-cream/10 py-2.5"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] border border-white/10 text-gold">
                      {link.icon}
                    </span>
                    <span className="min-w-0 flex-1 text-[13px] font-bold leading-5 text-cream/85 transition-colors group-hover:text-gold-warm">
                      {link.label}
                    </span>
                    <span className="text-cream/30 transition-colors group-hover:text-gold-warm">
                      <ExtLinkIcon />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-center text-[10px] font-semibold tracking-wide text-cream/35">{t.sourceNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
