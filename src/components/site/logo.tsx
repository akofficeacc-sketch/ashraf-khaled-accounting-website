"use client";

import * as React from "react";
import { useLang } from "./lang-provider";
import { cn } from "@/lib/utils";

/**
 * The office's real emblem (gold & silver "AK" monogram on dark),
 * tightly cropped and presented as a circular badge. The emblem's own
 * metallic rings provide the framing — we add only a hairline gold edge.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/50 bg-transparent shadow-none transition-transform duration-300",
        className
      )}
    >
      <img
        src="/office-logo-user.png"
        alt="AK Logo"
        width={48}
        height={48}
        draggable={false}
        className="block h-full w-full object-contain object-center"
      />
    </span>
  );
}

export function Logo({
  onDark = false,
  textClassName = "",
}: {
  onDark?: boolean;
  textClassName?: string;
}) {
  const { lang } = useLang();
  const sub = onDark ? "text-cream/70" : "text-muted-foreground";
  const main = onDark ? "text-cream" : "text-foreground";
  return (
    <a
      href="#top"
      aria-label={
        lang === "ar"
          ? "مكتب محاسبة أشرف منسي وخالد الصادق — الرئيسية"
          : "Ashraf & Khaled Accounting Office — home"
      }
      className="group flex shrink-0 items-center gap-2.5"
    >
      <LogoMark className="h-11 w-11 shrink-0 transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14" />
      <span className={`hidden flex-col leading-[1.15] min-[460px]:flex ${textClassName}`}>
        {lang === "ar" ? (
          <>
            <span className={`text-[10px] font-bold ${sub}`}>مكتب محاسبة</span>
            <span className={`text-[15.5px] font-black tracking-tight ${main}`}>أشرف منسي وخالد الصادق</span>
          </>
        ) : (
          <>
            <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${sub}`}>
              Accounting Office
            </span>
            <span className={`text-[15.5px] font-black tracking-tight ${main}`}>Ashraf &amp; Khaled</span>
          </>
        )}
      </span>
    </a>
  );
}
