/**
 * Jupyter Notebook Abstract Syntax Tree (nbast)
 *
 * A unist-compatible syntax tree representation of Jupyter notebook format (nbformat).
 * This extends the unist specification to represent Jupyter notebooks as syntax trees,
 * enabling transformation, validation, and analysis workflows.
 *
 * @see https://nbformat.readthedocs.io/en/latest/
 * @see https://github.com/syntax-tree/unist
 */

import type { Node, Parent, Literal, Data } from "unist";

/**
 * Re-export unist base types for convenience
 */
export type { Node, Parent, Literal, Data } from "unist";

// ============================================================================
// Root Node
// ============================================================================

/**
 * Root node representing a complete Jupyter notebook.
 * This is the top-level node in the nbast tree.
 */
export interface NotebookRoot extends Parent {
  type: "notebook";
  children: Cell[];
  data?: NotebookData;
}

/**
 * Data stored at the notebook level
 */
export interface NotebookData extends Data {
  /** Major version number of the notebook format (typically 4) */
  nbformat: number;
  /** Minor version number for backward-compatible changes */
  nbformat_minor: number;
  /** Notebook-level metadata */
  metadata?: NotebookMetadata;
}

/**
 * Notebook-level metadata
 */
export interface NotebookMetadata {
  /** Information about the kernel that can execute this notebook */
  kernelspec?: KernelspecMetadata;
  /** Information about the programming language used */
  language_info?: LanguageInfoMetadata;
  /** List of notebook authors */
  authors?: Author[];
  /** Additional custom metadata */
  [key: string]: unknown;
}

/**
 * Kernel specification metadata
 */
export interface KernelspecMetadata {
  /** Internal name of the kernel */
  name: string;
  /** User-friendly display name */
  display_name: string;
  /** Programming language name (optional) */
  language?: string;
  /** Additional kernel-specific metadata */
  [key: string]: unknown;
}

/**
 * Programming language information
 */
export interface LanguageInfoMetadata {
  /** Language name (e.g., "python", "julia", "R") */
  name: string;
  /** Language version string */
  version?: string;
  /** MIME type for the language */
  mimetype?: string;
  /** File extension for the language (e.g., ".py") */
  file_extension?: string;
  /** Additional language-specific metadata */
  [key: string]: unknown;
}

/**
 * Author information
 */
export interface Author {
  /** Author name */
  name: string;
  /** Additional author metadata */
  [key: string]: unknown;
}

// ============================================================================
// Cell Nodes
// ============================================================================

/**
 * Union type of all cell types
 */
export type Cell = CodeCell | MarkdownCell | RawCell;

/**
 * Base data structure shared by all cell types
 */
export interface BaseCellData extends Data {
  /** Unique identifier for the cell (required since nbformat 4.5) */
  id: string;
  /** Cell-level metadata */
  metadata?: CellMetadata;
}

/**
 * Cell-level metadata
 */
export interface CellMetadata {
  /** Whether the cell is collapsed in the UI */
  collapsed?: boolean;
  /** Whether the cell output is scrolled */
  scrolled?: boolean | "auto";
  /** Whether the cell can be deleted */
  deletable?: boolean;
  /** Whether the cell can be edited */
  editable?: boolean;
  /** User-defined name for the cell */
  name?: string;
  /** List of tags associated with the cell */
  tags?: string[];
  /** Additional custom metadata */
  [key: string]: unknown;
}

/**
 * Code cell - represents executable code.
 * This is a Parent node because it contains output nodes as children.
 */
export interface CodeCell extends Parent {
  type: "codeCell";
  children: Output[];
  data: CodeCellData;
}

/**
 * Data specific to code cells
 */
export interface CodeCellData extends BaseCellData {
  /** Number of times this cell has been executed (null if never executed) */
  executionCount: number | null;
  /** Source code as a string (may be multiline) */
  source: string;
}

/**
 * Markdown cell - represents formatted text in Markdown.
 * This is a Literal node with the source text as its value.
 */
export interface MarkdownCell extends Literal {
  type: "markdownCell";
  /** The markdown source text */
  value: string;
  data: MarkdownCellData;
}

/**
 * Data specific to markdown cells
 */
