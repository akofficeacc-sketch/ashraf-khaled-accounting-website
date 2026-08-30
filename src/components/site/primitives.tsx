"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "./lang-provider";

/* ---------------------------------- arrows ---------------------------------- */

export function DirArrow({ className }: { className?: string }) {
  const { lang } = useLang();
  const Icon = lang === "ar" ? ArrowLeft : ArrowRight;
  return <Icon className={cn("h-4 w-4", className)} aria-hidden="true" />;
}

export function ExtArrow({ className }: { className?: string }) {
  const { lang } = useLang();
  const Icon = lang === "ar" ? ArrowUpLeft : ArrowUpRight;
  return <Icon className={cn("h-4 w-4", className)} aria-hidden="true" />;
}

/* ---------------------------------- reveal ---------------------------------- */

const variants: Record<string, Variants> = {
  up: {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: -28 },
    show: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 28 },
    show: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.985, y: 12 },
    show: { opacity: 1, scale: 1, y: 0 },
  },
};

export function Reveal({
  children,
  className,
  variant = "up",
  delay = 0,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof variants;
  delay?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={variants[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* --------------------------------- headings --------------------------------- */

/** Quiet bank-grade kicker: rule + rotated square marker + tracked label. */
export function Eyebrow({
  children,
  light = false,
  className,
}: {
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-3 text-[11px] font-semibold ltr:uppercase ltr:tracking-[0.22em] rtl:tracking-normal",
        light ? "text-[#f3d283]" : "text-primary",
        className
      )}
    >
      <span aria-hidden="true" className={cn("h-px w-8", light ? "bg-[#f3d283]/50" : "bg-primary/40")} />
      <span
        aria-hidden="true"
        className={cn("h-[5px] w-[5px] shrink-0 rotate-45", light ? "bg-[#f3d283]" : "bg-primary")}
      />
      {children}
    </p>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
  align = "split",
  light = false,
  className,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "split" | "center";
  light?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-t pt-8",
        light ? "border-white/15" : "border-border",
        align === "center"
          ? "flex flex-col items-center gap-5 text-center"
          : "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "flex flex-col items-center text-center")}>
        <Reveal>
          <Eyebrow light={light}>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={0.08}>
          <h2
            className={cn(
              "mt-5 text-3xl font-extrabold leading-[1.2] tracking-tight md:text-4xl",
              light ? "text-cream" : "text-foreground"
            )}
          >
            {title}
          </h2>
        </Reveal>
      </div>
      {sub ? (
        <Reveal delay={0.16}>
          <p
            className={cn(
              "max-w-md text-[15px] leading-8",
              light ? "text-cream/65" : "text-muted-foreground",
              align === "center" && "md:max-w-xl"
            )}
          >
            {sub}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}

/* ---------------------------------- buttons --------------------------------- */

export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-[4px] px-5 py-2.5 text-[13.5px] font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

export const btnPrimary = cn(
  btnBase,
  "bg-gold-metallic text-on-gold cta-gold-glow hover:brightness-105"
);

export const btnWhite = cn(btnBase, "bg-cream text-deep hover:bg-white");

export const btnGold = cn(
  btnBase,
  "bg-deep text-cream hover:bg-deep-3 dark:border dark:border-gold/40 dark:bg-[#174b38] dark:text-[#f1f4f6] dark:hover:bg-[#1d5b43]"
);

export const btnOutline = cn(btnBase, "border border-border bg-transparent text-foreground hover:border-foreground");

export const btnGhostOnDark = cn(
  btnBase,
  "border border-cream/30 bg-transparent text-cream hover:border-cream hover:text-cream"
);
