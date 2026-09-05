import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { insertContactMessage } from "@/lib/db";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { normalizeEgyptianPhone } from "@/lib/phone";
import { sendContactNotification } from "@/lib/mail";
import { logger } from "@/lib/logger";
import { assertSameOrigin } from "@/lib/origin-guard";

export const dynamic = "force-dynamic";

/** POST rate limit: 5 requests per 60 seconds per client key. */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Reject bodies larger than this character length. */
const MAX_BODY_CHARS = 10_000;
/** Hard byte cap while streaming the body: 10,000 chars * 4 bytes UTF-8 max. */
const MAX_BODY_BYTES = MAX_BODY_CHARS * 4;

/** Reject clickable or commonly obfuscated URLs in user-entered text. */
const LINK_PATTERN = /(?:https?|ftp|hxxps?):\/\/|(?:javascript|data):|\bwww\s*\.\s*|\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\s*\.\s*)+[a-z]{2,}(?:\s*[/?#:]|\b)|\b(?:\d{1,3}\s*\.){3}\d{1,3}(?:\s*[:/]|\b)/i;

function containsLink(value: string): boolean {
  return LINK_PATTERN.test(value.replace(/\[\s*\.\s*\]/g, "."));
}

/** Reject a deceptive domain-like local part while allowing normal email addresses. */
function containsSuspiciousEmail(value: string): boolean {
  const normalized = value.replace(/\[\s*\.\s*\]/g, ".").trim();
  const localPart = normalized.slice(0, normalized.lastIndexOf("@")).trim();
  return /^www\s*\./i.test(localPart)
    || /^(?:https?|hxxps?):\/\//i.test(localPart)
    || /\b(?:\d{1,3}\s*\.){3}\d{1,3}\b/.test(localPart);
}

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
} as const;

type CloudflareRateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

type CloudflareRequest = Request & {
  cf?: {
    city?: string;
    country?: string;
    region?: string;
  };
};

async function enforceRateLimit(key: string) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const cloudflareLimiter = (env as { CONTACT_RL?: CloudflareRateLimiter }).CONTACT_RL;
    if (cloudflareLimiter) {
      const result = await cloudflareLimiter.limit({ key });
      return {
        success: result.success,
        remaining: result.success ? RATE_LIMIT_MAX - 1 : 0,
        retryAfterSec: result.success ? 0 : Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      };
    }
  } catch (error) {
    logger.warn({
      module: "contact-api",
      action: "rateLimit",
      message: "Cloudflare rate-limit binding unavailable; using local fallback",
      error,
    });
  }

  return rateLimit({
    key,
    limit: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
}

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

const contactSchema = z.object({
  name: z
    .string({ error: "name is required" })
    .trim()
    .min(2, "name must be at least 2 characters")
    .max(120, "name must be at most 120 characters")
    .regex(/^[^\<\>\"\'\;\=\(\)]+$/, "name contains prohibited characters")
    .refine((v) => !containsLink(v), "links are not allowed in the name")
    // Control characters (incl. CRLF) must never reach the DB or the mail template.
    .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), "name contains control characters"),
  phone: z
    .string({ error: "phone is required" })
    .trim()
    .min(7, "phone must be at least 7 characters")
    .max(25, "phone must be at most 25 characters")
    .regex(/^[+\d\s()-]+$/, "phone contains invalid characters"),
  email: z
    .union([
      z.literal(""),
      z
        .string()
        .email("invalid email address")
        .max(150)
        .refine((v) => !containsSuspiciousEmail(v), "links are not allowed in the email"),
    ])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  service: z
    .string({ error: "service is required" })
    .trim()
    .min(1, "service is required")
    .max(120, "service must be at most 120 characters")
    .refine((v) => !containsLink(v), "links are not allowed in the service")
    .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), "service contains control characters"),
  message: z
    .string({ error: "message is required" })
    .trim()
    .min(5, "message must be at least 5 characters")
    .max(2000, "message must be at most 2000 characters")
    .refine((v) => !containsLink(v), "links are not allowed in the message")
    // Allow internal newlines in the message body, but reject all other control chars.
    .refine((v) => !/[\u0000-\u0009\u000B-\u001F\u007F]/.test(v), "message contains control characters"),
  lang: z.enum(["ar", "en"]).default("ar"),
  submissionToken: z.string().optional(),
});

/** Honeypot verification */
function isHoneypotTriggered(body: unknown): boolean {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return false;
  }
  const website = (body as Record<string, unknown>).website;
  if (website === undefined || website === null) {
    return false;
  }
  if (typeof website === "string") {
    return website.trim().length > 0;
  }
  return String(website).trim().length > 0;
}

/**
 * Stream the request body while enforcing a hard byte cap.
 */
async function readBodyWithCap(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) {
    return "";
  }
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > maxBytes) {
          await reader.cancel().catch(() => undefined);
          return null;
        }
        text += decoder.decode(value, { stream: true });
      }
    }
    text += decoder.decode();
  } catch (err) {
    logger.warn({
      module: "contact-api",
      action: "readBodyWithCap",
      message: "Error reading request stream body",
      error: err,
    });
    return null;
  }
  return text;
}

