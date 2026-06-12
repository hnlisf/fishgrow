import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { cookies } from 'next/headers';
import './globals.css';
import Header from '@/components/Header';
import { LocaleProvider } from '@/components/LocaleProvider';

export const metadata: Metadata = {
  title: 'FishGrow - 鱼成长',
  description: 'Virtual fish pet game',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value ?? 'demo-user';

  return (
    <html lang={locale}>
      <body className="bg-water-gradient min-h-screen">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LocaleProvider locale={locale}>
            <Header />
            <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          </LocaleProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
