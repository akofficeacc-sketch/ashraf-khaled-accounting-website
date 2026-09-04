const CONTACT_SUBMITTED_COOKIE = "ak_contact_submitted";
const CONTACT_COOLDOWN_SECONDS = 60 * 60 * 24 * 2;
export const CONTACT_SUBMITTED_EVENT = "ak-contact-submitted";

export function hasRecentContactSubmission(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((cookie) => {
    const [name, value] = cookie.trim().split("=");
    return name === CONTACT_SUBMITTED_COOKIE && value === "1";
  });
}

export function rememberContactSubmission(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CONTACT_SUBMITTED_COOKIE}=1; Max-Age=${CONTACT_COOLDOWN_SECONDS}; Path=/; SameSite=Lax`;
  window.dispatchEvent(new Event(CONTACT_SUBMITTED_EVENT));
}
