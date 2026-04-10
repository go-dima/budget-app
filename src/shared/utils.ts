/** Comparator for descending date sort on objects with a `date: string` (YYYY-MM-DD) field. */
export function byDateDesc<T extends { date: string }>(a: T, b: T): number {
  return b.date.localeCompare(a.date);
}
