// Minimal root layout — i18n-aware layout lives at app/[locale]/layout.tsx
// where the locale segment is known. We can't put <html>/<body> here because
// the locale is determined at the [locale] level.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
