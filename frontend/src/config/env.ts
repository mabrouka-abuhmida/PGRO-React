/**
 * Environment configuration and validation
 */
interface EnvConfig {
  apiBaseUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  environment: string;
}

/**
 * Validate required environment variables
 */
function validateEnv(): void {
  const requiredVars: string[] = [];
  
  // Only validate in production
  if (import.meta.env.PROD) {
    // VITE_API_BASE_URL is optional (has fallback), but warn if missing
    if (!import.meta.env.VITE_API_BASE_URL) {
      console.warn('VITE_API_BASE_URL is not set. Using default fallback.');
    }
  }

  if (requiredVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${requiredVars.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

/**
 * Get environment configuration
 */
export function getEnvConfig(): EnvConfig {
  // Validate environment variables
  validateEnv();

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const isProduction = import.meta.env.PROD;

  // Enforce HTTPS in production
  if (isProduction && !apiBaseUrl.startsWith('https://')) {
    throw new Error(
      'Security Error: API URL must use HTTPS in production. ' +
      `Current URL: ${apiBaseUrl}. ` +
      'Please set VITE_API_BASE_URL to an HTTPS URL.'
    );
  }

  return {
    apiBaseUrl,
    isProduction,
    isDevelopment: import.meta.env.DEV,
    environment: import.meta.env.MODE || 'development',
  };
}

/**
 * Exported configuration object
 */
export const config = getEnvConfig();

/**
 * Type-safe environment variable access
 */
export const env = {
  apiBaseUrl: config.apiBaseUrl,
  isProduction: config.isProduction,
  isDevelopment: config.isDevelopment,
  environment: config.environment,
} as const;

