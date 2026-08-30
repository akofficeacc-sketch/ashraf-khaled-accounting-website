"use client";

import * as React from "react";

export type Lang = "ar" | "en";
export type Dir = "rtl" | "ltr";

type LangContextValue = {
  lang: Lang;
  dir: Dir;
  setLang: (lang: Lang) => void;
  toggle: () => void;
};

const LangContext = React.createContext<LangContextValue | null>(null);

const STORAGE_KEY = "mk-lang";

function detectSystemLanguage(): Lang {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages.some((language) => language?.toLowerCase().startsWith("ar")) ? "ar" : "en";
}

function persistLanguage(next: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState({}, "", url.toString());
  } catch {}
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("ar");

  // On mount: URL ?lang= wins, then the visitor's saved choice, then their system language.
  React.useEffect(() => {
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang === "ar" || urlLang === "en") {
      try {
        localStorage.setItem(STORAGE_KEY, urlLang);
      } catch {}
      setLangState(urlLang);
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ar" || saved === "en") {
        setLangState(saved);
        return;
      }
    } catch {}
    setLangState(detectSystemLanguage());
  }, []);

  // Keep <html lang / dir> in sync.
  React.useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = React.useCallback((next: Lang) => {
    setLangState(next);
    persistLanguage(next);
  }, []);

  const toggle = React.useCallback(() => {
    setLang(lang === "ar" ? "en" : "ar");
  }, [lang, setLang]);

  const value = React.useMemo<LangContextValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      toggle,
    }),
    [lang, setLang, toggle]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = React.useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within a LangProvider");
  return ctx;
}
