"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import zh from "@/i18n/locales/zh.json";
import en from "@/i18n/locales/en.json";

type Locale = "zh" | "en";
type Translations = typeof zh; // both have same shape

const locales: Record<Locale, Translations> = { zh, en };

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "zh",
  t: zh,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    // Auto-detect from browser, fall back to zh
    const saved = localStorage.getItem("tokenscope-locale") as Locale | null;
    if (saved && locales[saved]) {
      setLocaleState(saved);
    } else {
      const browser = navigator.language.startsWith("zh") ? "zh" : "en";
      setLocaleState(browser);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("tokenscope-locale", l);
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t: locales[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
