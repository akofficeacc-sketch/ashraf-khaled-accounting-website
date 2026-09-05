/**
 * Resend notification for contact-form submissions.
 * Strictly adheres to RULE 1 (CHECK RETURN VALUES), RULE 2 (VALIDATE INPUTS),
 * RULE 3 (NO SILENT FAILURES), and RULE 5 (BOUNDED TIMEOUTS).
 */

import { Resend } from "resend";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { logger } from "./logger";

export type SubmissionPayload = {
  id: string;
  name: string;
  phoneDisplay: string;
  email: string | null;
  service: string | null;
  message: string;
  lang: "ar" | "en";
  company?: string | null;
  businessStatus?: string | null;
  taxRegistration?: string | null;
  monthlyTransactions?: string | null;
  ipAddress?: string | null;
  country?: string | null;
  submittedAt?: string;
};

/** Prevent HTML injection into email templates */
function escapeHtml(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Sanitize single-line headers to prevent SMTP header injection (CRLF injection) */
function sanitizeHeader(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\r\n\x00-\x1F\x7F]+/g, " ").trim();
}

function displayValue(value: string | null | undefined): string {
  const clean = sanitizeHeader(value ?? "");
  return clean || "Not specified";
}

function displayMessage(value: string): string {
  return value.trim() || "Not specified";
}

function receivedAt(value: string | undefined): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "Not specified";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Africa/Cairo",
  }).format(date);
}

type MailEnvironment = {
  RESEND_API_KEY?: string;
  CONTACT_NOTIFY_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
};

/** Read production secrets from Worker bindings, with a local Node fallback. */
async function getMailEnvironment(): Promise<MailEnvironment> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as MailEnvironment;
  } catch {
    return {};
  }
}

