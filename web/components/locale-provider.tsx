"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type Locale,
  type TranslationKey,
  detectLocale,
  getTranslation,
  localeConfig,
  localeFromPathname,
  supportedLocales,
} from "@/lib/i18n";

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const routeLocale = localeFromPathname(pathname);
  const [locale, setLocale] = useState<Locale>(routeLocale ?? "en");

  useEffect(() => {
    if (routeLocale) {
      setLocale(routeLocale);
      localStorage.setItem("locale", routeLocale);
      return;
    }
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && supportedLocales.includes(saved)) {
      setLocale(saved);
    } else {
      setLocale(detectLocale());
    }
  }, [routeLocale]);

  useEffect(() => {
    document.documentElement.lang = localeConfig[locale].htmlLang;
  }, [locale]);

  function handleSetLocale(newLocale: Locale) {
    setLocale(newLocale);
    localStorage.setItem("locale", newLocale);
  }

  function t(key: TranslationKey, params?: Record<string, string | number>) {
    return getTranslation(locale, key, params);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
