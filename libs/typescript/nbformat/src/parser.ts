/**
 * Parser for converting Jupyter notebook format (nbformat) to nbast
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
} from "@jupyterlab/nbformat";
import type { ParseError } from "ndoctrinate-core";
import type {
  NotebookRoot,
  CodeCell,
  MarkdownCell,
  RawCell,
  Output,
  StreamOutput,
  DisplayDataOutput,
  ExecuteResultOutput,
  ErrorOutput,
  TracebackLine,
  Cell,
} from "./types.ts";
import { normalizeSource, isValidCellId } from "./utils.ts";

/**
 * Parser implementation for nbformat → nbast conversion
 */
export class NbformatParser {
  /**
   * Parse nbformat JSON (string or object) into an nbast tree
   */
  parse(
    input: string | INotebookContent,
    file?: VFile
  ): Effect.Effect<NotebookRoot, ParseError, never> {
    return Effect.try({
      try: () => {
        // Parse JSON if input is a string
        const notebook: INotebookContent =
          typeof input === "string" ? JSON.parse(input) : input;

        // Validate basic structure
        if (!notebook.cells || !Array.isArray(notebook.cells)) {
          throw new Error("Invalid notebook: missing or invalid 'cells' array");
        }

        if (typeof notebook.nbformat !== "number") {
          throw new Error(
            "Invalid notebook: missing or invalid 'nbformat' version"
          );
        }

        // Convert cells
        const cells: Cell[] = notebook.cells.map((cell, index) =>
          this.parseCell(cell, index)
        );

        // Build root node
        const root: NotebookRoot = {
          type: "notebook",
          children: cells,
          data: {
            nbformat: notebook.nbformat,
            nbformat_minor: notebook.nbformat_minor ?? 0,
            metadata: notebook.metadata,
          },
        };

        return root;
      },
      catch: (error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown error parsing notebook";

        const parseError: ParseError = {
          _tag: "ParseError",
          message,
          cause: error,
        };

        return parseError;
      },
    });
  }

  /**
   * Parse a single cell
   */
  private parseCell(cell: ICell, index: number): Cell {
    // Extract and validate cell ID
    const rawId = "id" in cell ? cell.id : undefined;
    const cellIdStr = typeof rawId === "string" ? rawId : `cell-${index}`;

    // Validate cell ID if present (required in nbformat 4.5+)
    if (rawId && typeof rawId === "string" && !isValidCellId(cellIdStr)) {
      throw new Error(
        `Invalid cell ID at index ${index}: "${cellIdStr}". ` +
          "Cell IDs must be 1-64 alphanumeric characters, hyphens, or underscores."
      );
    }

    switch (cell.cell_type) {
      case "code":
        return this.parseCodeCell(cell as ICodeCell, cellIdStr);
      case "markdown":
        return this.parseMarkdownCell(cell as IMarkdownCell, cellIdStr);
      case "raw":
        return this.parseRawCell(cell as IRawCell, cellIdStr);
      default:
        throw new Error(
          `Unknown cell type at index ${index}: ${(cell as any).cell_type}`
        );
    }
  }

  /**
   * Parse a code cell
   */
  private parseCodeCell(cell: ICodeCell, cellId: string): CodeCell {
    const source = normalizeSource(cell.source);
    const outputs = (cell.outputs || []).map((output, index) =>
      this.parseOutput(output, index)
    );

    return {
      type: "codeCell",
      children: outputs,
      data: {
        id: cellId,
        executionCount: cell.execution_count ?? null,
        source,
        metadata: cell.metadata,
      },
    };
  }

  /**
   * Parse a markdown cell
   */
  private parseMarkdownCell(cell: IMarkdownCell, cellId: string): MarkdownCell {
    const source = normalizeSource(cell.source);

    return {
      type: "markdownCell",
      value: source,
      data: {
        id: cellId,
        source,
        metadata: cell.metadata,
      },
    };
  }

  /**
   * Parse a raw cell
   */
  private parseRawCell(cell: IRawCell, cellId: string): RawCell {
    const source = normalizeSource(cell.source);
    const format =
      typeof cell.metadata?.format === "string"
        ? cell.metadata.format
        : undefined;

    return {
      type: "rawCell",
      value: source,
      data: {
        id: cellId,
        source,
        format,
        metadata: cell.metadata,
      },
    };
  }

  /**
   * Parse an output
   */
  private parseOutput(output: IOutput, index: number): Output {
    switch (output.output_type) {
      case "stream":
        return this.parseStreamOutput(output as IStream);
      case "display_data":
        return this.parseDisplayDataOutput(output as IDisplayData);
      case "execute_result":
        return this.parseExecuteResultOutput(output as IExecuteResult);
      case "error":
        return this.parseErrorOutput(output as IError);
      default:
        throw new Error(
          `Unknown output type at index ${index}: ${(output as any).output_type}`
        );
    }
  }

  /**
   * Parse a stream output
   */
  private parseStreamOutput(output: IStream): StreamOutput {
    const text = normalizeSource(output.text);

    return {
      type: "streamOutput",
      value: text,
      data: {
        name: output.name,
      },
    };
  }

  /**
   * Parse a display_data output
   */
  private parseDisplayDataOutput(output: IDisplayData): DisplayDataOutput {
    const mimeBundle = output.data;

    // Extract primary text/plain representation
    let value: string;
    const textPlain = mimeBundle["text/plain"];

    if (typeof textPlain === "string") {
      value = textPlain;
    } else if (Array.isArray(textPlain)) {
      value = textPlain.join("");
    } else if (textPlain !== undefined) {
      value = String(textPlain);
    } else {
      // Fallback to JSON representation if no text/plain
      value = JSON.stringify(mimeBundle, null, 2);
    }

    return {
      type: "displayDataOutput",
      value,
      data: {
        mimeBundle,
        metadata: output.metadata,
      },
    };
  }

  /**
   * Parse an execute_result output
   */
  private parseExecuteResultOutput(
    output: IExecuteResult
  ): ExecuteResultOutput {
    const mimeBundle = output.data;

    // Extract primary text/plain representation
    let value: string;
    const textPlain = mimeBundle["text/plain"];

    if (typeof textPlain === "string") {
      value = textPlain;
    } else if (Array.isArray(textPlain)) {
      value = textPlain.join("");
    } else if (textPlain !== undefined) {
      value = String(textPlain);
    } else {
      // Fallback to JSON representation if no text/plain
      value = JSON.stringify(mimeBundle, null, 2);
    }

    return {
      type: "executeResultOutput",
      value,
      data: {
        executionCount: output.execution_count as number,
        mimeBundle,
        metadata: output.metadata,
      },
    };
  }

  /**
   * Parse an error output
   */
  private parseErrorOutput(output: IError): ErrorOutput {
    const children: TracebackLine[] = output.traceback.map((line) => ({
      type: "tracebackLine",
      value: typeof line === "string" ? line : String(line),
    }));

    return {
      type: "errorOutput",
      children,
      data: {
        ename: output.ename,
        evalue: output.evalue,
      },
    };
  }
}

/**
 * Convenience function to parse nbformat JSON to nbast
 */
export function parse(
  input: string | INotebookContent,
  file?: VFile
): Effect.Effect<NotebookRoot, ParseError, never> {
  const parser = new NbformatParser();
  return parser.parse(input, file);
}