export interface MarkdownCellData extends BaseCellData {
  /** Source markdown text (stored in value, but also kept here for symmetry) */
  source: string;
}

/**
 * Raw cell - represents unformatted text in a specific format.
 * This is a Literal node with the source text as its value.
 */
export interface RawCell extends Literal {
  type: "rawCell";
  /** The raw source text */
  value: string;
  data: RawCellData;
}

/**
 * Data specific to raw cells
 */
export interface RawCellData extends BaseCellData {
  /** Source text (stored in value, but also kept here for symmetry) */
  source: string;
  /** Optional format specification (e.g., "text/restructuredtext") */
  format?: string;
}

// ============================================================================
// Output Nodes
// ============================================================================

/**
 * Union type of all output types
 */
export type Output =
  | StreamOutput
  | DisplayDataOutput
  | ExecuteResultOutput
  | ErrorOutput;

/**
 * Stream output - represents stdout or stderr text output.
 * This is a Literal node with the text content as its value.
 */
export interface StreamOutput extends Literal {
  type: "streamOutput";
  /** The text content written to the stream */
  value: string;
  data: StreamOutputData;
}

/**
 * Data specific to stream outputs
 */
export interface StreamOutputData extends Data {
  /** Which stream this output came from */
  name: "stdout" | "stderr";
}

/**
 * Display data output - represents rich MIME-typed display data.
 * This is a Literal node with the primary text/plain representation as its value.
 */
export interface DisplayDataOutput extends Literal {
  type: "displayDataOutput";
  /** Primary text/plain representation for the output */
  value: string;
  data: DisplayDataOutputData;
}

/**
 * Data specific to display data outputs
 */
export interface DisplayDataOutputData extends Data {
  /** MIME bundle containing multiple representations of the data */
  mimeBundle: MimeBundle;
  /** Output-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Execute result output - represents the result of code execution.
 * This is a Literal node with the primary text/plain representation as its value.
 */
export interface ExecuteResultOutput extends Literal {
  type: "executeResultOutput";
  /** Primary text/plain representation for the result */
  value: string;
  data: ExecuteResultOutputData;
}

/**
 * Data specific to execute result outputs
 */
export interface ExecuteResultOutputData extends Data {
  /** Execution count when this result was produced */
  executionCount: number;
  /** MIME bundle containing multiple representations of the result */
  mimeBundle: MimeBundle;
  /** Output-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Error output - represents an execution error with traceback.
 * This is a Parent node because it contains traceback lines as children.
 */
export interface ErrorOutput extends Parent {
  type: "errorOutput";
  children: TracebackLine[];
  data: ErrorOutputData;
}

/**
 * Data specific to error outputs
 */
export interface ErrorOutputData extends Data {
  /** Exception name (e.g., "NameError", "TypeError") */
  ename: string;
  /** Exception value/message */
  evalue: string;
}

/**
 * Traceback line - represents a single line of an error traceback.
 * This is a Literal node with the traceback text as its value.
 */
export interface TracebackLine extends Literal {
  type: "tracebackLine";
  /** The traceback line text */
  value: string;
}

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * MIME bundle - a collection of data representations in different MIME types.
 * Common MIME types include:
 * - text/plain: Plain text
 * - text/html: HTML markup
 * - text/markdown: Markdown text
 * - image/png: PNG image (base64 encoded)
 * - image/jpeg: JPEG image (base64 encoded)
 * - image/svg+xml: SVG vector graphic
 * - application/json: JSON data
 * - application/javascript: JavaScript code
 */
export type MimeBundle = Record<string, unknown>;

// ============================================================================
// Type Aliases for Common Uses
// ============================================================================

/**
 * Type alias for the root of an nbast tree
 */
export type NbastRoot = NotebookRoot;

/**
 * Type alias for any node in an nbast tree
 */
export type NbastNode =
  | NotebookRoot
  | Cell
  | Output
  | TracebackLine;

/**
 * Type alias for any parent node in an nbast tree
 */
export type NbastParent = NotebookRoot | CodeCell | ErrorOutput;

/**
 * Type alias for any literal node in an nbast tree
 */
export type NbastLiteral =
  | MarkdownCell
  | RawCell
  | StreamOutput
  | DisplayDataOutput
  | ExecuteResultOutput
  | TracebackLine;
