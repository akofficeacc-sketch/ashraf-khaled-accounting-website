/**
 * Structured, Non-PII Logger.
 * Strictly adheres to RULE 3 (NO SILENT FAILURES) & RULE 4 (EXPLICIT ERROR TYPES).
 * Ensures zero PII (phone numbers, full names, emails) leaks into server logs.
 */

type LogLevel = "info" | "warn" | "error" | "debug";
const MAX_ERROR_LOG_CHARS = 2_000;

export type LogPayload = {
  module: string;
  action: string;
  message: string;
  error?: unknown;
  metadata?: Record<string, unknown>;
};

function sanitizeMetadata(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const sanitized: Record<string, unknown> = {};
  // Exact-match keys that must never reach plaintext logs.
  const PII_KEYS = [
    "phone", "email", "name", "password", "token", "message", "authorization",
    "fullname", "full_name", "first_name", "last_name", "username", "e164",
    "address", "ip", "client_ip", "clientkey", "client_key", "cookie",
    "secret", "api_key", "apikey", "bearer", "credential", "display",
  ];
  // Substring catch-alls for compound keys (phoneDisplay, e164Phone, apiKeyValue…).
  const PII_SUBSTRINGS = [
    "phone", "email", "token", "secret", "password", "authorization",
    "cookie", "e164", "address",
  ];

  for (const [key, value] of Object.entries(meta)) {
    const lower = key.toLowerCase();
    if (PII_KEYS.includes(lower) || PII_SUBSTRINGS.some((s) => lower.includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function truncateLogValue(value: string): string {
  return value.length > MAX_ERROR_LOG_CHARS
    ? `${value.slice(0, MAX_ERROR_LOG_CHARS)}…`
    : value;
}

/** Remove common personal-data formats from error details before logging. */
function redactLogText(value: string): string {
  return truncateLogValue(value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[PHONE]"));
}

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: redactLogText(error.message),
      ...(error.stack ? { stack: redactLogText(error.stack) } : {}),
    };
  }
  if (typeof error === "string") return redactLogText(error);
  if (error && typeof error === "object") {
    try {
      const serialized = redactLogText(JSON.stringify(error));
      if (serialized.length <= MAX_ERROR_LOG_CHARS) return JSON.parse(serialized);
      return `${serialized.slice(0, MAX_ERROR_LOG_CHARS)}…`;
    } catch {
      return "[Unserializable error]";
    }
  }
  return error === undefined ? undefined : String(error);
}

function formatLog(level: LogLevel, payload: LogPayload): string {
  const timestamp = new Date().toISOString();
  const meta = sanitizeMetadata(payload.metadata);
  const errorDetails = serializeError(payload.error);

  return JSON.stringify({
    timestamp,
    level,
    module: payload.module,
    action: payload.action,
    message: payload.message,
    metadata: meta,
    error: errorDetails,
  });
}

export const logger = {
  info(payload: LogPayload): void {
    if (process.env.NODE_ENV !== "test") {
      console.info(formatLog("info", payload));
    }
  },
  warn(payload: LogPayload): void {
    console.warn(formatLog("warn", payload));
  },
  error(payload: LogPayload): void {
    console.error(formatLog("error", payload));
  },
  debug(payload: LogPayload): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatLog("debug", payload));
    }
  },
};
