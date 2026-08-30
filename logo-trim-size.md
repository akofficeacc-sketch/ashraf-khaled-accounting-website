# Logo — Trim & Size Reference

Canonical source: `src/components/site/logo.tsx` (`LogoMark` + `Logo`).
Asset: `public/office-logo.jpeg` (referenced as `src="/office-logo.jpeg"`).

This document is the exact "trim + size" the brand uses today. Copy the rules below so the
same adjustment is applied to any other logo asset.

---

## 1. The Trim (the "look" of the mark)

The mark is a **tightly-cropped circular badge**. The image itself is cropped to a circle; the
golden ring is the *only* frame. No paper-like shadow on the base component (matches the
flattened/de-boxed aesthetic used across `hero`, `about`, `contact`, `eta-*`, `tools`).

Component (verbatim from `logo.tsx`):

```tsx
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-deep shadow-md transition-transform duration-300",
        className
      )}
    >
      <img
        src="/office-logo.jpeg"
        alt="AK Logo"
        width={48}
        height={48}
        draggable={false}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
```

Trim tokens (do NOT change these if replicating the reference look):

| Token | Value | Why |
|---|---|---|
| Shape | `rounded-full` | circular crop of the badge |
| Crop | `overflow-hidden` + inner img `object-cover` | `object-cover` fills the square, trimming excess from the artwork equally on all sides (centered crop) |
| Rim | `border border-gold/40` | 1px hairline gold edge — the brand trim |
| Fill | `bg-deep` | dark backing so any transparent logo edges read as part of the circle |
| Shadow | `shadow-md` (base only) | subtle depth; variants may add stronger shadow (see §4) |
| Aspect | 1:1 square (`w-11`/`h-11` etc.) → rendered as circle | keep aspect square, never stretch |

> The `width={48} height={48}` attrs set the intrinsic aspect/canvas; display size is
> controlled entirely by the `className` passed to `LogoMark` (see §2). `object-cover` makes
> the displayed size win regardless of the width/height attrs.

---

## 2. The Size Scale

`LogoMark` is **square**. Sizes are set by passing `className="h-N w-N"` (Tailwind `h-*`/`w-*`).
The inner `<img>` is `h-full w-full object-cover`, so it always fills.

| Size class | Rendered | Used in |
|---|---|---|
| `h-11 w-11` (44 × 44) | Header logo + mobile nav | `chrome.tsx:195` (`<Logo />`), `chrome.tsx:353`, `logo.tsx:52` (inside `Logo`) |
| `h-12 w-12` (48 × 48) | Hero mark | `hero.tsx:124` |
| `h-16 w-16` (64 × 64) | About / Why marks | `about.tsx:38`, `why.tsx:36` |

To place a mark at a given size:

```tsx
<LogoMark className="h-12 w-12" />   {/* 48 × 48 */}
```

---

## 3. Recipe for glm5.3 (apply the same trim + size to a new logo)

1. Put the new asset in `public/` (e.g. `public/new-logo.jpeg`).
2. Render via the shared `LogoMark` component — it already carries the trim tokens:

   ```tsx
   <LogoMark className="h-11 w-11" />
   ```

   This reuses the circular crop / gold rim / deep fill exactly. No new CSS needed.

3. If a brand-new component is required instead, mirror the two class strings verbatim:
   - wrapper `<span>`: `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-deep shadow-md transition-transform duration-300`
   - inner `<img>`: `h-full w-full object-cover`, `alt` set, `width={48} height={48}`, `draggable={false}`.
   Add the chosen size class to the wrapper (e.g. `h-12 w-12`).
4. Never change `object-cover` to `object-contain` — that un-trims the mark (leaves empty space
   inside the circle). Keep `object-cover` for the "tight crop" look.

---

## 4. Variant accents (optional, already in use)

Only `hero.tsx` and `why.tsx` add extra emphasis; the base `chrome.tsx`/`logo.tsx` `LogoMark`
stays flat.

```tsx
// hero.tsx:124
<LogoMark className="h-12 w-12 shadow-lg ring-2 ring-gold/40" />

// why.tsx:36
<LogoMark className="h-16 w-16 shadow-2xl ring-4 ring-gold/40 transition-transform hover:scale-105" />
```

---

## 5. Liquid-glass redesign (applied)

A "liquid glass" treatment was applied to `LogoMark` in `src/components/site/logo.tsx`.
Per instruction, the **background does NOT change between light and dark mode** — a single
`bg-deep/85` token is used (no `dark:` variant), so the backing color is identical in both
themes. The "glass" effect comes from the frosted translucency + glossy rim layered on top.

```tsx
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        // liquid glass, constant background across light/dark:
        //  - rounded-full + object-cover = circular crop ("trim")
        //  - border-2 border-gold/30 = thin gold rim
        //  - bg-white/15 (SINGLE token, no dark: variant -> constant in both themes)
        //  - backdrop-blur-xl = frosted glass behind
        //  - ring-2 ring-white/30 = glossy liquid highlight (visible)
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gold/30 bg-white/15 backdrop-blur-xl ring-2 ring-white/30 transition-transform duration-300",
        className
      )}
    >
      <img
        src="/office-logo.jpeg"
        alt="AK Logo"
        width={48}
        height={48}
        draggable={false}
        className="h-full w-full object-cover object-center"
      />
    </span>
  );
}
```

Diff vs. the previous (de-boxed) reference:
- wrapper: `border border-gold/40 bg-deep shadow-md` → `border-2 border-gold/30 bg-white/15 backdrop-blur-xl ring-2 ring-white/30`
  - slimmer, more opaque gold rim;
  - `bg-deep` → `bg-white/15` (translucent, so the blur shows — a single token with no `dark:` variant, so it is identical in light and dark mode);
  - added `backdrop-blur-xl` (glass frost) + `ring-2 ring-white/30` (visible glossy highlight).

> Applied to `src/components/site/logo.tsx`. Keep `object-cover` (do not switch to `object-contain`).
> Keep 1:1 sizing. View the live mark at `http://127.0.0.1:3000/` (header `Logo`).

---

## 6. Text pairing (for the full `Logo`, not just the mark)

`Logo` (`logo.tsx`) pairs the mark with text; document for full replication:

```tsx
<a href="#top" aria-label={...} className="group flex shrink-0 items-center gap-2.5">
  <LogoMark className="h-11 w-11 transition-transform duration-300 group-hover:scale-105" />
  <span className="flex flex-col leading-[1.15]">
    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Accounting Office</span>
    <span className="text-[15.5px] font-black tracking-tight text-foreground">Ashraf &amp; Khaled</span>
  </span>
</a>
```

- Mark + text gap: `gap-2.5` (10px).
- Sub-line: `10px / font-bold / tracking-[0.18em] / uppercase / text-muted-foreground`.
- Main-line: `15.5px / font-black / tracking-tight / text-foreground`.
