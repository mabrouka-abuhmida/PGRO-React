/**
 * Base API client configuration
 */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { logger } from '@/utils/logger';
import { env } from '@/config/env';
import { getCsrfToken, setCsrfToken, extractCsrfTokenFromHeaders, getCsrfHeaderName, requiresCsrfProtection } from '@/utils/csrf';
import { sanitizeUrl, sanitizeErrorMessage, getUserFriendlyErrorMessage, sanitizeErrorForLogging } from '@/utils/errorSanitization';

const API_BASE_URL = env.apiBaseUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for auth and CSRF
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token for state-changing requests
    if (config.method && requiresCsrfProtection(config.method)) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers[getCsrfHeaderName()] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => {
    // Sanitize error before logging
    const sanitized = sanitizeErrorForLogging(error);
    logger.error('Request error:', sanitized);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and CSRF token extraction
apiClient.interceptors.response.use(
  (response) => {
    // Extract CSRF token from response headers if present
    if (response.headers) {
      const csrfToken = extractCsrfTokenFromHeaders(response.headers as Record<string, string>);
      if (csrfToken) {
        setCsrfToken(csrfToken);
      }
    }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as { detail?: string; message?: string } | undefined;

    // Extract CSRF token from error response headers if present
    if (error.response?.headers) {
      const csrfToken = extractCsrfTokenFromHeaders(error.response.headers as Record<string, string>);
      if (csrfToken) {
        setCsrfToken(csrfToken);
      }
    }

    // Sanitize URL for logging
    const sanitizedUrl = sanitizeUrl(error.config?.url);

    // Handle 401 Unauthorized - Clear auth and redirect to login
    if (status === 401) {
      logger.warn('Unauthorized access - clearing auth token');
      localStorage.removeItem('auth_token');
      // Only redirect if not already on landing page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    // Handle 403 Forbidden - Log with sanitized info
    if (status === 403) {
      const sanitizedDetail = data?.detail ? sanitizeErrorMessage(data.detail) : 'Access forbidden';
      logger.warn('Access forbidden:', sanitizedDetail);
    }

    // Handle 404 Not Found - Log with sanitized URL
    if (status === 404) {
      logger.warn('Resource not found:', sanitizedUrl);
    }

    // Handle 429 Too Many Requests - Rate limiting
    if (status === 429) {
      logger.warn('Rate limit exceeded');
    }

    // Handle 500+ Server Errors - Log with sanitized info
    if (status && status >= 500) {
      const sanitizedMessage = data?.detail ? sanitizeErrorMessage(data.detail) : 'Server error';
      logger.error('Server error:', {
        status,
        path: sanitizedUrl, // Only log path, not full URL
        message: sanitizedMessage,
      });
    }

    // Handle network errors - Sanitize message
    if (!error.response) {
      const sanitizedMessage = error.message ? sanitizeErrorMessage(error.message) : 'Network error';
      logger.error('Network error:', sanitizedMessage);
    }

    // Create sanitized error for user display
    const userFriendlyError = new Error(getUserFriendlyErrorMessage(status));
    // Attach original error for internal use (but sanitized)
    (userFriendlyError as unknown as { originalError: unknown }).originalError = error;

    return Promise.reject(userFriendlyError);
  }
);