export async function POST(request: Request): Promise<NextResponse> {
  // 0. Same-origin enforcement (CSRF defense-in-depth)
  const originBlock = assertSameOrigin(request);
  if (originBlock) {
    logger.warn({
      module: "contact-api",
      action: "POST",
      message: "Cross-origin request blocked by origin guard",
    });
    return originBlock;
  }

  // Only accept JSON. This also prevents the endpoint from being used as a
  // simple cross-site form target (defense-in-depth alongside the origin guard).
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "Please submit the contact form as JSON.",
        },
      },
      415,
    );
  }

  // 1. Sliding-window rate limit per client key
  const clientKey = getClientKey(request);
  const limit = await enforceRateLimit(`contact:${clientKey}`);

  if (!limit.success) {
    logger.warn({
      module: "contact-api",
      action: "POST",
      message: "Rate limit exceeded for client",
      metadata: { retryAfterSec: limit.retryAfterSec },
    });
    return jsonResponse(
      {
        ok: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please wait a moment before trying again.",
          retryAfterSec: limit.retryAfterSec,
        },
      },
      429,
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  // 2. Early rejection based on Content-Length header
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return jsonResponse(
        { ok: false, error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds maximum size limit." } },
        413,
      );
    }
  }

  // 3. Stream body with hard byte cap
  const raw = await readBodyWithCap(request, MAX_BODY_BYTES);
  if (raw === null || raw.length > MAX_BODY_CHARS) {
    return jsonResponse(
      { ok: false, error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds maximum size limit." } },
      413,
    );
  }

  // 4. Parse JSON
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonResponse(
      { ok: false, error: { code: "INVALID_JSON", message: "Malformed JSON payload in request." } },
      400,
    );
  }

  // 5. Honeypot check — bots receive fake success with UUID
  if (isHoneypotTriggered(body)) {
    logger.info({
      module: "contact-api",
      action: "POST",
      message: "Honeypot trap triggered by automated submission",
    });
    return jsonResponse({ ok: true, data: { id: crypto.randomUUID() } }, 200);
  }

  // 6. Schema validation with Zod
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const fieldPath = firstIssue?.path.join(".") || "input";
    const errorMessage = firstIssue ? `${fieldPath}: ${firstIssue.message}` : "Validation failed";
    const isLinkError = firstIssue?.message.startsWith("links are not allowed") ?? false;
    const isRequiredError = firstIssue?.message.endsWith("is required") ?? false;
    const errorCode = isLinkError
      ? firstIssue?.path[0] === "message"
        ? "MESSAGE_LINK_NOT_ALLOWED"
        : "LINK_NOT_ALLOWED"
      : isRequiredError
        ? "REQUIRED_FIELD"
        : "VALIDATION_FAILED";
    return jsonResponse(
      {
        ok: false,
        error: { code: errorCode, message: errorMessage },
      },
      400,
    );
  }

  const data = parsed.data;

  // 7. Normalize & validate Egyptian mobile phone (+201XXXXXXXXX)
  const normalizedPhone = normalizeEgyptianPhone(data.phone);
  if (!normalizedPhone) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: "INVALID_PHONE",
          message: "phone: Please enter a valid Egyptian mobile number (e.g. +20 100 123 4567 / 0122 451 7437)",
        },
      },
      400,
    );
  }

  // 8. Persist to database
  try {
    const saved = await insertContactMessage({
      name: data.name,
      phone: normalizedPhone.e164, // Always standardized +201XXXXXXXXX
      email: data.email,
      service: data.service,
      message: data.message,
      lang: data.lang,
    });

    logger.info({
      module: "contact-api",
      action: "POST",
      message: "Contact message stored successfully",
      metadata: { id: saved.id, lang: data.lang, carrier: normalizedPhone.carrier },
    });

    // 9. Keep the Worker alive for the email request without delaying the UI.
    const { ctx } = await getCloudflareContext({ async: true });
    const cloudflareRequest = request as CloudflareRequest;
    const forwardedIp = request.headers.get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();
    const ipAddress = request.headers.get("cf-connecting-ip")?.trim()
      || request.headers.get("x-real-ip")?.trim()
      || forwardedIp
      || "Local preview";
    const countryCode = request.headers.get("cf-ipcountry")?.trim().toUpperCase()
      || cloudflareRequest.cf?.country?.trim().toUpperCase();
    const city = cloudflareRequest.cf?.city?.trim();
    const region = cloudflareRequest.cf?.region?.trim();
    const country = countryCode === "EG"
      ? "Egypt"
      : city && countryCode
        ? `${city}, ${region ? `${region}, ` : ""}${countryCode}`
        : countryCode || "Local preview";
    ctx.waitUntil(
      sendContactNotification({
        id: saved.id,
        name: data.name,
        phoneDisplay: normalizedPhone.display,
        email: data.email,
        service: data.service,
        message: data.message,
        lang: data.lang,
        ipAddress,
        country,
        submittedAt: new Date().toISOString(),
      }).catch((err) =>
        logger.error({
          module: "contact-api",
          action: "sendNotification",
          message: "Mail failed after D1 save",
          error: err,
        }),
      ),
    );

    return jsonResponse({ ok: true, data: { id: saved.id } }, 200);
  } catch (error) {
    logger.error({
      module: "contact-api",
      action: "databaseSave",
      message: "Database insertion failed for contact message",
      error,
    });
    return jsonResponse(
      {
        ok: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Unable to store your request at this moment. Please call the office directly.",
        },
      },
      500,
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return jsonResponse(
    {
      ok: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Use POST to submit a contact request.",
      },
    },
    405,
    { Allow: "POST" },
  );
}
