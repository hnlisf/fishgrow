'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter, usePathname, routing } from '@/i18n/routing';
import { useLocale } from './LocaleProvider';

/**
 * Header with locale switcher.
 * - Default locale (zh) keeps no URL prefix (/tank, /species, ...).
 * - Other locales (/en/tank, /ja/tank) use the next-intl URL prefix router.
 * - The switcher writes the locale cookie and navigates to the equivalent
 *   path under the new locale.
 */
export default function Header() {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: 'zh' | 'en' | 'ja') => {
    if (newLocale === locale) return;
    // Update cookie (for any code that still reads it) and React state
    setLocale(newLocale);
    // Navigate to the same path under the new locale prefix.
    // For default locale (zh), pathname is the bare path. For others,
    // pathname is already stripped of the prefix by next-intl's usePathname.
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <header className="bg-white/60 backdrop-blur-md border-b border-water-100 sticky top-0 z-30">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
        <Link href="/tank" className="flex items-center gap-2 group">
          <span className="text-2xl">🐟</span>
          <span className="text-lg font-semibold text-water-600 group-hover:text-coral-500 transition">
            {t('appName')}
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link className="px-3 py-1.5 rounded-full text-water-600 hover:bg-water-50" href="/tank">{t('nav.tank')}</Link>
          <Link className="px-3 py-1.5 rounded-full text-water-600 hover:bg-water-50" href="/species">{t('nav.species')}</Link>
          <Link className="px-3 py-1.5 rounded-full text-water-600 hover:bg-water-50" href="/reminders">{t('nav.reminders')}</Link>
          <Link className="px-3 py-1.5 rounded-full text-water-600 hover:bg-water-50" href="/weather">{t('nav.weather')}</Link>
          <div className="ml-2 flex items-center">
            <select
              value={locale}
              onChange={(e) => handleLocaleChange(e.target.value as 'zh' | 'en' | 'ja')}
              aria-label="Language"
              className="text-xs border border-water-200 rounded-full bg-white text-water-700 px-2.5 py-1.5 cursor-pointer hover:border-water-300 focus:outline-none focus:ring-2 focus:ring-water-300"
            >
              {routing.locales.map((l) => (
                <option key={l} value={l}>
                  {l === 'zh' ? '中文' : l === 'en' ? 'English' : '日本語'}
                </option>
              ))}
            </select>
          </div>
        </nav>
      </div>
    </header>
  );
}
