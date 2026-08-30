import { NextResponse } from "next/server";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** Rate limits: 10 requests per 60 seconds per client key. */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

const CACHE_TTL_MS = 30 * 60_000;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_UPSTREAM_BYTES = 2_000_000;
const MAX_ITEMS = 6;
const MAX_TITLE_CHARS = 200;

/**
 * The Arabic ETA news feed is the authority's COMPLETE, canonical source — the
 * English feed (`/en/news`) only ever carries a subset of the articles. So the
 * feed is ALWAYS streamed from the Arabic page below; when English is requested
 * the Arabic titles are machine-translated server-side (see `translateTitle`).
 */
const SOURCE = "https://www.eta.gov.eg/ar/news";

/**
 * Machine translation (ar → en) via Google Translate's public `gtx` endpoint —
 * no API key, no account needed. The host is hardcoded (SSRF impossible) and
 * responses are tiny, so the byte cap is small. Each headline is translated at
 * most once per server lifetime thanks to the per-phrase memo cache.
 */
const TRANSLATE_HOST = "translate.googleapis.com";
const TRANSLATE_TIMEOUT_MS = 5_000;
const TRANSLATE_MAX_BYTES = 64_000;

type Lang = "ar" | "en";

export type EtaNewsItem = {
  title: string;
  url: string;
  date: string | null;
  /** Original Arabic headline — present on machine-translated (EN) items. */
  titleAr?: string;
};

type CacheEntry = { at: number; items: EtaNewsItem[] };

const cache = new Map<Lang, CacheEntry>();

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
} as const;

function jsonResponse(
  data: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { ...NO_STORE_HEADERS, ...extraHeaders },
  });
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function sanitizeTitle(raw: string): string {
  const text = decodeEntities(raw.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
  return text.length > MAX_TITLE_CHARS ? text.slice(0, MAX_TITLE_CHARS - 1) + "…" : text;
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{1,120}$/.test(slug);
}

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(value);
}

function parseEtaNews(html: string, lang: Lang): EtaNewsItem[] {
  const items: EtaNewsItem[] = [];
  const seen = new Set<string>();

  // Match Drupal news card: anchor followed by time tag
  const cardRegex = new RegExp(
    `<a href="/(?:${lang})/news/([a-z0-9-]+)" aria-label="([^"]+) link"[^>]*>[\\s\\S]{0,600}?<time datetime="([^"]+)"`,
    "g",
  );

  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(html)) !== null && items.length < MAX_ITEMS) {
    const slug = match[1];
    const rawTitle = match[2];
    const rawDate = match[3];

    if (!slug || !rawTitle || !isValidSlug(slug)) continue;

    const title = sanitizeTitle(rawTitle);
    const date = rawDate && isValidIsoDate(rawDate) ? rawDate : null;

    if (title.length < 4 || seen.has(slug)) continue;
    seen.add(slug);
    items.push({
      title,
      url: `https://www.eta.gov.eg/${lang}/news/${slug}`,
      date,
    });
  }

  // Fallback pattern if Drupal DOM varies
  if (items.length === 0) {
    const anchorRegex = new RegExp(`<a href="/(?:${lang})/news/([a-z0-9-]+)" aria-label="([^"]+) link"`, "g");
    const times = [...html.matchAll(/<time datetime="([^"]+)"/g)].map((m) => m[1]);
    let i = 0;
    while ((match = anchorRegex.exec(html)) !== null && items.length < MAX_ITEMS) {
      const slug = match[1];
      const rawTitle = match[2];
      if (!slug || !rawTitle || !isValidSlug(slug)) continue;

      const title = sanitizeTitle(rawTitle);
      const rawDate = times[i];
      const date = rawDate && isValidIsoDate(rawDate) ? rawDate : null;
      i += 1;

      if (title.length < 4 || seen.has(slug)) continue;
      seen.add(slug);
      items.push({
        title,
        url: `https://www.eta.gov.eg/${lang}/news/${slug}`,
        date,
      });
    }
  }

  return items;
}

/**
 * Hardened upstream reader:
 * - Redirects are followed MANUALLY (max 2 hops) and every hop is pinned to
 *   HTTPS on the exact official host — an open redirect on the upstream can
 *   never make this server fetch a third-party origin (anti-SSRF invariant).
 * - Body is streamed with a hard byte cap.
 */
const ALLOWED_HOSTS = new Set<string>(["www.eta.gov.eg", TRANSLATE_HOST]);
const MAX_REDIRECT_HOPS = 2;

function isAllowedUrl(url: URL, hosts: Set<string>): boolean {
  return url.protocol === "https:" && hosts.has(url.hostname);
}

async function fetchWithCap(
  rawUrl: string,
  opts: { hosts: Set<string>; timeoutMs: number; maxBytes: number; accept?: string },
): Promise<string | null> {
  try {
    let currentUrl = new URL(rawUrl);

    if (!isAllowedUrl(currentUrl, opts.hosts)) {
      logger.warn({
        module: "eta-news-api",
        action: "fetchWithCap",
        message: "Blocked non-allowlisted initial URL",
        metadata: { hostname: currentUrl.hostname },
      });
      return null;
    }

    let response: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
      response = await fetch(currentUrl, {
        headers: {
          "User-Agent": "AshrafKhaledAccountingSite/2.0 (Official Tax Reference Reader; +https://eta.gov.eg)",
          Accept: opts.accept ?? "text/html",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(opts.timeoutMs),
        cache: "no-store",
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) break;
        const nextUrl = new URL(location, currentUrl);
        if (!isAllowedUrl(nextUrl, opts.hosts)) {
          logger.warn({
            module: "eta-news-api",
            action: "fetchWithCap",
            message: "Redirect target outside allowlisted host — aborted",
            metadata: { hostname: nextUrl.hostname },
          });
          return null;
        }
        currentUrl = nextUrl;
        response = null;
        continue;
      }
      break;
    }

    if (!response || !response.ok || !response.body) {
      logger.warn({
        module: "eta-news-api",
        action: "fetchWithCap",
        message: `Upstream ETA responded with status ${response?.status ?? "n/a"}`,
      });
      return null;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let received = 0;
    let text = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > opts.maxBytes) {
          await reader.cancel().catch(() => undefined);
          logger.warn({
            module: "eta-news-api",
            action: "fetchWithCap",
            message: "Upstream ETA body exceeded byte cap, stream aborted",
          });
          return null;
        }
        text += decoder.decode(value, { stream: true });
      }
    }
    text += decoder.decode();
    return text;
  } catch (error) {
    logger.warn({
      module: "eta-news-api",
      action: "fetchWithCap",
      message: "Upstream fetch to ETA timed out or failed",
      error,
    });
    return null;
  }
}

/** Per-title translation memo — each Arabic headline is translated at most once. */
const translationCache = new Map<string, string>();

type GtxResponse = [Array<[string | null, ...unknown[]]>, ...unknown[]];

/**
 * Translate one Arabic headline → English via Google Translate's public `gtx`
 * endpoint (no key). Every call is timeout-capped, byte-capped and host-pinned.
 * On any failure the ORIGINAL Arabic title is returned (graceful degradation —
 * an item is never dropped just because translation hiccuped).
 */
async function translateTitle(text: string): Promise<string> {
  const cached = translationCache.get(text);
  if (cached !== undefined) return cached;

  try {
    const endpoint =
      `https://${TRANSLATE_HOST}/translate_a/single` +
      `?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const raw = await fetchWithCap(endpoint, {
      hosts: new Set<string>([TRANSLATE_HOST]),
      timeoutMs: TRANSLATE_TIMEOUT_MS,
      maxBytes: TRANSLATE_MAX_BYTES,
      accept: "application/json, text/plain, */*",
    });
    if (!raw) throw new Error("no body");

    const data = JSON.parse(raw) as GtxResponse;
    if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error("bad shape");

    const translated = data[0]
      .map((segment) => (Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""))
      .join("")
      .replace(/\s+/g, " ")
      .trim();

    if (translated.length < 2 || translated.length > MAX_TITLE_CHARS) throw new Error("bad length");

    translationCache.set(text, translated);
    return translated;
  } catch {
    return text;
  }
}

/**
 * Build the EN view of the (complete) Arabic feed: machine-translated titles
 * kept side-by-side with the original, and URLs pinned to the ARABIC article —
 * the English article page may simply not exist upstream, but the Arabic one
 * always does.
 */
async function translateItems(items: EtaNewsItem[]): Promise<EtaNewsItem[]> {
  const titles = await Promise.all(items.map((item) => translateTitle(item.title)));
  return items.map((item, i) => ({
    title: titles[i],
    titleAr: item.title,
    url: item.url,
    date: item.date,
  }));
}

export async function GET(request: Request): Promise<NextResponse> {
  // 1. Rate limiting
  const limit = rateLimit({
    key: `eta-news:${getClientKey(request)}`,
    limit: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!limit.success) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please wait a moment.",
        },
      },
      429,
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  // 2. Language selection with strict validation
  const url = new URL(request.url);
  const langParam = url.searchParams.get("lang");
  const lang: Lang = langParam === "en" ? "en" : "ar";

  // 3. Cache retrieval
  const cached = cache.get(lang);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return jsonResponse({ ok: true, live: true, lang, items: cached.items, fetchedAt: cached.at }, 200);
  }

  // 4. Upstream fetch — ALWAYS the complete Arabic feed (see `SOURCE` above)
  const html = await fetchWithCap(SOURCE, {
    hosts: ALLOWED_HOSTS,
    timeoutMs: FETCH_TIMEOUT_MS,
    maxBytes: MAX_UPSTREAM_BYTES,
  });
  if (!html) {
    // Fail-safe graceful degradation
    return jsonResponse({ ok: true, live: false, lang, items: [], fetchedAt: 0 }, 200);
  }

  const arItems = parseEtaNews(html, "ar");
  cache.set("ar", { at: Date.now(), items: arItems });

  let items = arItems;
  if (lang === "en") {
    // Titles are machine-translated (memoized per headline), URLs stay pinned
    // to the Arabic article pages so every link works.
    items = await translateItems(arItems);
    cache.set("en", { at: Date.now(), items });
  }

  return jsonResponse(
    {
      ok: true,
      live: items.length > 0,
      lang,
      items,
      fetchedAt: Date.now(),
    },
    200,
  );
}
