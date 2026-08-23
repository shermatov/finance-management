import i18n from "@/i18n";

const INTL_LOCALES: Record<string, string> = {
  en: "en-US",
  ru: "ru-RU",
  ky: "ky-KG",
};

export function currentLocale(): string {
  return INTL_LOCALES[i18n.language] ?? "en-US";
}

export function formatCurrency(amount: number | string, currency = "USD"): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(currentLocale(), { style: "currency", currency }).format(value);
}

export function formatNumber(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(currentLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(currentLocale(), { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}
