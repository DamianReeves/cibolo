/**
 * Builder functions for constructing nbast nodes
 *
 * These functions provide a convenient and type-safe way to create
 * nbast syntax tree nodes programmatically.
 */

import type {
  NotebookRoot,
  NotebookData,
  NotebookMetadata,
  CodeCell,
  MarkdownCell,
  RawCell,
  StreamOutput,
  DisplayDataOutput,
  ExecuteResultOutput,
  ErrorOutput,
  TracebackLine,
  CellMetadata,
  MimeBundle,
  Output,
} from "./types.ts";
import { generateCellId } from "./utils.ts";

// ============================================================================
// Root Node Builders
// ============================================================================

/**
 * Create a NotebookRoot node
 */
export function notebook(
  cells: (CodeCell | MarkdownCell | RawCell)[],
  options?: {
    nbformat?: number;
    nbformat_minor?: number;
    metadata?: NotebookMetadata;
  }
): NotebookRoot {
  const data: NotebookData = {
    nbformat: options?.nbformat ?? 4,
    nbformat_minor: options?.nbformat_minor ?? 5,
    metadata: options?.metadata,
  };

  return {
    type: "notebook",
    children: cells,
    data,
  };
}

// ============================================================================
// Cell Builders
// ============================================================================

/**
 * Create a CodeCell node
 */
export function codeCell(
  source: string,
  outputs?: Output[],
  options?: {
    id?: string;
    executionCount?: number | null;
    metadata?: CellMetadata;
  }
): CodeCell {
  return {
    type: "codeCell",
    children: outputs ?? [],
    data: {
      id: options?.id ?? generateCellId(),
      executionCount: options?.executionCount ?? null,
      source,
      metadata: options?.metadata,
    },
  };
}

/**
 * Create a MarkdownCell node
 */
export function markdownCell(
  source: string,
  options?: {
    id?: string;
    metadata?: CellMetadata;
  }
): MarkdownCell {
  return {
    type: "markdownCell",
    value: source,
    data: {
      id: options?.id ?? generateCellId(),
      source,
      metadata: options?.metadata,
    },
  };
}

/**
 * Create a RawCell node
 */
export function rawCell(
  source: string,
  options?: {
    id?: string;
    format?: string;
    metadata?: CellMetadata;
  }
): RawCell {
  return {
    type: "rawCell",
    value: source,
    data: {
      id: options?.id ?? generateCellId(),
      source,
      format: options?.format,
      metadata: options?.metadata,
    },
  };
}

// ============================================================================
// Output Builders
// ============================================================================

/**
 * Create a StreamOutput node
 */
export function streamOutput(
  text: string,
  stream: "stdout" | "stderr" = "stdout"
): StreamOutput {
  return {
    type: "streamOutput",
    value: text,
    data: {
      name: stream,
    },
  };
}

/**
 * Create a DisplayDataOutput node
 */
export function displayDataOutput(
  mimeBundle: MimeBundle,
  options?: {
    metadata?: Record<string, unknown>;
  }
): DisplayDataOutput {
  // Extract primary text/plain representation
  const textPlain = mimeBundle["text/plain"];
  let value: string;

  if (typeof textPlain === "string") {
    value = textPlain;
  } else if (Array.isArray(textPlain)) {
    value = textPlain.join("");
  } else {
    // Fallback to JSON representation
    value = JSON.stringify(mimeBundle, null, 2);
  }

  return {
    type: "displayDataOutput",
    value,
    data: {
      mimeBundle,
      metadata: options?.metadata,
    },
  };
}

/**
 * Create an ExecuteResultOutput node
 */
export function executeResultOutput(
  executionCount: number,
  mimeBundle: MimeBundle,
  options?: {
    metadata?: Record<string, unknown>;
  }
): ExecuteResultOutput {
  // Extract primary text/plain representation
  const textPlain = mimeBundle["text/plain"];
  let value: string;

  if (typeof textPlain === "string") {
    value = textPlain;
  } else if (Array.isArray(textPlain)) {
    value = textPlain.join("");
  } else {
    // Fallback to JSON representation
    value = JSON.stringify(mimeBundle, null, 2);
  }

  return {
    type: "executeResultOutput",
    value,
    data: {
      executionCount,
      mimeBundle,
      metadata: options?.metadata,
    },
  };
}

/**
 * Create an ErrorOutput node
 */
export function errorOutput(
  ename: string,
  evalue: string,
  traceback: string[]
): ErrorOutput {
  const children: TracebackLine[] = traceback.map((line) => ({
    type: "tracebackLine",
    value: line,
  }));

  return {
    type: "errorOutput",
    children,
    data: {
      ename,
      evalue,
    },
  };
}

/**
 * Create a TracebackLine node
 */
export function tracebackLine(text: string): TracebackLine {
  return {
    type: "tracebackLine",
    value: text,
  };
}

// ============================================================================
// Convenience Builders
// ============================================================================

/**
 * Create a simple notebook with just markdown and code cells
 */
export function simpleNotebook(
  cells: Array<
    | { type: "code"; source: string; outputs?: Output[] }
    | { type: "markdown"; source: string }
    | { type: "raw"; source: string }
  >
): NotebookRoot {
  const builtCells = cells.map((cell) => {
    switch (cell.type) {
      case "code":
        return codeCell(cell.source, cell.outputs);
      case "markdown":
        return markdownCell(cell.source);
      case "raw":
        return rawCell(cell.source);
    }
  });

  return notebook(builtCells);
}

/**
 * Create a Python notebook with standard metadata
 */
export function pythonNotebook(
  cells: (CodeCell | MarkdownCell | RawCell)[],
  options?: {
    pythonVersion?: string;
    kernelName?: string;
  }
): NotebookRoot {
  return notebook(cells, {
    metadata: {
      kernelspec: {
        name: options?.kernelName ?? "python3",
        display_name: "Python 3",
        language: "python",
      },
      language_info: {
        name: "python",
        version: options?.pythonVersion ?? "3.11.0",
        mimetype: "text/x-python",
        file_extension: ".py",
      },
    },
  });
}

/**
 * Create a code cell with simple text output
 */
export function codeCellWithOutput(
  source: string,
  outputText: string,
  options?: {
    id?: string;
    executionCount?: number;
    metadata?: CellMetadata;
  }
): CodeCell {
  return codeCell(source, [streamOutput(outputText, "stdout")], options);
}

/**
 * Create a code cell with an execution result
 */
export function codeCellWithResult(
  source: string,
  result: string,
  options?: {
    id?: string;
    executionCount?: number;
    metadata?: CellMetadata;
  }
): CodeCell {
  const execCount = options?.executionCount ?? 1;
  return codeCell(
    source,
    [
      executeResultOutput(execCount, {
        "text/plain": result,
      }),
    ],
    {
      ...options,
      executionCount: execCount,
    }
  );
}

/**
 * Create a code cell with an error
 */
export function codeCellWithError(
  source: string,
  ename: string,
  evalue: string,
  traceback: string[],
  options?: {
    id?: string;
    executionCount?: number;
    metadata?: CellMetadata;
  }
): CodeCell {
  return codeCell(source, [errorOutput(ename, evalue, traceback)], options);
}
