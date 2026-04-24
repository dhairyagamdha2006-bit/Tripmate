const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + DAY_MS * amount);
}

export function addHours(date: Date, amount: number) {
  return new Date(date.getTime() + amount * 60 * 60 * 1000);
}

export function differenceInNights(checkIn: Date, checkOut: Date) {
  return Math.max(1, Math.round((startOfDay(checkOut).getTime() - startOfDay(checkIn).getTime()) / DAY_MS));
}

export function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function formatDate(date: Date | string, locale = 'en-US') {
  const value = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(value);
}

export function formatDateLong(date: Date | string, locale = 'en-US') {
  const value = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(value);
}

export function formatDateTime(date: Date | string, locale = 'en-US') {
  const value = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export function formatDateTimeLong(date: Date | string, locale = 'en-US') {
  const value = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(value);
}

export function isPast(date: Date | string) {
  return new Date(date).getTime() < Date.now();
}
