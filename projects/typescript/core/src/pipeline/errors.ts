/**
 * Error utilities for the pipeline
 */

import type {
  ParseError,
  TransformError,
  CompileError,
  PipelineError,
  Position,
} from "./types.js";

/**
 * Create a ParseError
 */
export function createParseError(
  message: string,
  cause?: unknown,
  position?: Position
): ParseError {
  return {
    _tag: "ParseError",
    message,
    cause,
    position,
  };
}

/**
 * Create a TransformError
 */
export function createTransformError(
  message: string,
  cause?: unknown
): TransformError {
  return {
    _tag: "TransformError",
    message,
    cause,
  };
}

/**
 * Create a CompileError
 */
export function createCompileError(
  message: string,
  cause?: unknown
): CompileError {
  return {
    _tag: "CompileError",
    message,
    cause,
  };
}

/**
 * Type guard for ParseError
 */
export function isParseError(error: unknown): error is ParseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    error._tag === "ParseError"
  );
}

/**
 * Type guard for TransformError
 */
export function isTransformError(error: unknown): error is TransformError {
  return (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    error._tag === "TransformError"
  );
}

/**
 * Type guard for CompileError
 */
export function isCompileError(error: unknown): error is CompileError {
  return (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    error._tag === "CompileError"
  );
}

/**
 * Format a pipeline error as a human-readable string
 */
export function formatPipelineError(error: PipelineError): string {
  switch (error._tag) {
    case "ParseError": {
      const position = error.position
        ? ` at line ${error.position.line}, column ${error.position.column}`
        : "";
      const cause = error.cause
        ? `\nCause: ${error.cause instanceof Error ? error.cause.message : String(error.cause)}`
        : "";
      return `ParseError: ${error.message}${position}${cause}`;
    }
    case "TransformError": {
      const cause = error.cause
        ? `\nCause: ${error.cause instanceof Error ? error.cause.message : String(error.cause)}`
        : "";
      return `TransformError: ${error.message}${cause}`;
    }
    case "CompileError": {
      const cause = error.cause
        ? `\nCause: ${error.cause instanceof Error ? error.cause.message : String(error.cause)}`
        : "";
      return `CompileError: ${error.message}${cause}`;
    }
  }
}
