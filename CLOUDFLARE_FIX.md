# Cloudflare Deploy Fix + Resend Contact Form + Security Hardening

> Instructions for an LLM/coding agent working on this repository.
> Follow the steps **in order**. Each step lists the exact files to touch and the
> acceptance check to run before moving on. Do not skip the acceptance checks.

## Current repository status

The project now uses OpenNext on Cloudflare Workers, D1 for contact storage, and
Resend for notifications. `npm run build` creates the `.open-next` bundle, so a
subsequent `npx wrangler deploy` can deploy it. The D1 database is now configured
with its real UUID and the migration has been applied; Worker secrets remain an
account-level setup step.

---

## 0. Context: what this project is

- **Framework:** Next.js `16.3.3` (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui.
- **Source root:** `src/` (`src/app`, `src/components`, `src/lib`).
- **Package manager:** npm (`package-lock.json` is present). Use `npm install` / `npm run <script>` so OpenNext invokes Wrangler with the same package manager in local and Cloudflare builds.
- **Contact form UI:** `src/components/site/contact.tsx` → `ContactSection` (exported also as `Contact`, used in `src/app/page.tsx`).
  - Submit button label comes from `src/lib/site-content.ts`:
    - Arabic (line ~1031): `submit: "أرسل الطلب"`
    - English (line ~1579): `submit: "Send Request"`
  - The form `POST`s JSON to `/api/contact`.
- **Contact API:** `src/app/api/contact/route.ts` — validation (Zod), honeypot, rate limit, same-origin guard, then:
  1. saves to **Prisma + SQLite** (`src/lib/db.ts`, `prisma/schema.prisma`, `db/custom.db`)
  2. sends notification email via **Nodemailer + Gmail SMTP** (`src/lib/mail.ts`)
- **ETA news API:** `src/app/api/eta-news/route.ts` (fetches eta.gov.eg + translate.googleapis.com, in-memory cache).
- **Build config:** `next.config.ts` has `output: "standalone"` and a custom `build` script that copies `.next/static` into `.next/standalone`.

### Why the Cloudflare deploy fails

```
Executing user deploy command: npx wrangler deploy
✘ [ERROR] Could not detect a directory containing static files (e.g. html, css and js) for the project
```

Root causes (all must be fixed):

1. **There is no `wrangler.jsonc`/`wrangler.toml`** and no Cloudflare adapter. Plain `wrangler deploy` on a Next.js repo has nothing to deploy, so it looks for a static-assets folder and fails.
2. **Next.js App Router with API routes cannot run as a static site.** It must run on **Cloudflare Workers via `@opennextjs/cloudflare`** (the officially supported path). `@cloudflare/next-on-pages` is deprecated — do **not** use it.
3. **Two dependencies are incompatible with the Workers runtime:**
   - `nodemailer` (raw SMTP sockets on port 465) → replace with **Resend HTTP API**.
   - `@prisma/client` + **SQLite file** (`db/custom.db`) → there is no writable filesystem on Workers. Replace with **Cloudflare D1** (see Step 4).
4. `output: "standalone"` and the custom `cp -r` in the `build` script are for a Node server; OpenNext needs its own build command so it can create the `.open-next` bundle.

---

## 1. Install the Cloudflare adapter and Resend

```bash
npm install @opennextjs/cloudflare@latest resend
npm install --save-dev wrangler@latest
npm uninstall nodemailer @types/nodemailer
```

Add to `.gitignore`:

```
.open-next
.dev.vars
.wrangler
cloudflare-env.d.ts
```

**Check:** `npm ls @opennextjs/cloudflare resend wrangler` shows all three; `nodemailer` is gone.

---

## 2. Create `wrangler.jsonc` (project root)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "ashraf-khaled-accounting",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-09-04",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "services": [
    { "binding": "WORKER_SELF_REFERENCE", "service": "ashraf-khaled-accounting" }
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "ashraf-khaled-accounting-db",
      "database_id": "ce4e001b-22c0-4940-8448-65fe95166afe",
      "migrations_dir": "db/migrations"
    }
  ],
  "observability": { "enabled": true }
}
```

Notes:
- `name` must match `services[0].service` exactly.
- Do **not** put secrets (`RESEND_API_KEY`) in `vars` here — use `wrangler secret put` (Step 6).

---

## 3. Create `open-next.config.ts` (project root)

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // No ISR/caching needed for this site; add r2IncrementalCache later if required.
});
```

Create `.dev.vars` (local only, git-ignored):

```
NEXTJS_ENV=development
RESEND_API_KEY=re_xxxxxxxxx
CONTACT_NOTIFY_EMAIL=office@example.com
CONTACT_FROM_EMAIL=Website <noreply@yourdomain.com>
```

---

## 4. Replace Prisma + SQLite with Cloudflare D1