function buildEmailHtml(p: SubmissionPayload): string {
  const row = (label: string, value: string, ltr = false) => `
    <tr>
      <td style="padding:8px 0;color:#66736d;font-size:14px;font-weight:600;width:44%;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;color:#10251d;font-size:14px;font-weight:700;vertical-align:top;${ltr ? "direction:ltr;text-align:left;" : ""}">${escapeHtml(value)}</td>
    </tr>`;
  const section = (title: string) => `
    <tr><td colspan="2" style="padding:22px 0 8px;color:#0b5c48;font-size:15px;font-weight:800;border-bottom:1px solid #dce7e1;">${title}</td></tr>`;
  const country = displayValue(p.country);
  const source = "Ashraf Mansy & Khaled El-Sadek Website";

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:24px;background:#f4f7f5;font-family:Arial,'Segoe UI',Tahoma,sans-serif;color:#10251d;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #d9e4de;border-radius:12px;padding:28px 32px;box-shadow:0 10px 28px rgba(16,37,29,.08);">
      <div style="padding-bottom:18px;border-bottom:3px solid #d4af37;">
        <div style="color:#0b5c48;font-size:20px;font-weight:800;">Ashraf Mansy &amp; Khaled El-Sadek</div>
        <div style="margin-top:6px;color:#66736d;font-size:13px;">New contact request</div>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${section("Contact details")}
        ${row("Full Name", displayValue(p.name))}
        ${row("Phone", displayValue(p.phoneDisplay), true)}
        ${row("Email", displayValue(p.email), true)}
        ${row("Company", displayValue(p.company))}
        ${section("Service requirement")}
        ${row("Service", displayValue(p.service))}
        ${row("Business Status", displayValue(p.businessStatus))}
        ${row("Tax Registration", displayValue(p.taxRegistration))}
        ${row("Monthly Transactions", displayValue(p.monthlyTransactions))}
      </table>
      <div style="margin-top:18px;padding-top:18px;border-top:1px solid #dce7e1;">
        <div style="color:#0b5c48;font-size:15px;font-weight:800;">Message</div>
        <div style="margin-top:10px;padding:16px 18px;background:#f7faf8;border-left:4px solid #d4af37;color:#1f342b;font-family:Arial,'Segoe UI',Tahoma,sans-serif;font-size:16px;font-weight:500;line-height:1.9;letter-spacing:.01em;white-space:pre-wrap;overflow-wrap:anywhere;">${escapeHtml(displayMessage(p.message))}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:18px;border-top:1px solid #dce7e1;">
        ${section("Submission")}
        ${row("Submitted from", source)}
        ${row("Received", receivedAt(p.submittedAt), true)}
        ${row("IP Address from", country)}
        ${row("IP Address", displayValue(p.ipAddress), true)}
        ${row("Reference", p.id.slice(0, 8), true)}
      </table>
      <div style="margin-top:22px;color:#8a9891;font-size:11px;">This notification was sent automatically from the website contact form.</div>
    </div>
  </body>
</html>`;
}

function buildEmailText(p: SubmissionPayload): string {
  const value = displayValue;
  return [
    "Ashraf Mansy & Khaled El-Sadek",
    "",
    "Contact details",
    `Full Name\t${value(p.name)}`,
    `Phone\t${value(p.phoneDisplay)}`,
    `Email\t${value(p.email)}`,
    `Company\t${value(p.company)}`,
    "",
    "Service requirement",
    `Service\t${value(p.service)}`,
    `Business Status\t${value(p.businessStatus)}`,
    `Tax Registration\t${value(p.taxRegistration)}`,
    `Monthly Transactions\t${value(p.monthlyTransactions)}`,
    "",
    "Message",
    "—",
    p.message,
    "",
    "Submission",
    "Submitted from\tAshraf Mansy & Khaled El-Sadek Website",
    `Received\t${receivedAt(p.submittedAt)}`,
    `IP Address from\t${value(p.country)}`,
    `IP Address\t${value(p.ipAddress)}`,
    `Reference\t${p.id.slice(0, 8)}`,
  ].join("\n");
}

/**
 * Sends the notification email.
 * Non-blocking failure: submission is already stored in DB — mail issues never disrupt response.
 */
export async function sendContactNotification(payload: SubmissionPayload): Promise<boolean> {
  const runtimeEnv = await getMailEnvironment();
  const apiKey = (runtimeEnv.RESEND_API_KEY ?? process.env.RESEND_API_KEY)?.trim();
  // Resend compares the onboarding recipient with the account email; normalize
  // casing so `Ak.officeacc@gmail.com` and `ak.officeacc@gmail.com` match.
  const to = sanitizeHeader(
    (runtimeEnv.CONTACT_NOTIFY_EMAIL ?? process.env.CONTACT_NOTIFY_EMAIL)?.trim() ?? "",
  ).toLowerCase();
  // Use a verified domain sender in production. Resend's onboarding sender is
  // useful for local setup but can only deliver to the account owner's inbox.
  const from = sanitizeHeader(
    (runtimeEnv.CONTACT_FROM_EMAIL ?? process.env.CONTACT_FROM_EMAIL)?.trim()
      ?? "Office Website <onboarding@resend.dev>",
  );

  if (!apiKey || !to) {
    logger.warn({
      module: "mail",
      action: "sendContactNotification",
      message: "RESEND_API_KEY or CONTACT_NOTIFY_EMAIL missing — notification skipped",
    });
    return false;
  }

  const isAr = payload.lang === "ar";
  const cleanName = sanitizeHeader(payload.name);
  const cleanPhone = sanitizeHeader(payload.phoneDisplay);

  const subject = isAr
    ? `طلب استشارة جديد: ${cleanName} (${cleanPhone})`
    : `New Consultation Request: ${cleanName} (${cleanPhone})`;

  try {
    const resend = new Resend(apiKey);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const requestOptions = {
        idempotencyKey: `contact/${payload.id}`,
        // Resend forwards unknown request options to fetch; the cast keeps the
        // SDK's narrow option type while allowing a bounded Worker request.
        signal: controller.signal,
      } as Parameters<typeof resend.emails.send>[1];
      const { data, error } = await resend.emails.send(
        {
          from,
          to: [to],
          subject,
          text: buildEmailText(payload),
          html: buildEmailHtml(payload),
          ...(payload.email ? { replyTo: payload.email } : {}),
        },
        requestOptions,
      );

      if (error) {
        logger.error({
          module: "mail",
          action: "sendContactNotification",
          message: "Resend rejected the email",
          error,
        });
        return false;
      }

      logger.info({
        module: "mail",
        action: "sendContactNotification",
        message: "Contact notification email sent successfully",
        metadata: { id: data?.id },
      });
      return true;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    logger.error({
      module: "mail",
      action: "sendContactNotification",
      message: "Failed to send contact notification email",
      error,
    });
    return false;
  }
}
