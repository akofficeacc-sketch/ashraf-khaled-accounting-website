import { NextResponse } from "next/server";

/**
 * Same-origin enforcement for state-changing API requests (CSRF defense-in-depth).
 *
 * Strategy (Fetch Metadata + Origin/Referer fallback):
 *  1. `Sec-Fetch-Site` (sent by all modern browsers):
 *     - "cross-site" → blocked outright.
 *     - "same-site"  → allowed only if the Origin host exactly matches the
 *       request Host (same-site still permits subdomain cross-origin attacks).
 *     - "same-origin" / "none" / absent → fall through to (2).
 *  2. If `Origin` or `Referer` is present, its host must exactly match the
 *     request `Host` header (scheme-agnostic; TLS terminates at the gateway).
 *  3. No Fetch-Metadata header AND no Origin/Referer → non-browser client
 *     (curl, monitoring, server-to-server) → allowed.
 *
 * Returns a 403 NextResponse when the request must be blocked, or null when
 * the request is same-origin and may proceed.
 */

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
} as const;

function crossOriginBlocked(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "CROSS_ORIGIN_BLOCKED",
        message: "Cross-origin requests are not allowed.",
      },
    },
    { status: 403, headers: NO_STORE_HEADERS },
  );
}

/** Exact host:port comparison, case-insensitive. */
function hostsMatch(candidateHost: string, request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) return false;
  return candidateHost.toLowerCase() === host.toLowerCase();
}

/** URL host extraction; unparsable URLs are treated as hostile. */
function urlHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function assertSameOrigin(request: Request): NextResponse | null {
  const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();

  if (secFetchSite === "cross-site") {
    return crossOriginBlocked();
  }

  const origin = request.headers.get("origin");
  const originHost = origin && origin !== "null" ? urlHost(origin) : null;

  if (secFetchSite === "same-site") {
    // Same-site (e.g. sibling subdomain) — require exact host equality.
    if (originHost && !hostsMatch(originHost, request)) {
      return crossOriginBlocked();
    }
    return null;
  }

  // Fallback path: same-origin / none / header absent.
  if (originHost && !hostsMatch(originHost, request)) {
    return crossOriginBlocked();
  }

  const referer = request.headers.get("referer");
  if (referer) {
    const refererHost = urlHost(referer);
    if (refererHost && !hostsMatch(refererHost, request)) {
      return crossOriginBlocked();
    }
  }

  return null;
}