### 4a. Create the database

```bash
npx wrangler d1 create ashraf-khaled-contact
```

Copy the returned `database_id` into `wrangler.jsonc`.

### 4b. Schema — create `db/migrations/0001_contact_messages.sql`

```sql
CREATE TABLE IF NOT EXISTS contact_messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT,
  service    TEXT,
  message    TEXT NOT NULL,
  lang       TEXT NOT NULL DEFAULT 'ar' CHECK (lang IN ('ar','en')),
  handled    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at DESC);
```

Apply it:

```bash
npx wrangler d1 execute ashraf-khaled-contact --local  --file=db/migrations/0001_contact_messages.sql
npx wrangler d1 execute ashraf-khaled-contact --remote --file=db/migrations/0001_contact_messages.sql
```

### 4c. Rewrite `src/lib/db.ts`

Replace the whole file with a D1 helper (keep the same export shape used by the route: a function that inserts a contact message and returns `{ id }`).

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";

export type NewContactMessage = {
  name: string;
  phone: string;
  email: string | null;
  service: string | null;
  message: string;
  lang: "ar" | "en";
};

export async function insertContactMessage(m: NewContactMessage): Promise<{ id: string }> {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as { DB?: D1Database }).DB;
  if (!db) throw new Error("D1 binding 'DB' is not configured");

  const id = crypto.randomUUID();
  // Parameterised statement — never interpolate user input into SQL.
  await db
    .prepare(
      `INSERT INTO contact_messages (id, name, phone, email, service, message, lang)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
    )
    .bind(id, m.name, m.phone, m.email, m.service, m.message, m.lang)
    .run();

  return { id };
}
```

Run `npx wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts` so `D1Database` types resolve, and add `"cloudflare-env.d.ts"` to `tsconfig.json` `include` if it is not picked up automatically.

### 4d. Remove Prisma

- Delete `prisma/`, `db/custom.db`.
- `npm uninstall @prisma/client prisma`
- Remove the `db:*` scripts from `package.json`.
- In `src/app/api/contact/route.ts` replace:

```ts
import { db } from "@/lib/db";
// ...
const saved = await db.contactMessage.create({ data: { ... } });
```

with:

```ts
import { insertContactMessage } from "@/lib/db";
// ...
const saved = await insertContactMessage({
  name: data.name,
  phone: normalizedPhone.e164,
  email: data.email,
  service: data.service,
  message: data.message,
  lang: data.lang,
});
```

`saved.id` keeps working; nothing else in the route changes.

---

## 5. Replace Nodemailer/Gmail with Resend — `src/lib/mail.ts`

Keep `escapeHtml`, `sanitizeHeader`, `buildEmailHtml`, `buildEmailText`, and the `SubmissionPayload` type **unchanged** (they are already injection-safe). Replace only the imports and `sendContactNotification`:

```ts
import { Resend } from "resend";
import { logger } from "./logger";
// ...existing helpers/types stay here...

export async function sendContactNotification(payload: SubmissionPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = sanitizeHeader(process.env.CONTACT_NOTIFY_EMAIL?.trim() ?? "");
  // Must be a verified domain sender on resend.com/domains.
  // Until the domain is verified, "onboarding@resend.dev" works but can only
  // deliver to the email address that owns the Resend account.
  const from = sanitizeHeader(process.env.CONTACT_FROM_EMAIL?.trim() ?? "Office Website <onboarding@resend.dev>");

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
    const { data, error } = await resend.emails.send(
      {
        from,
        to: [to],
        subject,
        text: buildEmailText(payload),
        html: buildEmailHtml(payload),
        // Only set reply_to if the visitor gave a syntactically valid address
        // (already validated by Zod in the route).
        ...(payload.email ? { replyTo: payload.email } : {}),
      },
      // Idempotency: a retry of the same submission never sends twice.
      { idempotencyKey: `contact/${payload.id}` },
    );

    if (error) {
      logger.error({ module: "mail", action: "sendContactNotification", message: "Resend rejected the email", error });
      return false;
    }
    logger.info({ module: "mail", action: "sendContactNotification", message: "Notification sent", metadata: { id: data?.id } });
    return true;
  } catch (error) {
    logger.error({ module: "mail", action: "sendContactNotification", message: "Resend call failed", error });
    return false;
  }
}
```

Remove the unused `NO_STORE_HEADERS` constant from `mail.ts` (email headers are not HTTP headers).

### 5a. Make "Send Request" / "أرسل الطلب" actually wait for the email

Currently `route.ts` fires `void sendContactNotification(...)` and returns immediately. **On Cloudflare Workers, un-awaited promises are killed when the response is returned**, so the email would silently never send. Fix in `src/app/api/contact/route.ts`:

```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
// ...
const { ctx } = await getCloudflareContext({ async: true });
ctx.waitUntil(
  sendContactNotification({ ...payload }).catch((err) =>
    logger.error({ module: "contact-api", action: "sendNotification", message: "Mail failed", error: err }),
  ),
);
return jsonResponse({ ok: true, data: { id: saved.id } }, 200);
```

`ctx.waitUntil` keeps the Worker alive until the email request finishes while still returning the response instantly to the user — so both buttons show the success state right away and the office still receives the email.

### 5b. Frontend error-shape mismatch (bug)

`src/components/site/contact.tsx` line ~189 does `data?.error?.startsWith("phone:")`, but the API returns `error: { code, message }` (an object), so `.startsWith` throws and the user sees the generic error. Change the client type and check to:

```ts
const data = (await res.json().catch(() => null)) as
  | { ok?: boolean; error?: { code?: string; message?: string } }
  | null;
// ...
if (data?.error?.code === "INVALID_PHONE" || data?.error?.message?.startsWith("phone:")) {
```

---

## 6. Environment variables & secrets (Resend)

1. Create an API key at **https://resend.com/api-keys** with permission **"Sending access"** only (not "Full access"), optionally restricted to your domain.
2. Verify your sending domain at **https://resend.com/domains** (add the SPF/DKIM DNS records — they can be added in Cloudflare DNS for the same zone). Until verified, use `onboarding@resend.dev` as `from`, which only delivers to the account owner's inbox.
3. Set secrets on the Worker (never commit them, never put them in `wrangler.jsonc` `vars`):

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONTACT_NOTIFY_EMAIL
npx wrangler secret put CONTACT_FROM_EMAIL
```

If deploying via Cloudflare's Git integration (Workers Builds), set the same three as **Secrets** in *Workers & Pages → your Worker → Settings → Variables and Secrets*.

4. Delete every reference to `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `DATABASE_URL` from the code, README, and any `.env*` files. **Rotate/revoke the old Gmail App Password** in the Google account since it may have been in a repo.

---

## 7. Fix `next.config.ts` and `package.json` scripts

`next.config.ts`:
- Remove `output: "standalone"`.
- Append at the bottom of the file:

```ts
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

- Keep the `headers()` block (see Step 8 for CSP tweaks).

`package.json` scripts:

```json
{
  "dev": "next dev -p 3000",
  "build": "opennextjs-cloudflare build",
  "next:build": "next build",
  "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
  "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
  "upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
  "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts",
  "lint": "eslint ."
}
```

- Remove the `| tee dev.log` / `| tee server.log` pipes (they don't work in Cloudflare's build container and leak PII into log files).
- Remove the `start` script (no Node server anymore).

**In the Cloudflare dashboard** (Workers & Pages → project → Settings → Build):
- **Build command:** `npm run build` — this now creates the `.open-next` bundle.
- **Deploy command:** `npx wrangler deploy` or `npm run deploy` after the build completes.

Add `public/_headers`:

```
/_next/static/*
  Cache-Control: public,max-age=31536000,immutable
```

---

## 8. Security & vulnerability checklist

### 8a. Already good — keep as is
- Zod validation with control-character and CRLF rejection (`route.ts`).
- Honeypot field, sliding-window rate limit, Content-Length + streamed byte cap.
- Same-origin guard (`src/lib/origin-guard.ts`) via `Sec-Fetch-Site` / `Origin` / `Referer`.
- HTML escaping in the email template, header sanitisation for subject/from/to.
- `poweredByHeader: false`, HSTS, `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, `X-Robots-Tag` on `/api/*`.

### 8b. Must fix / change

| # | Issue | Fix |
|---|-------|-----|
| 1 | **Rate limiter is in-memory** (`src/lib/rate-limit.ts`). On Workers each isolate has its own memory, so the limit is trivially bypassed. | Back it with **Cloudflare KV** or the built-in **Workers Rate Limiting binding** (`"ratelimits": [{ "name": "CONTACT_RL", "namespace_id": "1001", "simple": { "limit": 5, "period": 60 } }]` in `wrangler.jsonc`, then `env.CONTACT_RL.limit({ key: clientIp })`). Also enable a **Cloudflare WAF rate-limiting rule** on `POST /api/contact` (e.g. 10 req / 1 min per IP) as an outer layer. |
| 2 | **Client IP detection** in `getClientKey` trusts `x-forwarded-for`, which is spoofable. | On Cloudflare use `request.headers.get("cf-connecting-ip")` **first**, then fall back. |
| 3 | **ETA news cache is in-memory** (`eta-news/route.ts`) → cold start on every isolate and repeated upstream fetches to eta.gov.eg. | Store the parsed items in KV with a 30-min TTL, or use Cloudflare Cache API (`caches.default`). Keep the 8 s timeout and 2 MB byte cap. |
| 4 | `prodCsp` uses `script-src 'self' 'unsafe-inline'`. | Acceptable for now (Next.js hydration scripts), but plan for a nonce-based CSP via `proxy.ts`. Add `connect-src 'self'` only — Resend is called server-side so nothing else is needed. Add `upgrade-insecure-requests`. |
| 5 | `Permissions-Policy` includes `interest-cohort=()` (obsolete, harmless) — fine to keep. | — |
| 6 | **Secrets in repo history**: check `git log -p -S GMAIL_APP_PASSWORD` and `-S DATABASE_URL`. | If found, rotate the credential. Consider `git filter-repo` if the repo is public. |
| 7 | **Large binary files at repo root** (`WhatsApp_Image_*.png/.webp`, ~2 MB) and `dev.log`, `lint-output.txt`, `stress-test.mjs`, `run.bat`, `worklog.md`. | Delete or move to `public/`; they inflate the Worker bundle/upload and `dev.log` may contain PII. |
| 8 | `db/custom.db` — a SQLite file with real contact data may be committed. | Delete from repo, add `*.db` to `.gitignore`, rotate/notify if it contained PII. |
| 9 | Resend `from` must be a **verified domain**; `replyTo` uses visitor email. | Keep Zod `.email()` validation (already present) so `replyTo` cannot inject headers. |
| 10 | Dependency audit | Run `bun audit` (or `npm audit --omit=dev`) and update `next`, `zod`, `resend`, `@opennextjs/cloudflare` to latest patch versions. |
| 11 | Turnstile (optional, recommended) | Add **Cloudflare Turnstile** to the contact form and verify the token server-side in `route.ts` (`https://challenges.cloudflare.com/turnstile/v0/siteverify`). Add `https://challenges.cloudflare.com` to `script-src` and `frame-src` in the CSP if you do. |

### 8c. Logging / PII
- `logger.ts` must never log `name`, `phone`, `email`, or `message`. Only log `id`, `lang`, `code`.
- Enable Workers **Logs** (`observability.enabled: true`, already in `wrangler.jsonc`) instead of file logs.

---

## 9. Acceptance tests (run all before declaring done)

```bash
# 1. Type-check + lint
npm run lint && npx tsc --noEmit

# 2. Build for Workers (this is what previously failed)
npm run preview        # opens http://localhost:8787 in the workerd runtime
```

Then in the browser (both languages — toggle AR/EN):

- [ ] Click **"أرسل الطلب"** with a valid Egyptian number (e.g. `01001234567`) → success panel appears (`تم استلام طلبك` / success title), response `200 {ok:true,data:{id}}`.
- [ ] Click **"Send Request"** in English → same.
- [ ] Email arrives at `CONTACT_NOTIFY_EMAIL` within ~10 s; check https://resend.com/emails shows `delivered`.
- [ ] Invalid phone (`123`) → inline Arabic/English phone error, HTTP 400 `INVALID_PHONE`.
- [ ] Submit 6 times quickly → 6th returns 429 and the UI shows the "wait a minute" message.
- [ ] `curl -X POST https://<worker>/api/contact -H 'Origin: https://evil.example' -d '{}'` → 403 `CROSS_ORIGIN_BLOCKED`.
- [ ] Fill the hidden `website` honeypot via devtools → 200 fake success, **no** row in D1, **no** email.
- [ ] `npx wrangler d1 execute ashraf-khaled-contact --remote --command "SELECT id,lang,created_at FROM contact_messages ORDER BY created_at DESC LIMIT 5"` shows the test rows.
- [ ] `curl -I https://<worker>/` shows HSTS, CSP, X-Frame-Options, no `X-Powered-By`.

Finally:

```bash
npm run deploy
```

Expected tail of output: `Deployed ashraf-khaled-accounting triggers … https://ashraf-khaled-accounting.<subdomain>.workers.dev` — **no** "Could not detect a directory containing static files" error.

---

## 10. Files touched (summary)

| Action | Path |
|--------|------|
| create | `wrangler.jsonc`, `open-next.config.ts`, `.dev.vars`, `public/_headers`, `db/migrations/0001_contact_messages.sql`, `CLOUDFLARE_FIX.md` |
| rewrite | `src/lib/db.ts`, `src/lib/mail.ts` (send function only) |
| edit | `src/app/api/contact/route.ts` (D1 insert, `ctx.waitUntil`), `src/components/site/contact.tsx` (error shape), `src/lib/rate-limit.ts` (`cf-connecting-ip`), `next.config.ts`, `package.json`, `.gitignore`, `README.md` |
| delete | `prisma/`, `db/custom.db`, `dev.log`, `lint-output.txt`, `run.bat`, `stress-test.mjs`, root `WhatsApp_Image_*` files, `Caddyfile` |
