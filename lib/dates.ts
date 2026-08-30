export function daysRemainingUntil(expiry: Date): number {
  return Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function formatDateSw(date: Date): string {
  return new Intl.DateTimeFormat("sw-TZ", { dateStyle: "long" }).format(date);
}

export function getAge(dob: Date): number {
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

/** Compact relative timestamp for conversation-list rows. */
export function formatRelativeSw(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "sasa hivi";
  if (minutes < 60) return `dakika ${minutes}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `saa ${hours}`;
  return new Intl.DateTimeFormat("sw-TZ", { day: "numeric", month: "short" }).format(date);
}
