import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/routing';

// Redirect from the locale root (e.g. /, /en, /ja) to the tank page,
// preserving the current locale.
export default async function Home() {
  const locale = await getLocale();
  redirect({ href: '/tank', locale });
}
