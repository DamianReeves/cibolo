/**
 * ndoctrinate-nbformat
 *
 * Jupyter notebook format (nbformat) as unist-compatible syntax tree (nbast).
 * This library provides TypeScript types and utilities for representing
 * Jupyter notebooks as abstract syntax trees, enabling transformation,
 * validation, and analysis workflows using the unist ecosystem.
 *
 * @module ndoctrinate-nbformat
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Base unist types
  Node,
  Parent,
  Literal,
  Data,
  // Root
  NotebookRoot,
  NotebookData,
  NotebookMetadata,
  KernelspecMetadata,
  LanguageInfoMetadata,
  Author,
  // Cells
  Cell,
  CodeCell,
  MarkdownCell,
  RawCell,
  BaseCellData,
  CodeCellData,
  MarkdownCellData,
  RawCellData,
  CellMetadata,
  // Outputs
  Output,
  StreamOutput,
  DisplayDataOutput,
  ExecuteResultOutput,
  ErrorOutput,
  StreamOutputData,
  DisplayDataOutputData,
  ExecuteResultOutputData,
  ErrorOutputData,
  TracebackLine,
  // Supporting types
  MimeBundle,
  // Type aliases
  NbastRoot,
  NbastNode,
  NbastParent,
  NbastLiteral,
} from "./types.ts";

// ============================================================================
// Parser Exports
// ============================================================================

export { NbformatParser, parse } from "./parser.ts";

// ============================================================================
// Compiler Exports
// ============================================================================

export { NbformatCompiler, compile } from "./compiler.ts";
export type { NbformatCompilerOptions } from "./compiler.ts";

// ============================================================================
// Utility Exports
// ============================================================================

export {
  // Root type guards
  isNotebookRoot,
  // Cell type guards
  isCell,
  isCodeCell,
  isMarkdownCell,
  isRawCell,
  // Output type guards
  isOutput,
  isStreamOutput,
  isDisplayDataOutput,
  isExecuteResultOutput,
  isErrorOutput,
  isTracebackLine,
  // MIME bundle utilities
  getPrimaryText,
  hasMimeType,
  getMimeTypes,
  getMimeData,
  // Source text utilities
  normalizeSource,
  splitSource,
  // Cell utilities
  getCellSource,
  getCellId,
  getCellMetadata,
  hasOutputs,
  getOutputs,
  // Validation utilities
  isValidCellId,
  generateCellId,
  isValidNbformatVersion,
} from "./utils.ts";

// ============================================================================
// Builder Exports
// ============================================================================

export {
  // Root builders
  notebook,
  // Cell builders
  codeCell,
  markdownCell,
  rawCell,
  // Output builders
  streamOutput,
  displayDataOutput,
  executeResultOutput,
  errorOutput,
  tracebackLine,
  // Convenience builders
  simpleNotebook,
  pythonNotebook,
  codeCellWithOutput,
  codeCellWithResult,
  codeCellWithError,
} from "./builders.ts";
