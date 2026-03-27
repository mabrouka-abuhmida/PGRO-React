/**
 * URL parameter validation utilities
 * Validates and sanitizes URL parameters to prevent injection attacks
 */

/**
 * UUID v4 validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 */
export function isValidUUID(id: string | null | undefined): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Validate and sanitize UUID parameter
 * Throws error if invalid
 */
export function validateUUID(id: string | null | undefined, paramName: string = 'id'): string {
  if (!id) {
    throw new Error(`${paramName} is required`);
  }

  const trimmed = id.trim();

  if (!isValidUUID(trimmed)) {
    throw new Error(`Invalid ${paramName} format. Expected UUID.`);
  }

  return trimmed;
}

/**
 * Validate numeric ID parameter
 */
export function validateNumericId(id: string | null | undefined, paramName: string = 'id'): number {
  if (!id) {
    throw new Error(`${paramName} is required`);
  }

  const num = parseInt(id.trim(), 10);

  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid ${paramName}. Must be a positive number.`);
  }

  return num;
}

/**
 * Validate string parameter with length limits
 */
export function validateStringParam(
  param: string | null | undefined,
  paramName: string = 'parameter',
  maxLength: number = 500,
  minLength: number = 0
): string {
  if (!param) {
    throw new Error(`${paramName} is required`);
  }

  const trimmed = param.trim();

  if (trimmed.length < minLength) {
    throw new Error(`${paramName} must be at least ${minLength} characters long.`);
  }

  if (trimmed.length > maxLength) {
    throw new Error(`${paramName} must be no more than ${maxLength} characters long.`);
  }

  // Remove potentially dangerous characters
  const sanitized = trimmed.replace(/[<>"']/g, '');

  return sanitized;
}

/**
 * Safe parameter extraction with validation
 * Returns validated parameter or throws error
 */
export function safeGetParam(
  params: Record<string, string | undefined>,
  key: string,
  validator: (value: string | undefined) => string = (v) => v || ''
): string {
  const value = params[key];
  try {
    return validator(value);
  } catch (error) {
    throw new Error(`Invalid parameter '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

