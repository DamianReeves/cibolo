/**
 * Utility functions and type guards for working with nbast nodes
 */

import type { Node } from "unist";
import type {
  NotebookRoot,
  Cell,
  CodeCell,
  MarkdownCell,
  RawCell,
  Output,
  StreamOutput,
  DisplayDataOutput,
  ExecuteResultOutput,
  ErrorOutput,
  TracebackLine,
} from "./types.ts";

// ============================================================================
// Root Node Type Guards
// ============================================================================

/**
 * Check if a node is a NotebookRoot
 */
export function isNotebookRoot(node: Node): node is NotebookRoot {
  return node.type === "notebook";
}

// ============================================================================
// Cell Type Guards
// ============================================================================

/**
 * Check if a node is any type of Cell
 */
export function isCell(node: Node): node is Cell {
  return isCodeCell(node) || isMarkdownCell(node) || isRawCell(node);
}

/**
 * Check if a node is a CodeCell
 */
export function isCodeCell(node: Node): node is CodeCell {
  return node.type === "codeCell";
}

/**
 * Check if a node is a MarkdownCell
 */
export function isMarkdownCell(node: Node): node is MarkdownCell {
  return node.type === "markdownCell";
}

/**
 * Check if a node is a RawCell
 */
export function isRawCell(node: Node): node is RawCell {
  return node.type === "rawCell";
}

// ============================================================================
// Output Type Guards
// ============================================================================

/**
 * Check if a node is any type of Output
 */
export function isOutput(node: Node): node is Output {
  return (
    isStreamOutput(node) ||
    isDisplayDataOutput(node) ||
    isExecuteResultOutput(node) ||
    isErrorOutput(node)
  );
}

/**
 * Check if a node is a StreamOutput
 */
export function isStreamOutput(node: Node): node is StreamOutput {
  return node.type === "streamOutput";
}

/**
 * Check if a node is a DisplayDataOutput
 */
export function isDisplayDataOutput(node: Node): node is DisplayDataOutput {
  return node.type === "displayDataOutput";
}

/**
 * Check if a node is an ExecuteResultOutput
 */
export function isExecuteResultOutput(
  node: Node
): node is ExecuteResultOutput {
  return node.type === "executeResultOutput";
}

/**
 * Check if a node is an ErrorOutput
 */
export function isErrorOutput(node: Node): node is ErrorOutput {
  return node.type === "errorOutput";
}

/**
 * Check if a node is a TracebackLine
 */
export function isTracebackLine(node: Node): node is TracebackLine {
  return node.type === "tracebackLine";
}

// ============================================================================
// MIME Bundle Utilities
// ============================================================================

/**
 * Get the primary text/plain representation from a MIME bundle
 */
export function getPrimaryText(mimeBundle: Record<string, unknown>): string {
  const textPlain = mimeBundle["text/plain"];
  if (typeof textPlain === "string") {
    return textPlain;
  }
  if (Array.isArray(textPlain)) {
    return textPlain.join("");
  }
  // Fallback to JSON representation if no text/plain
  return JSON.stringify(mimeBundle, null, 2);
}

/**
 * Check if a MIME bundle contains a specific MIME type
 */
export function hasMimeType(
  mimeBundle: Record<string, unknown>,
  mimeType: string
): boolean {
  return mimeType in mimeBundle;
}

/**
 * Get all available MIME types in a bundle
 */
export function getMimeTypes(mimeBundle: Record<string, unknown>): string[] {
  return Object.keys(mimeBundle);
}

/**
 * Get data for a specific MIME type from a bundle
 */
export function getMimeData(
  mimeBundle: Record<string, unknown>,
  mimeType: string
): unknown {
  return mimeBundle[mimeType];
}

// ============================================================================
// Source Text Utilities
// ============================================================================

/**
 * Convert a multiline string (string | string[]) to a single string
 */
export function normalizeSource(source: string | string[]): string {
  if (typeof source === "string") {
    return source;
  }
  return source.join("");
}

/**
 * Convert a single string to a multiline array if it contains newlines
 */
export function splitSource(source: string): string[] {
  return source.split("\n").map((line, i, arr) => {
    // Add back newline except for the last line
    return i < arr.length - 1 ? line + "\n" : line;
  });
}

// ============================================================================
// Cell Utilities
// ============================================================================

/**
 * Get the source code/text from any cell type
 */
export function getCellSource(cell: Cell): string {
  if (isCodeCell(cell)) {
    return cell.data.source;
  }
  // MarkdownCell and RawCell store source in both value and data.source
  return cell.value;
}

/**
 * Get the cell ID from any cell type
 */
export function getCellId(cell: Cell): string {
  return cell.data.id;
}

/**
 * Get the cell metadata from any cell type
 */
export function getCellMetadata(cell: Cell): Record<string, unknown> | undefined {
  return cell.data.metadata;
}

/**
 * Check if a cell has any outputs (only applicable to code cells)
 */
export function hasOutputs(cell: Cell): boolean {
  return isCodeCell(cell) && cell.children.length > 0;
}

/**
 * Get outputs from a code cell, or empty array for other cell types
 */
export function getOutputs(cell: Cell): Output[] {
  return isCodeCell(cell) ? cell.children : [];
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate that a cell ID meets nbformat requirements:
 * - 1-64 characters long
 * - Alphanumeric, hyphens, and underscores only
 */
export function isValidCellId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

/**
 * Generate a valid random cell ID
 */
export function generateCellId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_";
  const length = 8; // Reasonable length for uniqueness
  let id = "";
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Validate nbformat version (should be 4.x)
 */
export function isValidNbformatVersion(
  major: number,
  minor: number
): boolean {
  return major === 4 && minor >= 0;
}
