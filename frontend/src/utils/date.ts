export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatMonthYear(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
  });
}

export function formatPeriod(period: string): string {
  // Handle YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
    });
  }
  // Return as-is for year or category
  return period;
}

export function getOneYearAgo(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function toTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function fromTimestamp(timestamp: number): Date {
  return new Date(timestamp * 1000);
}
