/**
 * CSRF protection utilities
 * Handles CSRF token management for API requests
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Get CSRF token from storage
 */
export function getCsrfToken(): string | null {
  try {
    return sessionStorage.getItem(CSRF_TOKEN_KEY);
  } catch {
    // sessionStorage might not be available
    return null;
  }
}

/**
 * Store CSRF token
 */
export function setCsrfToken(token: string): void {
  try {
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  } catch {
    // sessionStorage might not be available, ignore
  }
}

/**
 * Clear CSRF token
 */
export function clearCsrfToken(): void {
  try {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Extract CSRF token from response headers
 * Backend should send CSRF token in X-CSRF-Token header
 */
export function extractCsrfTokenFromHeaders(headers: Record<string, string>): string | null {
  // Check various possible header names
  const possibleHeaders = [
    CSRF_HEADER_NAME,
    'X-CSRF-Token',
    'X-Csrf-Token',
    'csrf-token',
    'CSRF-Token',
  ];
  
  for (const headerName of possibleHeaders) {
    const token = headers[headerName];
    if (token) {
      return token;
    }
  }
  
  return null;
}

/**
 * Get CSRF token header name
 */
export function getCsrfHeaderName(): string {
  return CSRF_HEADER_NAME;
}

/**
 * Check if request method requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  return protectedMethods.includes(method.toUpperCase());
}

