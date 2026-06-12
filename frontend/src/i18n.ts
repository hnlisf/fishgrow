import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { routing, type Locale } from './i18n/routing';

/**
 * Locale resolution priority:
 *   1. URL path prefix (set by next-intl middleware) — this is the primary driver
 *   2. Cookie 'locale' (set by the language switcher as a fallback for analytics)
 *   3. Default locale (zh)
 *
 * Note: the URL prefix is the source of truth. The cookie is only used for
 * legacy paths or non-localized routes. next-intl middleware handles the URL
 * prefix detection and sets the request locale transparently.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is set by the next-intl middleware to the locale from the URL
  const requested = await requestLocale;
  let locale: string = requested ?? defaultLocale();
  if (!routing.locales.includes(locale as Locale)) {
    // Fallback: read from cookie (only if URL didn't set one)
    const cookieStore = cookies();
    const cookieLocale = cookieStore.get('locale')?.value;
    locale = cookieLocale && routing.locales.includes(cookieLocale as Locale)
      ? cookieLocale
      : routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

function defaultLocale(): string {
  return routing.defaultLocale;
}
