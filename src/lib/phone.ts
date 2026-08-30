/**
 * Egyptian phone-number normalization and validation.
 * Strictly adheres to RULE 2 (VALIDATE ALL INPUTS), RULE 7 (FAIL-SAFE DEFAULTS),
 * and RULE 8 (ASSERTIONS FOR INVARIANTS).
 *
 * Egyptian Mobile Number Rules:
 *  - Mobile prefixes: 010 (Vodafone), 011 (Etisalat), 012 (Orange), 015 (WE)
 *  - Total digits: 11 (national: 01XXXXXXXXX)
 *  - E.164 format: +201XXXXXXXXX (13 characters)
 */

export type NormalizedPhone = {
  /** Full international form: +20XXXXXXXXXX (13 chars). */
  e164: string;
  /** Human-friendly display form: +20 1XX XXX XXXX. */
  display: string;
  /** Mobile operator identifier: vodafone, etisalat, orange, we, or other */
  carrier: "vodafone" | "etisalat" | "orange" | "we" | "egypt_mobile";
};

export function normalizeEgyptianPhone(raw: unknown): NormalizedPhone | null {
  // RULE 2: Validate input type & bound length
  if (typeof raw !== "string" || raw.trim().length === 0 || raw.length > 50) {
    return null;
  }

  let cleaned = raw.trim();
  const hasPlus = cleaned.startsWith("+");
  // Keep only digits
  cleaned = cleaned.replace(/[^\d]/g, "");
  if (!cleaned) return null;

  let national: string;

  if (hasPlus) {
    let rest = cleaned;
    if (rest.startsWith("0020")) rest = rest.slice(4);
    else if (rest.startsWith("20")) rest = rest.slice(2);
    else return null;

    if (/^01[0125]\d{8}$/.test(rest)) national = rest;
    else if (/^1[0125]\d{8}$/.test(rest)) national = `0${rest}`;
    else return null;
  } else {
    let rest = cleaned;
    if (rest.startsWith("0020")) rest = rest.slice(4);
    else if (rest.startsWith("20") && rest.length === 12) rest = rest.slice(2);

    if (/^01[0125]\d{8}$/.test(rest)) national = rest;
    else if (/^1[0125]\d{8}$/.test(rest)) national = `0${rest}`;
    else return null;
  }

  // Exact validation of 11-digit national Egyptian mobile: 01 + [0,1,2,5] + 8 digits
  if (!/^01[0125]\d{8}$/.test(national)) {
    return null;
  }

  const prefix = national.slice(0, 3);
  let carrier: NormalizedPhone["carrier"] = "egypt_mobile";
  if (prefix === "010") carrier = "vodafone";
  else if (prefix === "011") carrier = "etisalat";
  else if (prefix === "012") carrier = "orange";
  else if (prefix === "015") carrier = "we";

  const e164 = `+20${national.slice(1)}`; // +201XXXXXXXXX (13 chars)
  const rest = national.slice(1); // 1XXXXXXXXX (10 chars)
  const display = `+20 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;

  // RULE 8: Assertion for invariant
  if (e164.length !== 13 || !e164.startsWith("+201")) {
    return null;
  }

  return { e164, display, carrier };
}
