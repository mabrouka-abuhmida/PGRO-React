/**
 * Error sanitization utilities
 * Prevents information leakage by sanitizing error messages
 */

/**
 * Sanitize URL to remove sensitive information
 * Only keeps the path, removes query parameters and fragments
 */
export function sanitizeUrl(url: string | undefined): string {
  if (!url) return '[URL not available]';
  
  try {
    // Remove query parameters and fragments
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    // If URL parsing fails, return generic message
    return '[Invalid URL]';
  }
}

/**
 * Sanitize error message to prevent information leakage
 * Removes sensitive details like stack traces, file paths, etc.
 */
export function sanitizeErrorMessage(message: string | undefined | null): string {
  if (!message) return 'An error occurred';
  
  // Remove common sensitive patterns
  let sanitized = message
    // Remove file paths
    .replace(/\/[^\s]+\.(py|js|ts|tsx|jsx):\d+/g, '[file]')
    // Remove stack traces
    .replace(/at\s+[^\n]+/g, '')
    // Remove line numbers
    .replace(/line\s+\d+/gi, '[line]')
    // Remove IP addresses
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
    // Remove database connection strings
    .replace(/postgresql:\/\/[^\s]+/gi, '[database]')
    .replace(/mysql:\/\/[^\s]+/gi, '[database]')
    // Remove API keys patterns
    .replace(/[Aa][Pp][Ii][_\-]?[Kk][Ee][Yy][\s:=]+[^\s]+/gi, '[API_KEY]')
    // Remove tokens
    .replace(/token[\s:=]+[^\s]+/gi, '[TOKEN]')
    // Remove UUIDs (might be sensitive)
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[ID]')
    .trim();
  
  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200) + '...';
  }
  
  return sanitized || 'An error occurred';
}

/**
 * Get user-friendly error message based on status code
 */
export function getUserFriendlyErrorMessage(status: number | undefined): string {
  if (!status) return 'An unexpected error occurred. Please try again.';
  
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'You are not authorized to perform this action. Please log in.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with existing data. Please refresh and try again.';
    case 422:
      return 'The request could not be processed. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'A server error occurred. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Sanitize error for logging (keeps more details but still safe)
 */
export function sanitizeErrorForLogging(error: unknown): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };
  
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    
    // Safe to log: status codes
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      if (typeof response.status === 'number') {
        sanitized.status = response.status;
      }
    }
    
    // Safe to log: error codes
    if (typeof err.code === 'string') {
      sanitized.code = err.code;
    }
    
    // Sanitize message
    if (typeof err.message === 'string') {
      sanitized.message = sanitizeErrorMessage(err.message);
    }
  }
  
  return sanitized;
}

