/**
 * Input sanitization utilities
 * Sanitizes user input to prevent XSS attacks
 */

/**
 * Escape HTML special characters
 * Converts potentially dangerous characters to their HTML entities
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitize text content for safe display
 * Removes or escapes potentially dangerous content
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Remove control chars except \n and \t

  // Limit length to prevent DoS
  const MAX_LENGTH = 100000; // 100KB of text
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + '... (truncated)';
  }

  return sanitized;
}

/**
 * Sanitize text for display in <pre> tags
 * Preserves whitespace but escapes HTML
 */
export function sanitizePreText(text: string | null | undefined): string {
  if (!text) return '';
  
  // First sanitize the text
  const sanitized = sanitizeText(text);
  
  // Then escape HTML (React will handle this, but we do it for extra safety)
  return escapeHtml(sanitized);
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  // Basic email validation and sanitization
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return '';
  }
  
  // Limit length
  if (trimmed.length > 254) {
    return trimmed.substring(0, 254);
  }
  
  return trimmed;
}

/**
 * Sanitize URL parameter
 * Validates and sanitizes URL parameters to prevent injection
 */
export function sanitizeUrlParam(param: string | null | undefined): string {
  if (!param) return '';
  
  // Remove dangerous characters
  let sanitized = param
    .replace(/[<>"']/g, '') // Remove HTML/script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
  
  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }
  
  return sanitized;
}

