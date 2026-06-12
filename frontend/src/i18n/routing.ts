import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['zh', 'en', 'ja'] as const,
  defaultLocale: 'zh',
  // 'as-needed' = default locale (zh) has no prefix; /en/... and /ja/... are prefixed
  localePrefix: 'as-needed',
  localeDetection: false, // we drive locale from cookie+URL, not browser headers
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
