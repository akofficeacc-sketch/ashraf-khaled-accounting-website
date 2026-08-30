import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
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

const contactSchema = z.object({
  name: z
    .string({ error: "name is required" })
    .trim()
    .min(2, "name must be at least 2 characters")
    .max(120, "name must be at most 120 characters")
    .regex(/^[^\<\>\"\'\;\=\(\)]+$/, "name contains prohibited characters")
    // Control characters (incl. CRLF) must never reach the DB or the mail template.
    .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), "name contains control characters"),
  phone: z
    .string({ error: "phone is required" })
    .trim()
    .min(7, "phone must be at least 7 characters")
    .max(25, "phone must be at most 25 characters")
    .regex(/^[+\d\s()-]+$/, "phone contains invalid characters"),
  email: z
    .union([z.literal(""), z.string().email("invalid email address").max(150)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  service: z
    .string()
    .trim()
    .max(120, "service must be at most 120 characters")
    .refine((v) => v.length === 0 || !/[\u0000-\u001F\u007F]/.test(v), "service contains control characters")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  message: z
    .string({ error: "message is required" })
    .trim()
    .min(5, "message must be at least 5 characters")
    .max(2000, "message must be at most 2000 characters")
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

  // 1. Sliding-window rate limit per client key
  const clientKey = getClientKey(request);
  const limit = rateLimit({
    key: `contact:${clientKey}`,
    limit: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

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
    return jsonResponse(
      {
        ok: false,
        error: { code: "VALIDATION_FAILED", message: errorMessage },
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
    const saved = await db.contactMessage.create({
      data: {
        name: data.name,
        phone: normalizedPhone.e164, // Always standardized +201XXXXXXXXX
        email: data.email,
        service: data.service,
        message: data.message,
        lang: data.lang,
      },
    });

    logger.info({
      module: "contact-api",
      action: "POST",
      message: "Contact message stored successfully",
      metadata: { id: saved.id, lang: data.lang, carrier: normalizedPhone.carrier },
    });

    // 9. Send email notification asynchronously without blocking API response
    void sendContactNotification({
      id: saved.id,
      name: data.name,
      phoneDisplay: normalizedPhone.display,
      email: data.email,
      service: data.service,
      message: data.message,
      lang: data.lang,
    }).catch((err) => {
      logger.error({
        module: "contact-api",
        action: "sendNotification",
        message: "Async mail notification failed after DB save",
        error: err,
      });
    });

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
  return jsonResponse({ ok: true, message: "Ashraf & Khaled Accounting Office Contact API v2.0" }, 200);
}
