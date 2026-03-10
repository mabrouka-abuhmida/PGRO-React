/**
 * Centralized logging utility
 * Only logs in development mode (except errors which always log)
 */
export const logger = {
  /**
   * Logs messages only in development mode
   */
  log: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },

  /**
   * Logs errors (always logged, even in production)
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },

  /**
   * Logs warnings (always logged)
   */
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },

  /**
   * Logs info messages only in development mode
   */
  info: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  },

  /**
   * Logs debug messages only in development mode
   */
  debug: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.debug(...args);
    }
  },
};

