# Ashraf & Khaled Accounting Office — Rebuild Blueprint

> **Purpose:** Complete, self-contained spec to rebuild this website from an empty directory to
> the exact current production state. When in doubt, the *behavior* and *structure* here are the
> source of truth.
>
> **State date:** 2026-08-28. Last verified against the live dev server.

---

## 1. Mission & product

Bilingual (Arabic RTL / English LTR) single-page marketing + tools site for a real Egyptian
accounting firm: **مكتب محاسبة أشرف منسي وخالد الصادق / Ashraf & Khaled Accounting Office**
(Alexandria, Mustafa Kamel). It sells bookkeeping, tax (income/VAT), e-invoice/e-receipt
compliance, payroll and company formation; provides **free in-browser tax calculators**; surfaces
**live Egyptian Tax Authority (ETA) news**; captures leads through a hardened contact form stored
in SQLite.

**Personality:** "Clean Swiss bank" editorial design — flat paper-white canvas, hairline borders,
squared corners, deep forest-green ink surfaces, brushed-gold accents, monospace numerals. NOT a
glassmorphism/AI-template look. Zero external images.

**Non-negotiable engineering values:**
- VALIDATE ALL INPUTS (bounded, typed, sanitized)
- NO SILENT FAILURES (explicit errors, bounded timeouts, fail-safe defaults)
- NO PII IN LOGS
- DEFENSE IN DEPTH (every layer re-checks)
- PERFECT ARABIC TYPOGRAPHY (never break connected letters with letter-spacing)
- RESPECT `prefers-reduced-motion`

---

## 2. Tech stack (exact)

| Concern | Choice |
|---|---|
| Framework | **Next.js 16.3.3** (App Router, React 19, TypeScript strict) |
| Styling | **Tailwind CSS v4** (`@tailwindcss/postcss`) + `tw-animate-css` + global tokens |
| Components | shadcn/ui (new `data-slot` style) under `src/components/ui/` |
| Motion | `framer-motion` (scroll reveals) |
| Icons | `lucide-react` |
| i18n | Hand-rolled client context (AR/EN), no next-intl |
| Forms | `react-hook-form`, `@hookform/resolvers`, `zod` (custom form, not RHF-driven) |
| DB | **Prisma 6.19.3 + SQLite** (`db/custom.db`), singleton client, query logging OFF |
| Mail | `nodemailer` → Gmail SMTP (optional; app works without credentials) |
| Package mgr | **bun** (`bun.lock`) — *on this dev machine the `bun` shim is broken; use `npx -y bun <cmd>`* |
| Dev server | `next dev -p 3000 -H 127.0.0.1` (loopback only; prod routes through Caddy) |

**Framework config:** `output: "standalone"`, `typescript.ignoreBuildErrors: false`,
`reactStrictMode: true`, `poweredByHeader: false`.

---

## 3. Repository layout (rebuild target)

```
<root>/
├── .env                         # DATABASE_URL=file:../db/custom.db (+ optional GMAIL_*)
├── .gitignore
├── Caddyfile                    # production gateway (TLS, reverse proxy → :3000)
├── README.md                    # bilingual docs (setup, security, calculators)
├── worklog.md                   # full project history
├── blueprint.md                 # this file
├── package.json / bun.lock
├── components.json / eslint.config.mjs / next-env.d.ts
├── next.config.ts / postcss.config.mjs / tailwind.config.ts / tsconfig.json
├── prisma/schema.prisma
├── db/custom.db                 # created by `bun run db:push`
├── public/
│   ├── robots.txt
│   ├── logo.svg                 # legacy placeholder (unused)
│   ├── office-logo.jpeg           # brand asset
│   ├── office-logo-latest.png     # used by LogoMark <img src="/office-logo-latest.png">
│   ├── office-logo-bold.png / office-logo-final.png / office-logo-transparent.png
│   │   office-logo-transparent-user.png / office-logo-upgraded.png
│   └── .well-known/security.txt
└── src/
    ├── app/
    │   ├── globals.css / icon.jpeg (favicon) / layout.tsx / page.tsx / global-error.tsx
    │   └── api/
    │       ├── contact/route.ts   # POST (form) + GET (liveness)
    │       └── eta-news/route.ts  # GET (ETA feed proxy)
    ├── components/
    │   ├── theme-provider.tsx     # next-themes wrapper
    │   └── site/
    │   │   lang-provider, primitives, logo, chrome, hero, services, tools,
    │   │   eta-panel, why, about, proof, faq, contact, offer-popup
    │   └── ui/                    # shadcn primitives (~48 files: button, card, input,
    │                              #   tabs, accordion, table, dialog, sheet, sonner …)
    ├── hooks/                     # use-mobile, use-toast
    └── lib/
        db.ts, errors.ts, logger.ts, mail.ts, origin-guard.ts,
        phone.ts, rate-limit.ts, site-content.ts, utils.ts
```

> **Dead legacy files (do NOT rebuild):** `about-section.tsx`, `contact-section.tsx`,
> `hero-section.tsx`, `services-section.tsx`, `testimonials-section.tsx`,
> `features-section.tsx`, `tools-section.tsx`, `eta-section.tsx` — old "AI template" versions,
> not imported by `page.tsx`. They may be kept in a reference bundle or deleted.


