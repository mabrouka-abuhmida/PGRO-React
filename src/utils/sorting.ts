/**
 * Utility functions for sorting arrays
 * Centralizes sorting logic to avoid duplication
 */

/**
 * Sorts an array of objects by created_at in descending order (newest first)
 * Handles null/undefined created_at values by placing them at the end
 */
export function sortByCreatedAtDesc<T extends { created_at?: string | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA; // Descending order (newest first)
  });
}

/**
 * Gets the most recent item from an array sorted by created_at
 */
export function getMostRecentByCreatedAt<T extends { created_at?: string | null }>(
  items: T[]
): T | null {
  if (items.length === 0) return null;
  const sorted = sortByCreatedAtDesc(items);
  return sorted[0];
}

