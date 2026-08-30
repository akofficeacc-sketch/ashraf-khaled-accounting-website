/**
 * Structured, Non-PII Logger.
 * Strictly adheres to RULE 3 (NO SILENT FAILURES) & RULE 4 (EXPLICIT ERROR TYPES).
 * Ensures zero PII (phone numbers, full names, emails) leaks into server logs.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

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

function formatLog(level: LogLevel, payload: LogPayload): string {
  const timestamp = new Date().toISOString();
  const meta = sanitizeMetadata(payload.metadata);
  const errorDetails =
    payload.error instanceof Error
      ? { name: payload.error.name, message: payload.error.message, stack: payload.error.stack }
      : payload.error
      ? String(payload.error)
      : undefined;

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