---

## 4. Design system (exact)

### 4.1 Color tokens (`src/app/globals.css`)

```css
/* Light (:root) */
--background:#f4f4f5;  --foreground:#16181c;
--card:#ffffff;  --card-foreground:#16181c;
--popover:#ffffff;  --popover-foreground:#16181c;
--primary:#c8930e;  --primary-foreground:#241600;
--secondary:#eceff2;  --secondary-foreground:#2c3038;
--muted:#ededee;  --muted-foreground:#5d6570;
--accent:#fdf0d4;  --accent-foreground:#8a5f00;
--destructive:#da1e28;
--border:#e2e4e8;  --input:#e2e4e8;  --ring:#c8930e;
--deep:#0b4a38; --deep-2:#105a45; --deep-3:#1a6a52; --cream:#f7f8fa;
--gold:#d3a41c; --gold-2:#a16207;
--gold-shine:linear-gradient(112deg,#6b4300 0%,#9a6508 18%,#d9aa32 38%,#f0c85c 47%,#a86f06 62%,#d3a13a 80%,#704700 100%);
--emerald-glow:#c8930e;
--radius:4px;   /* squared Swiss corners */

/* Dark (.dark) */
--background:#101215; --foreground:#f2f4f8;
--card:#181b20; --card-foreground:#f2f4f8;
--popover:#181b20; --popover-foreground:#f2f4f8;
--primary:#e0b23f; --primary-foreground:#241803;
--secondary:#1e2228; --secondary-foreground:#eef1f5;
--muted:#191c21; --muted-foreground:#9aa3ae;
--accent:#211707; --accent-foreground:#f3d283;
--destructive:#fa4d56;
--border:rgba(255,255,255,.09); --input:rgba(255,255,255,.12); --ring:#e0b23f;
--deep:#0a2417; --deep-2:#0f3023; --deep-3:#14402e; --cream:#f2f4f8;
--gold:#e0b23f; --gold-2:#f3d283;
--gold-shine:linear-gradient(112deg,#9b6505 0%,#d8a52c 20%,#fff1a0 42%,#c98912 58%,#f7d875 78%,#956004 100%);
--emerald-glow:#e0b23f;
```
Tailwind v4 maps these via `@theme inline` to `--color-*` (background, foreground, card, muted,
primary, accent, destructive, border, input, ring, deep / deep-2 / deep-3, cream, gold, gold-2,
emerald-glow), `--font-sans: Inter + "Noto Sans Arabic" + fallbacks`, `--font-mono: "IBM Plex Mono"`,
and a squared radius scale derived from `--radius: 4px`.

### 4.2 Fonts
Loaded via **CDN `<link>` in `layout.tsx`** (NOT `next/font` — the build must never depend on
fetching fonts): `Inter 400–800`, `Noto Sans Arabic 400–900`, `IBM Plex Mono 400–600`,
`display=swap`, with `<link rel="preconnect">` to `fonts.googleapis.com` and `fonts.gstatic.com`
(the latter `crossOrigin="anonymous"`). Silent system-font fallback if offline. `html` starts at
`lang="ar" dir="rtl"` (client switches dynamically).

