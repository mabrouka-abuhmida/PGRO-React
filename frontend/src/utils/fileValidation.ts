/**
 * File upload validation utilities
 * Validates file type, size, and sanitizes filenames
 */

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Allowed MIME types for document uploads
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

// Allowed file extensions
export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file type by MIME type and extension
 */
export function validateFileType(file: File): FileValidationResult {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): FileValidationResult {
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 * Removes dangerous characters and limits length
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path separators and dangerous characters
  let sanitized = fileName
    .replace(/[\/\\]/g, '_') // Replace path separators
    .replace(/[<>:"|?*]/g, '_') // Replace Windows forbidden characters
    .replace(/\.\./g, '_') // Replace parent directory references
    .replace(/^\.+/, '') // Remove leading dots
    .trim();

  // Limit filename length (255 characters is common max)
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, 255 - ext.length);
    sanitized = name + ext;
  }

  // Ensure filename is not empty
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'file';
  }

  return sanitized;
}

/**
 * Comprehensive file validation
 * Validates type, size, and returns sanitized filename
 */
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
  sanitizedFileName: string;
} {
  // Validate file type
  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) {
    return {
      ...typeValidation,
      sanitizedFileName: sanitizeFileName(file.name),
    };
  }

  // Validate file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return {
      ...sizeValidation,
      sanitizedFileName: sanitizeFileName(file.name),
    };
  }

  // Sanitize filename
  const sanitizedFileName = sanitizeFileName(file.name);

  return {
    valid: true,
    sanitizedFileName,
  };
}

