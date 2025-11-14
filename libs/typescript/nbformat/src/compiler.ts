/**
 * Compiler for converting nbast back to Jupyter notebook format (nbformat)
 */

import { Effect } from "effect";
import type { VFile } from "vfile";
import type {
  INotebookContent,
  ICell,
  ICodeCell,
  IMarkdownCell,
  IRawCell,
  IOutput,
  IStream,
  IDisplayData,
  IExecuteResult,
  IError,
  MultilineString,
} from "@jupyterlab/nbformat";
import type { CompileError } from "ndoctrinate-core";
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
} from "./types.ts";
import { splitSource, isValidNbformatVersion } from "./utils.ts";

/**
 * Options for the compiler
 */
export interface NbformatCompilerOptions {
  /**
   * Whether to use multiline strings for cell sources (string[])
   * Default: false (single string)
   */
  multilineSource?: boolean;

  /**
   * Whether to pretty-print the JSON output
   * Default: true
   */
  pretty?: boolean;

  /**
   * Number of spaces for indentation when pretty-printing
   * Default: 2
   */
  indent?: number;
}

/**
 * Compiler implementation for nbast → nbformat conversion
 */
export class NbformatCompiler {
  constructor(private options: NbformatCompilerOptions = {}) {}

  /**
   * Compile an nbast tree to nbformat JSON string
   */
  compile(
    tree: NotebookRoot,
    file?: VFile
  ): Effect.Effect<string, CompileError, never> {
    return Effect.try({
      try: () => {
        // Validate tree structure
        if (tree.type !== "notebook") {
          throw new Error("Root node must be of type 'notebook'");
        }

        if (!tree.data) {
          throw new Error("Notebook root must have data with nbformat version");
        }

        if (
          !isValidNbformatVersion(tree.data.nbformat, tree.data.nbformat_minor)
        ) {
          throw new Error(
            `Invalid nbformat version: ${tree.data.nbformat}.${tree.data.nbformat_minor}`
          );
        }

        // Convert to INotebookContent
        const notebook: INotebookContent = {
          nbformat: tree.data.nbformat,
          nbformat_minor: tree.data.nbformat_minor,
          metadata: (tree.data.metadata || {}) as any,
          cells: tree.children.map((cell, index) =>
            this.compileCell(cell, index)
          ),
        };

        // Serialize to JSON
        const pretty = this.options.pretty ?? true;
        const indent = this.options.indent ?? 2;
        const json = pretty
          ? JSON.stringify(notebook, null, indent)
          : JSON.stringify(notebook);

        return json;
      },
      catch: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown error compiling notebook";

        const compileError: CompileError = {
          _tag: "CompileError",
          message,
          cause: error,
        };

        return compileError;
      },
    });
  }

  /**
   * Compile a single cell
   */
  private compileCell(cell: Cell, index: number): ICell {
    switch (cell.type) {
      case "codeCell":
        return this.compileCodeCell(cell);
      case "markdownCell":
        return this.compileMarkdownCell(cell);
      case "rawCell":
        return this.compileRawCell(cell);
      default:
        throw new Error(
          `Unknown cell type at index ${index}: ${(cell as any).type}`
        );
    }
  }

  /**
   * Compile a code cell
   */
  private compileCodeCell(cell: CodeCell): ICodeCell {
    const source = this.compileSource(cell.data.source);
    const outputs = cell.children.map((output, index) =>
      this.compileOutput(output, index)
    );

    return {
      cell_type: "code",
      id: cell.data.id,
      execution_count: cell.data.executionCount,
      source,
      outputs,
      metadata: (cell.data.metadata || {}) as any,
    };
  }

  /**
   * Compile a markdown cell
   */
  private compileMarkdownCell(cell: MarkdownCell): IMarkdownCell {
    const source = this.compileSource(cell.data.source);

    return {
      cell_type: "markdown",
      id: cell.data.id,
      source,
      metadata: (cell.data.metadata || {}) as any,
    };
  }

  /**
   * Compile a raw cell
   */
  private compileRawCell(cell: RawCell): IRawCell {
    const metadata: any = { ...cell.data.metadata };
    if (cell.data.format) {
      metadata.format = cell.data.format;
    }

    return {
      cell_type: "raw",
      id: cell.data.id,
      source: this.compileSource(cell.data.source),
      metadata,
    };
  }

  /**
   * Compile source text to MultilineString format
   */
  private compileSource(source: string): MultilineString {
    if (this.options.multilineSource && source.includes("\n")) {
      return splitSource(source);
    }
    return source;
  }

  /**
   * Compile an output
   */
  private compileOutput(output: Output, index: number): IOutput {
    switch (output.type) {
      case "streamOutput":
        return this.compileStreamOutput(output);
      case "displayDataOutput":
        return this.compileDisplayDataOutput(output);
      case "executeResultOutput":
        return this.compileExecuteResultOutput(output);
      case "errorOutput":
        return this.compileErrorOutput(output);
      default:
        throw new Error(
          `Unknown output type at index ${index}: ${(output as any).type}`
        );
    }
  }

  /**
   * Compile a stream output
   */
  private compileStreamOutput(output: StreamOutput): IStream {
    const text = this.options.multilineSource
      ? splitSource(output.value)
      : output.value;

    return {
      output_type: "stream",
      name: output.data.name,
      text,
    };
  }

  /**
   * Compile a display_data output
   */
  private compileDisplayDataOutput(output: DisplayDataOutput): IDisplayData {
    return {
      output_type: "display_data",
      data: output.data.mimeBundle,
      metadata: output.data.metadata || {},
    } as IDisplayData;
  }

  /**
   * Compile an execute_result output
   */
  private compileExecuteResultOutput(
    output: ExecuteResultOutput
  ): IExecuteResult {
    return {
      output_type: "execute_result",
      execution_count: output.data.executionCount,
      data: output.data.mimeBundle,
      metadata: output.data.metadata || {},
    } as IExecuteResult;
  }

  /**
   * Compile an error output
   */
  private compileErrorOutput(output: ErrorOutput): IError {
    const traceback = output.children.map((line) => line.value);

    return {
      output_type: "error",
      ename: output.data.ename,
      evalue: output.data.evalue,
      traceback,
    };
  }
}

/**
 * Convenience function to compile nbast to nbformat JSON
 */
export function compile(
  tree: NotebookRoot,
  options?: NbformatCompilerOptions,
  file?: VFile
): Effect.Effect<string, CompileError, never> {
  const compiler = new NbformatCompiler(options);
  return compiler.compile(tree, file);
}