### 4.3 Custom utility classes (globals.css)
- `.glass-card` / `.glass-dark` — crisp panels, no blur
- `.text-gradient-emerald`, `.text-gradient-primary` — flat solid `--primary`
- `.text-gradient-gold`, `.text-gold-metallic` — brushed gold (`--gold-shine`), `background-clip:text`, transparent color
- `.bg-gold-metallic` (+ `.dark` deeper brass override)
- `.cta-gold-glow` (+ `.dark` stronger glow) — CTA drop shadow
- `.text-on-gold` (+ `.dark`) — silver-ink text with engraved shadow
- `.hero-arabic-title` — `word-spacing:.06em` (Arabic headline breathing)
- `.text-gold-warm` (+ `.dark`) — antique gold (#a9700d / #d1a044), dense ETA panel
- `.glow-emerald/.glow-gold/.glow-card` — flattened to `box-shadow:none`
- `.rule-gold` — 1px `color-mix(in oklab, var(--gold) 60%, transparent)`
- `.pulse-dot`, `.animate-floaty*` — `animation:none`
- `.bar-rise` + `@keyframes bar-rise` — `scaleY(0→1)`, `transform-origin:bottom`, opacity 0→1,
  0.9s `cubic-bezier(.22,1,.36,1)`, fill-mode both (used by the "Why" growth chart)
- `@media (prefers-reduced-motion: reduce)` — globally kills scroll/transitions/animations
- WebKit scrollbar (green thumb); `html`/`body` `overflow-x: clip`;
  `section[id]{scroll-margin-top:100px}`

### 4.4 Interaction conventions
- **Buttons** (`primitives.tsx`): `btnBase` = squared `rounded-[4px]`, `focus-visible:outline-2`,
  `active:translate-y-px`, `disabled:opacity-50`. Variants: `btnPrimary` (gold-metallic + glow,
  `text-on-gold`), `btnWhite` (cream on deep), `btnGold` (deep-green; dark: gold border +
  `#174b38`), `btnOutline` (hairline), `btnGhostOnDark`.
- **`Reveal`** (framer-motion): `initial="hidden" whileInView="show"`,
  `viewport={once:true, margin:"-60px"}`, ease `[0.16,1,0.3,1]`, duration .55. Variants:
  `up`, `left` (x:-28), `right` (x:+28), `scale`.
- **`Eyebrow`:** hairline rule + rotated square marker + tracked label;
  `ltr:uppercase ltr:tracking-[0.22em] rtl:tracking-normal`.
- **Arabic-safe type rule:** every `tracking-*`/`uppercase`/tiny `font-black(900)` must be gated
  `ltr:` with an `rtl:` normal-weight fallback.
- **Numbering:** mono `tabular-nums` gold numerals ("01/02/03") instead of bullets.


---

## 5. Dependencies (`package.json`)

**dependencies:** @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities · @hookform/resolvers ·
@prisma/client · ~25 @radix-ui/react-\* packages (accordion, alert-dialog, aspect-ratio, avatar,
checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar,
navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot,
switch, tabs, toast, toggle, toggle-group, tooltip) · class-variance-authority · clsx · cmdk ·
date-fns · embla-carousel-react · framer-motion · input-otp · lucide-react · next · next-themes ·
nodemailer · react · react-day-picker · react-dom · react-hook-form · react-resizable-panels ·
sharp · sonner · tailwind-merge · tailwindcss-animate · vaul · zod · zustand.

**devDependencies:** @tailwindcss/postcss · @types/nodemailer @types/react @types/react-dom ·
bun-types · eslint · eslint-config-next · tailwindcss · tw-animate-css · typescript · prisma.

**Explicitly removed (supply-chain hygiene — zero imports):** `react-markdown`,
`z-ai-web-dev-sdk`, `@tanstack/react-query`, `@tanstack/react-table`. Keep it that way.

**Scripts:**
```json
"dev": "next dev -p 3000 -H 127.0.0.1 2>&1 | tee dev.log",
"build": "next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/",
"start": "NODE_ENV=production bun .next/standalone/server.js 2>&1 | tee server.log",
"lint": "eslint .",
"db:push": "prisma db push --accept-data-loss",
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:reset": "prisma migrate reset"
```

---

## 6. Config files

### 6.1 `next.config.ts`
```ts
const baseHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];
// dev CSP: script-src 'self' 'unsafe-inline' 'unsafe-eval' ; connect-src 'self' https: wss:
// prod CSP: script-src 'self' 'unsafe-inline'                      ; connect-src 'self'
// BOTH: default-src 'self' ; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ;
//       font-src 'self' https://fonts.gstatic.com data: ; img-src 'self' data: blob: ;
//       frame-ancestors 'self' ; base-uri 'self' ; form-action 'self' ; object-src 'none'
// NOTE: img-src deliberately has NO https: — every image is self-hosted.
export default {
  output: "standalone",
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: true,
  poweredByHeader: false,          // kills X-Powered-By
  async headers() { /* "/:path*"  → baseHeaders + CSP
                       "/api/:path*" → X-Robots-Tag: noindex, nofollow */ },
};
```

### 6.2 `prisma/schema.prisma`
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }

model User { id String @id @default(cuid()); email String @unique; name String?; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model Post { id String @id @default(cuid()); title String; content String?; published Boolean @default(false); authorId String; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }
model ContactMessage {
  id        String   @id @default(uuid())
  name      String
  phone     String   // stored as E.164 +201XXXXXXXXX
  email     String?
  service   String?
  message   String
  lang      String   @default("ar")
  handled   Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### 6.3 `.env`
```
# SQLite path is relative to prisma/schema.prisma → resolves to <root>/db/custom.db
DATABASE_URL=file:../db/custom.db
# Optional (email notifications): GMAIL_USER, GMAIL_APP_PASSWORD, CONTACT_NOTIFY_EMAIL
```

### 6.4 `public/robots.txt`
```
User-agent: *
Allow: /
Disallow: /api/
```

### 6.5 `public/.well-known/security.txt` (RFC 9116)
```
Contact: mailto:office2024main@gmail.com
Expires: 2027-08-28T00:00:00.000Z
Preferred-Languages: ar, en
```

### 6.6 Caddyfile (production gateway)
Terminates TLS, reverse-proxies to `127.0.0.1:3000`. HSTS is already sent by the app. Do NOT
route through any proxy that rewrites the `Host` header — the origin guard (§12.1) depends on
Origin↔Host equality.


---

## 7. Content layer (`src/lib/site-content.ts`)

Single source of truth for ALL copy (~1600 lines). Shape:

1. **`CONTACT`** (immutable facts): `nameAr`/`nameEn`; partners `ashraf` and `khaled`, each with
   `nameAr/nameEn/display/tel/whatsapp`; `email: office2024main@gmail.com`; bilingual addresses
   (`addressAr/addressAr2/addressShortAr`, `addressEn/addressEn2/addressShortEn`); `mapsUrl`
   (Google Maps search: "5 Victor Emmanuel Street Mustafa Kamel Alexandria Egypt").
2. **`ETA`** (official Egyptian Tax Authority HTTPS URLs — all hardcoded, SSRF-safe):
   home / news / VAT laws / income laws / periodic books / e-invoice inquiry, each `ar` + `en`.
3. **Constants + hardened tax engines** (bounded, validated, loop-capped):
   - `OFFICE_ESTABLISHED_YEAR = 2003`, `getOfficeExperienceYears()` → dynamic "+N years"
     claims that self-update every year.
   - `DELAY_FINE_RATES`, `DELAY_FINE_START_MONTH_DAY`, `computeDelayFine(entries[], paymentDate)`
     — multi-entry, monthly 2% fines not exceeding the principal, cap on months/floors. Test
     vector: `49,800 / 2020` → **43,907 EGP**.
   - `VAT_FINE_MONTHLY_RATE`, `VAT_FINE_CAP_MONTHS`, `CORPORATE_TAX_RATE`,
     `MAX_CALCULATION_AMOUNT`.
   - `computeIncomeTax(annual, year)` + `computePersonalIncomeTax(...)` — progressive brackets,
     `Math.min(annual, MAX_CALCULATION_AMOUNT)`, non-finite/≤0 → 0.
   - **Parity vectors:** income 500,000 individual → tax **99,750**, net **400,250**; payroll
     7,000 → net **6,107**, tax **1,476**, insurance **770**; VAT fine (5,000 @ 2016-09-01 →
     paid 2021-05-07) → **2,700 + 4,800 = 7,500**.
4. **`content: Record<Lang, Content>`** — complete AR+EN copy tree. Top-level keys:
   `nav, hero, trustbar, services, why, process, journey, about, testimonials, insights, faq,
   contact, footer, offerPopup, calc (payroll, income, vat, vatFine, delayFine, etaPanel), meta`.
   `export type Content` = shape of `content.ar`.

Arabic copy must use correct Egyptian terminology (e.g. "الفاتورة الإلكترونية والإيصال الإلكتروني",
never "المستمركة"). EN brand: "Ashraf & Khaled Accounting Office".

---

## 8. App shell

### 8.1 `src/app/layout.tsx` (server component)
- `metadata`: bilingual title, description, keywords, authors, `openGraph` (type website,
  locale ar_EG), `robots { index: true, follow: true }`.
- `viewport`: `themeColor` light `#f4f4f5` / dark `#101215`, `width: device-width`.
- `<html lang="ar" dir="rtl" suppressHydrationWarning>` →
  `<body className="antialiased bg-background text-foreground">`.
- CDN font preconnects + stylesheet link (§4.2).
- JSON-LD `<script type="application/ld+json" dangerouslySetInnerHTML>` with `JSON.stringify(jsonLd)`
  (`AccountingService`; foundingDate 2003; address 5 Victor Emmanuel St, Mustafa Kamel, Egypt;
  telephones; email; areaServed EG; priceRange "$$"). Keys are dev-controlled constants — keep it that way.
- `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>` +
  `<Toaster position="top-center" richColors closeButton />`.

### 8.2 `src/app/page.tsx` (client) — the only page. Composition order:
```
export default function Home() {
  return (
    <LangProvider>
      <div className="relative min-h-screen bg-background text-foreground">
        <Topbar /> <Header />
        <main id="main-content">
          <Hero /> <Trustbar /> <Services /> <Calculators /> <EtaPanel />
          <Why /> <Process /> <Journey /> <About /> <Testimonials /> <Insights />
          <Faq /> <CtaBanner /> <Contact />
        </main>
        <Footer /> <StickyCta /> <BackToTop /> <OfferPopup />
      </div>
    </LangProvider>
  );
}
```

### 8.3 `src/components/site/lang-provider.tsx`
`Lang = "ar" | "en"`, `Dir = "rtl" | "ltr"`. Context exposes `lang, dir, setLang, toggle`.
Resolution order on mount: URL `?lang=` → `localStorage["mk-lang"]` → system language
(`navigator.languages` starts with "ar"). `persistLanguage` writes localStorage + `?lang=` via
`history.replaceState`. Effects keep `<html lang/dir>` in sync. SSR-safe: initial `"ar"`, all
browser reads happen in `useEffect`. Throw if `useLang()` used outside provider.


---

## 9. Site components — exports, roles, behaviors

All site components are `"use client"`, import `useLang()` + `content[lang].<section>`.

### 9.1 `primitives.tsx`
`DirArrow` (LTR→arrow-right, RTL→arrow-left), `ExtArrow` (external ↗/↖), `Reveal` (motion wrapper,
§4.4), `Eyebrow` (rule + square + label), `SectionHead` (align `split` | `center`, `light`
variant, hairline top border, Reveal-driven), and `btnBase`/`btnPrimary`/`btnWhite`/`btnGold`/
`btnOutline`/`btnGhostOnDark`.

### 9.2 `logo.tsx`
`Logo` (wordmark per lang) and `LogoMark` — circular badge, gold ring, deep-green background,
`<img src="/office-logo-latest.png" width={48} height={48} alt="AK Logo" draggable={false}>`
with `object-cover`, square ratio via wrapper size classes. Never `object-contain`.

### 9.3 `chrome.tsx` — Topbar / Header / Footer / BackToTop / StickyCta
- **Topbar** (hidden until `md`): `LocalTime` live clock (greeting per lang + time, 60s interval),
  address + maps link, both partners' `tel:` links.
- **Header**: sticky + opaque; brand `Logo`; nav anchors (#services, #tools, #why, #about,
  #contact…); **AR/EN toggle**; **theme toggle** (Moon/Sun); scroll **progress bar** (cobalt→brass
  2px via `useScroll`/`useSpring`); mobile menu with *numbered* rows; squared controls; gold
  `#contact` CTA in dock.
- **Footer**: deep-green ink background; brand + short about; service links; contact column with
  address + plus-code chip → `mapsUrl`; bottom bar "© 2026 — جميع الحقوق محفوظة"; `rule-gold`
  hairline.
- **BackToTop**: squared button, appears after scrolling down, smooth-scrolls to `#top`.
- **StickyCta**: floating dock — WhatsApp (muted teal `#128c7e`) + gold "Book Now" → `#contact`.

### 9.4 `hero.tsx` — Hero + Trustbar
Light paper canvas. `Eyebrow` (bilingual), headline (`.hero-arabic-title` for AR), copy, two CTAs
(`btnPrimary` gold + `btnOutline`), a **mono metrics band** between hairlines with dynamic
"+23 سنوات / years" (from `getOfficeExperienceYears()`) and live stats, a white "client statement"
card (replaces the old glass dashboard), bilingual ETA-compliance line. `Trustbar` — slim strip of
certification/membership chips.

### 9.5 `services.tsx` — Services
Bordered card grid from `services.items` (icon, title, desc, links). Squared icon tiles, hairline
boxes, "Discuss" link per card with `DirArrow`.

### 9.6 `tools.tsx` — Calculators → see §10.

### 9.7 `eta-panel.tsx` — EtaPanel
Deep-green panel, gold top hairline (`.rule-gold`), bilingual ETA compliance checklist + external
law links (from `ETA` constants), and a **live ETA news list** fetched client-side from
`/api/eta-news?lang=…`. Every rendered URL passes `isSafeEtaUrl()` (must be
`https://www.eta.gov.eg/…`) — defense in depth against upstream tampering. Graceful degradation
when `live:false` (offline message, never crash).

### 9.8 `why.tsx` — Why + Process + Journey
- **Why**: two columns. Left `bg-deep-2` card with the **growth chart** (below), centered
  `LogoMark` overlay, years badge. Right: Eyebrow + title + copy + benefits list (hairline
  start-bars, gold `b.n` numbering).
  **Growth chart markup (recreate exactly):** 9 bars `[46,78,58,92,66,84,40,72,55]` inside a
  `flex h-44 sm:h-52 items-end justify-center gap-2.5` container, `aria-hidden`. Each bar =
  full-height track `<span className="absolute inset-0 rounded-t-[4px] bg-cream/[0.06]" />` +
  rising fill `<span className="bar-rise relative flex w-full flex-col" style={{height:"${h}%",
  animationDelay:"${i*0.12}s"}}>` containing a gold-metallic cap
  (`h-1.5 rounded-t-[4px] bg-gold-metallic`; emphasized `i%3===0` →
  `shadow-[0_0_16px_rgba(200,147,14,0.5)]`, others `opacity-70`) and a gradient body
  (`bg-gradient-to-b from-gold/45 via-gold/15 to-transparent` for emph; dimmer
  `from-gold/20 via-gold/[0.07] to-transparent` otherwise). Bottom hairline `bg-cream/15`.
  **Do NOT reintroduce the old dead `animation-delay` with no animation.**
- **Process**: 4 steps, SectionHead center, dashed connectors, squared deep-green number nodes.
- **Journey**: vertical timeline, alternating sides (even → `sm:ms-auto`, odd → reversed with
  `sm:flex-row-reverse`), mono numbered nodes, hover highlight, mileage tags.


### 9.9 `about.tsx` — About
Split layout: aside card with `LogoMark`, dynamic "23 عامًا / years" experience, office facts
(partners, ETA-registered), main copy + values; mono numbered fact tiles.

### 9.10 `proof.tsx` — Testimonials + Insights
- **Testimonials**: star ratings (`lucide Star`), quote cards in hairline boxes.
- **Insights**: article cards (title, category, date, read time) with external-article links —
  `rel="noopener noreferrer"` on every external link; `ExtArrow`.

### 9.11 `faq.tsx` — Faq
Accordion (radix `Accordion`), bilingual Q&A from `faq.items`; one-sided-open behavior, rotate
chevron, hairline dividers.

### 9.12 `contact.tsx` — CtaBanner + Contact
- **CtaBanner**: deep-green band, gold rule, headline + CTA → `#contact`.
- **Contact** (`ContactSection` then `export const Contact = ContactSection`):
  - **Right column:** numbered contact cards `01` call (both partners, tel + WhatsApp), `02`
    email, `03` office (address + plus-code chip + maps link). Dark deep-green background.
  - **Left column — the form:** `name`, `phone` (Egyptian), `email` (optional), `service`
    (select of services), `message`, hidden `lang`, and a **hidden honeypot `website` input**
    (offscreen, `aria-hidden`, `tabIndex -1` — must be present in the DOM).
  - Client behavior: validate before submit (bilingual inline errors, `role="alert"`,
    `aria-invalid` on phone), Egyptian phone check (invalid → hint
    "أدخل رقم موبايل مصري صحيح، مثال: +20 100 123 4567"), `loading` state, success state with id,
    429 "too_many_requests" error, unknown-error state, privacy badges ("بياناتك تُعامل بسرية /
    Your details stay private" + "بيانات آمنة وسرية / Private and secure" with `ShieldCheck`),
    gold required asterisks, taller `h-12` inputs, gold `h-14` submit (`Send` icon, hover lift),
    footer trust row ("رد خلال يوم عمل / بيانات آمنة وسرية").
  - POSTs `application/json` to `/api/contact`.

### 9.13 `offer-popup.tsx` — OfferPopup
Fixed bottom-corner card (`max-w-360px`, `end-4 bottom-4`; flips for RTL). Gold top edge,
BadgePercent tile, clock badge, headline, copy, stacked CTA (gold → `#contact`) + WhatsApp
(green icon). **Timing (owner-mandated):** first show 4s after load; on ANY dismissal
(X/Esc/CTA) re-appears after **exactly 10s** — persistent by design. **Smart suppression:**
`IntersectionObserver` (threshold 0.25) on `#contact` hides it while contact is on screen;
retries every 10s until the user scrolls away. a11y: `role="dialog"`, `aria-live="polite"`,
`aria-label`, Escape closes, focus-visible outlines. **Critical z-index regression trap:** the
close button MUST carry `z-10` (+ `before:-inset-2` 48px touch target) to paint ABOVE the content
row — a prior bug made it unclickable when a sibling positioned content div painted over it.


---

## 10. Calculators (`tools.tsx` — `Calculators`)

Four (4) tabs: `type ToolKey = "payroll" | "income" | "vatFine" | "delayFine"`. All bilingual,
fully client-side, `tabular-nums`, no network. Reusable `Segmented` pills, `DateField`, numeric
inputs, add/remove/clear entry chips, bracket tables, and a shared bilingual results-band style.
Entry row ids via `crypto.randomUUID()`.

| Tab | Inputs | Outputs |
|---|---|---|
| **payroll** | gross salary | insurance (clamped), income tax, net — vector: 7,000 → 1,476 / 770 / 6,107 |
| **income** | annual amount, entity type | progressive bracket table + total tax + net — vector: 500,000 individual → 99,750 / 400,250; corporate uses `CORPORATE_TAX_RATE` |
| **vatFine** | base amount, VAT-fine start date, payment date | monthly-rate fine capped at `VAT_FINE_CAP_MONTHS` — vector (5,000 @ 2016-09-01 → 2021-05-07): 2,700 + 4,800 = 7,500 |
| **delayFine** | (year, amount) entries + payment date | per-entry and total delay fine — vector: 49,800 / 2020 → 43,907 |

Guardrails: all engines bounded (`MAX_CALCULATION_AMOUNT`), loop caps, empty/invalid input →
empty result (never `NaN`, never crash). Regulatory links point to official ETA pages.

---

## 11. API routes

### 11.1 `POST /api/contact` (`src/app/api/contact/route.ts`)
Processing order (each step returns a typed JSON error; ALL responses carry no-store headers):
1. **Origin guard** (`assertSameOrigin`) → 403 `CROSS_ORIGIN_BLOCKED` (warn-logged). Runs FIRST,
   before body read or rate limiting (hostile traffic never costs a rate bucket).
2. **Rate limit** — 5 req / 60 s per client key → 429 `RATE_LIMIT_EXCEEDED` + `Retry-After`.
3. **Content-Length pre-check** — > `MAX_BODY_BYTES` (10,000 chars × 4 bytes) → 413.
4. **Streamed body read with hard byte cap** (`reader.read`, `reader.cancel()` on exceed) → 413;
   then 10k-char cap after decode.
5. **`JSON.parse`** → 400 `INVALID_JSON` on failure.
6. **Honeypot** — non-empty `website` → fake success `{ok:true,data:{id:crypto.randomUUID()}}`,
   **no DB write** (UUID-shaped id, not a predictable constant).
7. **Zod validation** (`contactSchema`) → 400 `VALIDATION_FAILED`, first issue:
   - `name` 2–120, rejects `< > " ' ; = ( )` and all control chars
   - `phone` 7–25, charset `[+\d\s()-]`
   - `email` optional (valid email or `""` → stored `null`)
   - `service` optional ≤120, no control chars
   - `message` 5–2000, allows only `\n` among control chars
   - `lang` enum `ar|en`, default `ar`; `z.object` strips unknown keys (blocks `__proto__`
     mass-assignment).
8. **Egyptian phone normalization** (`normalizeEgyptianPhone`) → invalid → 400 `INVALID_PHONE`;
   stored E.164 `+201XXXXXXXXX`, `display` `+20 1XX XXX XXXX`, `carrier` detected.
9. **DB save** `db.contactMessage.create` → 200 `{ok:true,data:{id}}`; exceptions → 500
   `DATABASE_ERROR` (generic message, no stack trace).
10. **Async email** `sendContactNotification(...).catch(logger.error)` — non-blocking, never
    delays the response.

`GET /api/contact` → 200 `{ok:true,message:"…Contact API v2.0"}` liveness.
Headers on every response: `Cache-Control: no-store, no-cache, must-revalidate`,
`Pragma: no-cache`.


### 11.2 `GET /api/eta-news` (`src/app/api/eta-news/route.ts`)
- Rate limit 10/60s per client key → 429 + `Retry-After`.
- `?lang=` strictly `ar|en` (anything else → `ar`).
- **SSRF-safe:** hardcoded allowlist `{ar,en}` → `https://www.eta.gov.eg/{ar,en}/news`; every
  redirect is revalidated against the allowlist before following.
- Fetch: 8s timeout, 2 MB stream byte cap (abort → null), `cache:"no-store"`.
- Parse: anchored card regex (aria-label + slug + `<time datetime>`); slug whitelist
  `[a-z0-9-]{1,120}`; titles stripped of tags + HTML entities, ≤200 chars; dates validated ISO;
  dedupe by slug; max 6 items. Item URLs built only from validated slug + allowlisted host.
- In-memory cache 30 min per lang. Upstream failure → **200** `{ok:true,live:false,items:[]}`
  (graceful degradation — never a 5xx for the visitor).
- All responses no-store.

---

## 12. Security library layer (`src/lib/`)

### 12.1 `origin-guard.ts` — CSRF defense-in-depth
`assertSameOrigin(request): NextResponse | null`:
1. `Sec-Fetch-Site` = `cross-site` → **403** `{code:"CROSS_ORIGIN_BLOCKED"}`.
2. `Sec-Fetch-Site` = `same-site` → allowed ONLY if `Origin` host === request `Host` header —
   blocks sibling-subdomain cross-origin attacks.
3. Fallback: if `Origin` present (non-`null`), its host must exactly equal `Host`; then if
   `Referer` present, its host must equal `Host`. URL parse failures / `null` origins are hostile.
4. No Fetch-Metadata AND no Origin/Referer → non-browser client (curl, monitoring) → allowed.
403 responses also carry the no-store headers. Wire at the TOP of every state-changing route.

### 12.2 `rate-limit.ts`
In-memory sliding-window. Bounds: `MAX_BUCKETS=10,000` (oldest-FIFO eviction),
`MAX_KEY_LENGTH=64` (sanitized `[^\w.:-]` stripped), `MAX_TIMESTAMPS_PER_BUCKET=500`, stale-sweep
every 60s, `limit` clamped ≤1000, `windowMs` clamped ≤1h. `getClientKey(request)`: first hop of
`x-forwarded-for` → `x-real-ip` → `"unknown"`. Inputs validated (bad args → fail-safe
`success:false`).

### 12.3 `logger.ts`
Structured JSON console logs `{timestamp,level,module,action,message,metadata,error}`. **PII
redaction:** exact keys (phone, email, name, password, token, message, authorization, fullname,
full_name, first_name, last_name, username, e164, address, ip, client_ip, clientkey, client_key,
cookie, secret, api_key, apikey, bearer, credential, display) + substring catch-alls (phone,
email, token, secret, password, authorization, cookie, e164, address) → `[REDACTED]`. Recurses
into nested metadata objects; `Error` → `{name,message,stack}`. `info`/`debug` skipped in
test/prod respectively.

### 12.4 `mail.ts`
`sendContactNotification(payload): Promise<boolean>`. Gmail SMTP 465; timeouts
10s/10s/15s. Skips silently when `GMAIL_USER`/`GMAIL_APP_PASSWORD` absent. `escapeHtml` every
field into the HTML template; `sanitizeHeader` strips CRLF/control chars from Subject/From (SMTP
header injection). Bilingual AR/EN template, mail header `Cache-Control: no-store`, failure →
logged + `false` (never throws).

### 12.5 `phone.ts`
`normalizeEgyptianPhone(raw)` → `{e164, display, carrier}` or `null`. Egyptian mobile only
(`010/011/012/015`): strip non-digits, handle `+20` / `0020` / leading `0` / bare `1`, must match
`^01[0125]\d{8}$`, assert 13-char `+201` invariant. Carrier map: 010 vodafone, 011 etisalat,
012 orange, 015 we.

### 12.6 `db.ts`
Prisma singleton (global cache for dev/HMR); **`log: ['error','warn']` only** — contact PII must
never hit a plaintext query log. Resolves `file:` SQLite URLs to absolute `<cwd>/prisma/<path>`
so dev, scripts and the standalone server all open `<root>/db/custom.db` reliably (Windows fix).

### 12.7 `errors.ts`
`AppError` base (code, statusCode, context, timestamp) + `ValidationError` (400),
`RateLimitError` (429, retryAfterSec), `UpstreamError` (502), `PayloadTooLargeError` (413).

### 12.8 `utils.ts`
`cn(...)` = `twMerge(clsx(...))`.


---

## 13. Behavior checklist (regression traps)

- Language/theme toggles work without page reload; `<html dir>` flips correctly.
- Mobile (390px) never overflows horizontally.
- Homepage renders all 14 sections + popup; anchors (`#contact` etc.) land correctly thanks to
  `scroll-margin-top`.
- ETA news: real ETA items when live; graceful offline panel otherwise; every link is
  `https://www.eta.gov.eg/…`.
- Calculators: all 4 tabs match the §10 parity vectors; clearing inputs shows an empty result,
  never `NaN`.
- Contact form: valid → success + DB row `+20…`; invalid/foreign phone → inline error; honeypot →
  fake success without DB write; 6th rapid submit → 429; >10k chars → 400; malformed JSON → 400;
  cross-origin POST → 403.
- OfferPopup behavior per §9.13 (4s first show, 10s re-show, hide on contact section, Escape
  closes, close button clickable with 48px touch target).
- All decorative overlays `pointer-events-none`; all external links
  `rel="noopener noreferrer"`.

---

## 14. Build, run & environment notes

```bash
# Install & init DB
bun install
bun run db:push                 # creates prisma client + db/custom.db

# Dev (loopback only; the dev script pipes to dev.log)
bun run dev                     # → http://127.0.0.1:3000

# Quality gates
bun run lint                    # eslint . → 0 errors (allow the 1 known warning:
                                #   no-page-custom-font — intentional CDN-font decision)
tsc --noEmit                    # 0 errors
# On this Windows machine: `npx tsc` resolves a bogus stub; use
# `.\node_modules\.bin\tsc.exe --noEmit` instead.

# Production build + standalone run
bun run build                   # standalone output; static + public copied in
bun run start                   # NODE_ENV=production .next/standalone/server.js
```

**Environment quirks to preserve:**
- The `bun` on PATH at `AppData\Local\Kiro-Cli\bun` is a broken extensionless PE shim (prints
  nothing, no-ops in pipelines). **Use `npx -y bun <cmd>`** for package/script operations.
- PowerShell 5.1: no `Get-Content -Raw`; huge curl outputs can crash PSReadLine — prefer small
  header-only commands.
- Dev server binds `127.0.0.1` only; production goes through Caddy (TLS). Caddy must preserve the
  `Host` header (origin guard depends on Origin↔Host equality).
- Never relax fetch timeouts/byte caps in eta-news; never enable query logging in db.ts.

---

## 15. Acceptance verification (run after rebuild)

1. `bun run lint` → 0 errors; `tsc --noEmit` → exit 0.
2. `GET /` → 200; headers include CSP with `img-src 'self' data: blob:` (NO `https:`),
   `nosniff`, `X-Frame-Options`, HSTS, COOP/CORP, Referrer-Policy, Permissions-Policy, and **no
   `X-Powered-By`**.
3. `GET /api/*` → response includes `X-Robots-Tag: noindex, nofollow` + no-store.
4. `GET /.well-known/security.txt` → 200 `text/plain` (Contact / Expires / Preferred-Languages).
5. `GET /robots.txt` → `Disallow: /api/`.
6. POST matrix against `/api/contact`:
   - `Origin: https://evil.example` → 403 `CROSS_ORIGIN_BLOCKED`
   - `Sec-Fetch-Site: cross-site` → 403
   - `Sec-Fetch-Site: same-site` + mismatched Origin host → 403
   - browser-like same-origin valid payload → 200 + DB row (`+201XXXXXXXXX`)
   - same-origin + `website:"bot"` → 200 fake UUID, **no DB row**
   - 6th rapid request → 429 + `Retry-After`
   - malformed JSON → 400 `INVALID_JSON`; oversized → 413; bad phone → 400 `INVALID_PHONE`.
7. `GET /api/eta-news?lang=ar|en` → 200 with ≤6 items or `live:false`; 11th request → 429.
8. Page: AR default + EN toggle; `dir` flips; all 14 sections + popup present; 390px no overflow;
   0 console/page errors.
9. Calculators parity (§10 vectors) — all four tabs.
10. Clean up any test rows from `ContactMessage` after verification.

---

## 16. Known posture & next step (do not regress)

- **Already done (2026-08-28):** `poweredByHeader:false`, `img-src` locked to self/data/blob,
  production font-origin CSP bug fixed, `X-Robots-Tag` on APIs, origin guard on the contact POST,
  `security.txt` published, logger PII redaction broadened, 4 unused deps removed, aria-hidden
  growth chart rebuilt.
- **Remaining big-ticket hardening (future):** (a) nonce-based CSP to drop `'unsafe-inline'`;
  (b) `COEP: credentialless` once fonts are self-hosted (currently it would block the cross-origin
  Google Fonts stylesheet); (c) HSTS `preload` eligibility at the Caddy/TLS layer;
  (d) optional `Canonical` in security.txt once the production domain is fixed.
- **Do not add:** cookie-based sessions (site is stateless), client-side DB access, external
  images, or unvalidated `dangerouslySetInnerHTML`.

*Rebuild complete when every item in §15 passes.*
