/**
 * Gmail notification for contact-form submissions.
 * Strictly adheres to RULE 1 (CHECK RETURN VALUES), RULE 2 (VALIDATE INPUTS),
 * RULE 3 (NO SILENT FAILURES), and RULE 5 (BOUNDED TIMEOUTS).
 */

import nodemailer from "nodemailer";
import { logger } from "./logger";

export type SubmissionPayload = {
  id: string;
  name: string;
  phoneDisplay: string;
  email: string | null;
  service: string | null;
  message: string;
  lang: "ar" | "en";
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

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

function buildEmailHtml(p: SubmissionPayload): string {
  const isAr = p.lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const labels = isAr
    ? {
        title: "طلب تواصل جديد من الموقع الإلكتروني",
        officeName: "مكتب محاسبة أشرف منسي وخالد الصادق",
        name: "اسم العميل",
        phone: "رقم الهاتف",
        email: "البريد الإلكتروني",
        service: "نوع الخدمة المطلوبة",
        message: "تفاصيل الرسالة والاستفسار",
        footer: "تم إرسال هذا الإشعار تلقائيًا من نموذج التواصل بموقع المكتب",
        badge: "إشعار فوري",
      }
    : {
        title: "New Contact Request from Website",
        officeName: "Ashraf & Khaled Accounting Office",
        name: "Client Name",
        phone: "Phone Number",
        email: "Email Address",
        service: "Requested Service",
        message: "Message Details",
        footer: "Sent automatically from the website contact form",
        badge: "Instant Alert",
      };

  const row = (label: string, value: string, ltr = false) => `
    <tr>
      <td style="padding:12px 16px;background:#f5f1e8;color:#18382f;font-weight:700;font-size:13px;white-space:nowrap;width:140px;border-bottom:1px solid #e7ded0;">${label}</td>
      <td style="padding:12px 16px;color:#0d1f1a;font-weight:600;font-size:14px;border-bottom:1px solid #e7ded0;${ltr ? "direction:ltr;text-align:left;" : ""}">${escapeHtml(value)}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${p.lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:24px;background:#ece7db;font-family:Arial, 'Segoe UI', Tahoma, sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d5cbba;box-shadow:0 12px 36px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg, #0d1f1a 0%, #18382f 100%);padding:24px 28px;border-bottom:3px solid #d4af37;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="color:#d4af37;font-size:12px;font-weight:bold;${p.lang === "ar" ? "" : "letter-spacing:1px;text-transform:uppercase;"}">${labels.officeName}</div>
            <h1 style="margin:6px 0 0 0;color:#ffffff;font-size:19px;font-weight:800;">${labels.title}</h1>
          </div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${row(labels.name, p.name)}
        ${row(labels.phone, p.phoneDisplay, true)}
        ${p.email ? row(labels.email, p.email, true) : ""}
        ${p.service ? row(labels.service, p.service) : ""}
        ${row(labels.message, p.message)}
      </table>
      <div style="padding:16px 28px;background:#f9f7f2;color:#6f685c;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
        <span>${labels.footer}</span>
        <span style="direction:ltr;font-family:monospace;font-size:11px;color:#9b9284;">Ref: ${escapeHtml(p.id.slice(0, 8))}</span>
      </div>
    </div>
  </body>
</html>`;
}

function buildEmailText(p: SubmissionPayload): string {
  const isAr = p.lang === "ar";
  const lines = isAr
    ? [
        "طلب تواصل جديد من موقع مكتب أشرف منسي وخالد الصادق",
        "=================================================",
        `الاسم: ${p.name}`,
        `الهاتف: ${p.phoneDisplay}`,
      ]
    : [
        "New contact request from Ashraf & Khaled Accounting Office",
        "==========================================================",
        `Name: ${p.name}`,
        `Phone: ${p.phoneDisplay}`,
      ];

  if (p.email) lines.push(isAr ? `البريد: ${p.email}` : `Email: ${p.email}`);
  if (p.service) lines.push(isAr ? `الخدمة: ${p.service}` : `Service: ${p.service}`);
  lines.push(isAr ? `الرسالة: ${p.message}` : `Message: ${p.message}`);
  lines.push("", `ID: ${p.id}`);
  return lines.join("\n");
}

/**
 * Sends the notification email.
 * Non-blocking failure: submission is already stored in DB — mail issues never disrupt response.
 */
export async function sendContactNotification(payload: SubmissionPayload): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!gmailUser || !gmailPass) {
    logger.debug({
      module: "mail",
      action: "sendContactNotification",
      message: "Gmail credentials not configured in environment — skipped email notification",
    });
    return false;
  }

  const to = sanitizeHeader(process.env.CONTACT_NOTIFY_EMAIL?.trim() || gmailUser);
  const isAr = payload.lang === "ar";
  const cleanName = sanitizeHeader(payload.name);
  const cleanPhone = sanitizeHeader(payload.phoneDisplay);

  const subject = isAr
    ? `طلب استشارة جديد: ${cleanName} (${cleanPhone})`
    : `New Consultation Request: ${cleanName} (${cleanPhone})`;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    const info = await transporter.sendMail({
      from: `"${isAr ? "موقع المكتب" : "Office Website"}" <${gmailUser}>`,
      to,
      subject,
      text: buildEmailText(payload),
      html: buildEmailHtml(payload),
      headers: NO_STORE_HEADERS,
    });

    logger.info({
      module: "mail",
      action: "sendContactNotification",
      message: "Contact notification email sent successfully",
      metadata: { messageId: info.messageId, to },
    });
    return true;
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
