/**
 * Utility functions for creating URL-friendly slugs
 */

/**
 * Creates a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function createSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Creates a slug for an interview record
 * Format: applicant-name-{short-uuid}
 * @param applicantName - The applicant's name
 * @param recordId - The interview record UUID
 * @returns A URL-friendly slug
 */
export function createInterviewRecordSlug(applicantName: string | undefined, recordId: string): string {
  const nameSlug = applicantName ? createSlug(applicantName) : 'interview';
  // Use first 8 characters of UUID for uniqueness
  const shortId = recordId.replace(/-/g, '').substring(0, 8);
  return `${nameSlug}-${shortId}`;
}

/**
 * Extracts the short UUID from a slug
 * @param slug - The slug to extract from
 * @returns The short UUID (8 characters) or null if not found
 */
export function extractShortIdFromSlug(slug: string): string | null {
  // Extract the last part after the final hyphen (should be 8 characters)
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  // Check if it looks like a short ID (8 alphanumeric characters)
  if (lastPart && /^[a-z0-9]{8}$/i.test(lastPart)) {
    return lastPart;
  }
  
  return null;
}

/**
 * Finds a record ID by matching the short ID from a slug
 * This is a fallback when location state is lost (e.g., on page refresh)
 * @param slug - The slug to extract short ID from
 * @param records - Array of interview records to search
 * @returns The full record ID if found, or null
 */
export function findRecordIdBySlug(slug: string, records: Array<{ id: string; applicant_name?: string }>): string | null {
  const shortId = extractShortIdFromSlug(slug);
  if (!shortId) return null;
  
  // Find record where the first 8 characters of UUID (without hyphens) match
  const record = records.find(r => {
    const recordShortId = r.id.replace(/-/g, '').substring(0, 8);
    return recordShortId.toLowerCase() === shortId.toLowerCase();
  });
  
  return record?.id || null;
}

/**
 * Creates a slug for a review record
 * Format: applicant-name-{short-uuid}
 * @param applicantName - The applicant's name
 * @param reviewId - The review UUID
 * @returns A URL-friendly slug
 */
export function createReviewRecordSlug(applicantName: string | undefined, reviewId: string): string {
  const nameSlug = applicantName ? createSlug(applicantName) : 'review';
  // Use first 8 characters of UUID for uniqueness
  const shortId = reviewId.replace(/-/g, '').substring(0, 8);
  return `${nameSlug}-${shortId}`;
}

/**
 * Finds a review record ID by matching the short ID from a slug
 * @param slug - The slug to extract short ID from
 * @param reviews - Array of review records to search
 * @returns The full review ID if found, or null
 */
export function findReviewIdBySlug(slug: string, reviews: Array<{ id: string; applicant_name?: string; applicant_name_review?: string }>): string | null {
  const shortId = extractShortIdFromSlug(slug);
  if (!shortId) return null;
  
  // Find review where the first 8 characters of UUID (without hyphens) match
  const review = reviews.find(r => {
    const reviewShortId = r.id.replace(/-/g, '').substring(0, 8);
    return reviewShortId.toLowerCase() === shortId.toLowerCase();
  });
  
  return review?.id || null;
}

/**
 * Creates a slug for an applicant
 * Format: applicant-name-{short-uuid}
 * @param applicantName - The applicant's name
 * @param applicantId - The applicant UUID
 * @returns A URL-friendly slug
 */
export function createApplicantSlug(applicantName: string | undefined, applicantId: string): string {
  const nameSlug = applicantName ? createSlug(applicantName) : 'applicant';
  // Use first 8 characters of UUID for uniqueness
  const shortId = applicantId.replace(/-/g, '').substring(0, 8);
  return `${nameSlug}-${shortId}`;
}

/**
 * Finds an applicant ID by matching the short ID from a slug
 * @param slug - The slug to extract short ID from
 * @param applicants - Array of applicants to search
 * @returns The full applicant ID if found, or null
 */
export function findApplicantIdBySlug(slug: string, applicants: Array<{ id: string; full_name?: string }>): string | null {
  const shortId = extractShortIdFromSlug(slug);
  if (!shortId) return null;
  
  // Find applicant where the first 8 characters of UUID (without hyphens) match
  const applicant = applicants.find(a => {
    const applicantShortId = a.id.replace(/-/g, '').substring(0, 8);
    return applicantShortId.toLowerCase() === shortId.toLowerCase();
  });
  
  return applicant?.id || null;
}

