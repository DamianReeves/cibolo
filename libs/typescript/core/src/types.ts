/**
 * Core types for document processing
 */

/**
 * Source type for document input
 * Can be a string (file path or content) or JSON object
 */
export type Source = string | JSON;

/**
 * Structured document representation
 * Contains the processed content and optional metadata
 */
export type StructuredDocument = {
  content: string;
  metadata?: Record<string, unknown>;
};

/**
 * Document processing error type
 * Currently an alias for any, will be a discriminated union in the future
 */
export type DocumentProcessingError = any;

/**
 * Result type for functional error handling
 * Represents either a success with a value or a failure with an error
 */
export type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };
