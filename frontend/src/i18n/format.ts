const INTL_LOCALE: Record<string, string> = { fr: 'fr-FR', en: 'en-US' };

export function toIntlLocale(lng: string): string {
  return INTL_LOCALE[lng.split('-')[0]] ?? 'fr-FR';
}

export function formatDate(iso: string | Date, lng: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  try {
    return new Intl.DateTimeFormat(toIntlLocale(lng), opts ?? { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return typeof iso === 'string' ? iso : iso.toISOString();
  }
}

export function formatTime(d: Date, lng: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(lng), { hour: '2-digit', minute: '2-digit' }).format(d);
}

export function formatNumber(n: number, lng: string, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(toIntlLocale(lng), opts).format(n);
}

/** "1 200" / "1.2k" selon la langue — remplace un formatage manuel à virgule française. */
export function formatCompact(n: number, lng: string): string {
  return new Intl.NumberFormat(toIntlLocale(lng), { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** Initiales des jours de la semaine (lundi → dimanche), localisées via Intl. */
export function weekdayInitials(lng: string): string[] {
  const fmt = new Intl.DateTimeFormat(toIntlLocale(lng), { weekday: 'narrow' });
  // 2024-01-01 est un lundi — base stable pour dériver toute la semaine.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
}

export function formatMonthYear(d: Date, lng: string): string {
  const label = new Intl.DateTimeFormat(toIntlLocale(lng), { month: 'long', year: 'numeric' }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
