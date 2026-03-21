/** URL to view transactions filtered by a specific category (temp filter). */
export function txnsByCategoryUrl(categoryId: string): string {
  return `/transactions?categoryIds=${categoryId}`;
}
