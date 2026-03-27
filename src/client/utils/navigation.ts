/** URL to view transactions filtered by a specific category (temp filter). */
export function txnsByCategoryUrl(categoryId: string): string {
  return `/transactions?categoryIds=${categoryId}`;
}

/** URL to view transactions filtered by a search term. */
export function txnsBySearchUrl(search: string): string {
  return `/transactions?search=${encodeURIComponent(search)}`;
}
