/**
 * Core types for the unified-like Effect pipeline
 */

import type { Effect } from "effect";
import type { Node, Parent } from "unist";
import type { VFile } from "vfile";

/**
 * Re-export unist types for convenience
 */
export type { Node, Parent, Literal } from "unist";

/**
 * Root node type - represents the root of a syntax tree
 * This extends Parent to have children
 */
export interface Root extends Parent {
  type: "root";
}

/**
 * Input type - raw content to be parsed
 * Can be a string, Uint8Array, or VFile
 */
export type Input = string | Uint8Array | VFile;

/**
 * Output type - processed content
 * Can be a string, Uint8Array, or VFile
 */
export type Output = string | Uint8Array | VFile;

/**
 * Position information for error reporting
 */
export interface Position {
  line: number;
  column: number;
  offset: number;
}

/**
 * Parse error - occurs during the parse phase
 */
export interface ParseError {
  readonly _tag: "ParseError";
  readonly message: string;
  readonly cause?: unknown;
  readonly position?: Position;
}

/**
 * Transform error - occurs during the run/transform phase
 */
export interface TransformError {
  readonly _tag: "TransformError";
  readonly message: string;
  readonly cause?: unknown;
}

/**
 * Compile error - occurs during the stringify/compile phase
 */
export interface CompileError {
  readonly _tag: "CompileError";
  readonly message: string;
  readonly cause?: unknown;
}

/**
 * Union of all pipeline error types
 */
export type PipelineError = ParseError | TransformError | CompileError;

/**
 * Parser interface - converts Input to SyntaxTree
 *
 * @template InputType - The type of input this parser accepts
 * @template TreeType - The type of syntax tree node this parser produces
 */
export interface Parser<
  InputType extends Input = Input,
  TreeType extends Node = Root,
> {
  /**
   * Parse input into a syntax tree
   *
   * @param input - The input to parse
   * @param file - Optional VFile for metadata and messages
   * @returns An Effect that produces a syntax tree on success or a ParseError on failure
   */
  parse(
    input: InputType,
    file?: VFile
  ): Effect.Effect<TreeType, ParseError, never>;
}

/**
 * Transformer interface - transforms SyntaxTree to SyntaxTree
 *
 * @template InputTree - The type of syntax tree node this transformer accepts
 * @template OutputTree - The type of syntax tree node this transformer produces
 */
export interface Transformer<
  InputTree extends Node = Node,
  OutputTree extends Node = InputTree,
> {
  /**
   * Transform a syntax tree
   *
   * @param tree - The syntax tree to transform
   * @param file - VFile for metadata and messages
   * @returns An Effect that produces a transformed syntax tree on success or a TransformError on failure
   */
  transform(
    tree: InputTree,
    file: VFile
  ): Effect.Effect<OutputTree, TransformError, never>;
}

/**
 * Compiler interface - converts SyntaxTree to Output
 *
 * @template TreeType - The type of syntax tree node this compiler accepts
 * @template OutputType - The type of output this compiler produces
 */
export interface Compiler<
  TreeType extends Node = Node,
  OutputType extends Output = string,
> {
  /**
   * Compile a syntax tree to output
   *
   * @param tree - The syntax tree to compile
   * @param file - VFile for metadata and messages
   * @returns An Effect that produces output on success or a CompileError on failure
   */
  compile(
    tree: TreeType,
    file: VFile
  ): Effect.Effect<OutputType, CompileError, never>;
}

/**
 * Type alias for common markdown AST root (from mdast)
 * Users can import mdast types if needed
 */
export type MdastRoot = Root;

/**
 * Type alias for common HTML AST root (from hast)
 * Users can import hast types if needed
 */
export type HastRoot = Root;
