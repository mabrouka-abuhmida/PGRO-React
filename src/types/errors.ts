/**
 * Type definitions for API errors and error handling
 */
import { getUserFriendlyErrorMessage, sanitizeErrorMessage } from '@/utils/errorSanitization';

/**
 * Standard API error response structure
 */
export interface ApiError {
  response?: {
    data?: {
      detail?: string;
      message?: string;
      errors?: Record<string, string[]>;
    };
    status?: number;
    statusText?: string;
  };
  message?: string;
  code?: string;
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'message' in error)
  );
}

/**
 * Extract error message from an unknown error
 * Returns user-friendly, sanitized error messages
 */
export function getErrorMessage(error: unknown, defaultMessage = 'An unexpected error occurred. Please try again.'): string {
  // If error is already a user-friendly Error object (from our interceptor)
  if (error instanceof Error) {
    // Check if it's a user-friendly message (from our sanitization)
    const message = error.message;
    if (message && !message.includes('at ') && !message.includes('Error:')) {
      return message;
    }
  }
  
  // For API errors, return generic messages based on status
  if (isApiError(error)) {
    const status = error.response?.status;
    
    if (status) {
      // Return user-friendly message based on status
      return getUserFriendlyErrorMessage(status);
    }
    
    // If no status, sanitize the detail/message
    const detail = error.response?.data?.detail;
    const message = error.response?.data?.message;
    
    if (detail) {
      return sanitizeErrorMessage(detail);
    }
    
    if (message) {
      return sanitizeErrorMessage(message);
    }
  }
  
  // For generic Error objects, sanitize the message
  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message) || defaultMessage;
  }
  
  return defaultMessage;
}

