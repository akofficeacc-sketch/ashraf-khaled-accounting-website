/**
 * Explicit Error Types for Ashraf & Khaled Accounting Website.
 * Adheres strictly to RULE 4 (EXPLICIT ERROR TYPES) & RULE 9 (ERROR PROPAGATION).
 */

export type ErrorContext = Record<string, unknown>;

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: ErrorContext;
  public readonly timestamp: string;

  constructor(message: string, code = "INTERNAL_ERROR", statusCode = 500, context?: ErrorContext) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  public readonly fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>, context?: ErrorContext) {
    super(message, "VALIDATION_FAILED", 400, context);
    this.fieldErrors = fieldErrors;
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterSec: number;

  constructor(message: string, retryAfterSec: number, context?: ErrorContext) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, context);
    this.retryAfterSec = retryAfterSec;
  }
}

export class UpstreamError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, "UPSTREAM_SERVICE_ERROR", 502, context);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, "PAYLOAD_TOO_LARGE", 413, context);
  }
}
