'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Locale } from '@/i18n/routing';

type LocaleCtxValue = {
  locale: Locale;
  /** Set the locale cookie and update in-memory state. The URL change is
   *  handled separately by the caller via next-intl's router.replace. */
  setLocale: (l: Locale) => void;
};

const LocaleCtx = createContext<LocaleCtxValue>({
  locale: 'zh',
  setLocale: () => {},
});

export function LocaleProvider({ locale, children }: { locale: string; children: ReactNode }) {
  const [cur, setCur] = useState<Locale>((locale as Locale) || 'zh');
  return (
    <LocaleCtx.Provider
      value={{
        locale: cur,
        setLocale: (l) => {
          setCur(l);
          // Cookie acts as a fallback for any non-localized route; the
          // authoritative locale is the URL prefix set by the next-intl
          // middleware.
          document.cookie = `locale=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
        },
      }}
    >
      {children}
    </LocaleCtx.Provider>
  );
}

export const useLocale = () => useContext(LocaleCtx);
