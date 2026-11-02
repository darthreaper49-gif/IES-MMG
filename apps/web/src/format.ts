import { type Locale } from './i18n';
export function formatTime(value: string | null | undefined, locale: Locale, full = false) {
  if (!value) return '—';
  const normalized = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`;
  return (
    new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
      timeZone: 'UTC',
      ...(full ? ({ day: '2-digit', month: 'short' } as const) : {}),
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(normalized)) + ' UTC'
  );
}
