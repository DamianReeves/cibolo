# ndoctrinate-nbformat

> Jupyter notebook format (nbformat) as unist-compatible syntax tree

This library provides TypeScript types and utilities for representing Jupyter notebooks as abstract syntax trees (AST), enabling transformation, validation, and analysis workflows using the [unist](https://github.com/syntax-tree/unist) ecosystem.

## Features

- **🌳 AST Representation**: Represent Jupyter notebooks as unist-compatible syntax trees (nbast)
- **🔄 Bidirectional Conversion**: Parse nbformat JSON → nbast and compile nbast → nbformat JSON
- **✨ Type-Safe**: Full TypeScript support with comprehensive type definitions
- **🧰 Utility Functions**: Type guards, builders, and helper functions for working with nbast
- **⚡ Effect-Based**: Built on [Effect](https://effect.website/) for composable error handling
- **🔌 Pipeline Ready**: Integrates with the ndoctrinate Effect-based pipeline system
- **📦 Complete Coverage**: Supports all nbformat cell types and output types

## Installation

```bash
bun add ndoctrinate-nbformat
```

## Quick Start

### Parse a Notebook

```typescript
import { parse } from "ndoctrinate-nbformat";
import { Effect } from "effect";

const notebookJson = `{
  "cells": [
    {
      "cell_type": "markdown",
      "id": "intro",
      "source": "# My Notebook",
      "metadata": {}
    },
    {
      "cell_type": "code",
      "id": "code-1",
      "source": "print('Hello, World!')",
      "execution_count": 1,
      "outputs": [],
      "metadata": {}
    }
  ],
  "metadata": {},
  "nbformat": 4,
  "nbformat_minor": 5
}`;

// Parse the notebook
const program = parse(notebookJson);
const tree = await Effect.runPromise(program);

console.log(tree.type); // "notebook"
console.log(tree.children.length); // 2
```

### Build a Notebook

```typescript
import {
  notebook,
  markdownCell,
  codeCell,
  streamOutput,
  pythonNotebook,
} from "ndoctrinate-nbformat";

// Build a simple notebook
const tree = notebook([
  markdownCell("# My Notebook"),
  codeCell('print("Hello, World!")', [streamOutput("Hello, World!\n")], {
    executionCount: 1,
  }),
]);

// Or use the Python notebook helper
const pythonTree = pythonNotebook([
  markdownCell("# Python Analysis"),
  codeCell("import pandas as pd\nimport numpy as np"),
]);
```

### Compile Back to JSON

```typescript
import { compile } from "ndoctrinate-nbformat";
import { Effect } from "effect";

const json = await Effect.runPromise(compile(tree));
console.log(json); // Pretty-printed nbformat JSON
```

### Transform a Notebook

```typescript
import { parse, compile } from "ndoctrinate-nbformat";
import { visit } from "unist-util-visit";
import { Effect } from "effect";

// Parse notebook
const tree = await Effect.runPromise(parse(notebookJson));

// Transform: remove all outputs from code cells
visit(tree, "codeCell", (node) => {
  node.children = [];
});

// Compile back to JSON
const cleanedJson = await Effect.runPromise(compile(tree));
```

## nbast Specification

The **nbast** (Jupyter Notebook Abstract Syntax Tree) format extends the [unist](https://github.com/syntax-tree/unist) specification to represent Jupyter notebooks as syntax trees.

### Node Types

#### NotebookRoot

The root node representing a complete Jupyter notebook.

```typescript
interface NotebookRoot extends Parent {
  type: "notebook";
  children: Cell[];
  data: {
    nbformat: number;
    nbformat_minor: number;
    metadata?: NotebookMetadata;
  };
}
```

#### CodeCell

Represents executable code with outputs as children.

```typescript
interface CodeCell extends Parent {
  type: "codeCell";
  children: Output[];
  data: {
    id: string;
    executionCount: number | null;
    source: string;
    metadata?: CellMetadata;
  };
}
```

#### MarkdownCell

Represents formatted text in Markdown.

```typescript
interface MarkdownCell extends Literal {
  type: "markdownCell";
  value: string;
  data: {
    id: string;
    source: string;
    metadata?: CellMetadata;
  };
}
```

#### RawCell

Represents unformatted text in a specific format.

```typescript
interface RawCell extends Literal {
  type: "rawCell";
  value: string;
  data: {
    id: string;
    source: string;
    format?: string;
    metadata?: CellMetadata;
  };
}
```

### Output Types

#### StreamOutput

Text output from stdout or stderr.

```typescript
interface StreamOutput extends Literal {
  type: "streamOutput";
  value: string;
  data: {
    name: "stdout" | "stderr";
  };
}
```

#### DisplayDataOutput

Rich MIME-typed display data.

```typescript
interface DisplayDataOutput extends Literal {
  type: "displayDataOutput";
  value: string; // Primary text/plain representation
  data: {
    mimeBundle: MimeBundle;
    metadata?: Record<string, unknown>;
  };
}
```

#### ExecuteResultOutput

Result of code execution with execution count.

```typescript
interface ExecuteResultOutput extends Literal {
  type: "executeResultOutput";
  value: string; // Primary text/plain representation
  data: {
    executionCount: number;
    mimeBundle: MimeBundle;
    metadata?: Record<string, unknown>;
  };
}
```

#### ErrorOutput

Execution error with traceback.

```typescript
interface ErrorOutput extends Parent {
  type: "errorOutput";
  children: TracebackLine[];
  data: {
    ename: string;
    evalue: string;
  };
}
```

## API Reference

### Core Types

All types are exported from the main module and follow the unist specification.

```typescript
import type {
  // Root
  NotebookRoot,
  // Cells
  Cell,
  CodeCell,
  MarkdownCell,
  RawCell,
  // Outputs
  Output,
  StreamOutput,
  DisplayDataOutput,
  ExecuteResultOutput,
  ErrorOutput,
  // Supporting types
  MimeBundle,
  NotebookMetadata,
  CellMetadata,
} from "ndoctrinate-nbformat";
```

---

### Parser API

#### `class NbformatParser`

Parser class for converting nbformat JSON to nbast syntax tree.

**Constructor:**
```typescript
new NbformatParser()
```

**Methods:**

##### `parse(input, file?)`

Parse nbformat JSON (string or object) into an nbast tree.

**Parameters:**
- `input: string | INotebookContent` - Notebook JSON string or parsed object
- `file?: VFile` - Optional VFile for metadata and messages

**Returns:** `Effect.Effect<NotebookRoot, ParseError, never>`

**Example:**
```typescript
import { NbformatParser } from "ndoctrinate-nbformat";
import { Effect } from "effect";

const parser = new NbformatParser();

// Parse from JSON string
const tree = await Effect.runPromise(
  parser.parse(notebookJsonString)
);

// Parse from object
const notebookObj = JSON.parse(notebookJsonString);
const tree2 = await Effect.runPromise(parser.parse(notebookObj));
```

**Error Handling:**
```typescript
const result = await Effect.runPromise(
  parser.parse(input).pipe(
    Effect.catchTag("ParseError", (error) => {
      console.error("Parse failed:", error.message);
      return Effect.succeed(fallbackTree);
    })
  )
);
```

#### `parse(input, file?)`

Convenience function that creates a parser and parses in one step.

**Parameters:**
- `input: string | INotebookContent` - Notebook JSON to parse
- `file?: VFile` - Optional VFile

**Returns:** `Effect.Effect<NotebookRoot, ParseError, never>`

**Example:**
```typescript
import { parse } from "ndoctrinate-nbformat";
import { Effect } from "effect";

const tree = await Effect.runPromise(parse(notebookJson));
```

---

### Compiler API

#### `class NbformatCompiler`

Compiler class for converting nbast back to nbformat JSON.

**Constructor:**
```typescript
new NbformatCompiler(options?: NbformatCompilerOptions)
```

**Options:**
```typescript
interface NbformatCompilerOptions {
  pretty?: boolean;         // Pretty-print JSON (default: true)
  indent?: number;          // Indentation spaces (default: 2)
  multilineSource?: boolean; // Use string[] for cell sources (default: false)
}
```

**Methods:**

##### `compile(tree, file?)`

Compile an nbast tree to nbformat JSON string.

**Parameters:**
- `tree: NotebookRoot` - The nbast tree to compile
- `file?: VFile` - Optional VFile for metadata

**Returns:** `Effect.Effect<string, CompileError, never>`

**Example:**
```typescript
import { NbformatCompiler } from "ndoctrinate-nbformat";
import { Effect } from "effect";

// Basic usage
const compiler = new NbformatCompiler();
const json = await Effect.runPromise(compiler.compile(tree));

// With options
const compactCompiler = new NbformatCompiler({
  pretty: false,
  multilineSource: true,
});
const json2 = await Effect.runPromise(compactCompiler.compile(tree));

// Custom indentation
const fourSpaceCompiler = new NbformatCompiler({ indent: 4 });
const json3 = await Effect.runPromise(fourSpaceCompiler.compile(tree));
```

#### `compile(tree, options?, file?)`

Convenience function for compiling.

**Parameters:**
- `tree: NotebookRoot` - Tree to compile
- `options?: NbformatCompilerOptions` - Compiler options
- `file?: VFile` - Optional VFile

**Returns:** `Effect.Effect<string, CompileError, never>`

**Example:**
```typescript
import { compile } from "ndoctrinate-nbformat";
import { Effect } from "effect";

const json = await Effect.runPromise(
  compile(tree, { pretty: true, indent: 2 })
);
```

---

### Builder API

Functions for programmatically constructing nbast nodes with type safety.

#### Root Builder

##### `notebook(cells, options?)`

Create a notebook root node.

**Parameters:**
- `cells: Cell[]` - Array of cell nodes
- `options?: { nbformat?: number; nbformat_minor?: number; metadata?: NotebookMetadata }`

**Returns:** `NotebookRoot`

**Example:**
```typescript
import { notebook, markdownCell, codeCell } from "ndoctrinate-nbformat";

const nb = notebook(
  [
    markdownCell("# My Notebook"),
    codeCell("print('Hello')"),
  ],
  {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        name: "python3",
        display_name: "Python 3",
      },
    },
  }
);
```

#### Cell Builders

##### `codeCell(source, outputs?, options?)`

Create a code cell node.

**Parameters:**
- `source: string` - Source code
- `outputs?: Output[]` - Array of output nodes
- `options?: { id?: string; executionCount?: number | null; metadata?: CellMetadata }`

**Returns:** `CodeCell`

**Example:**
```typescript
import { codeCell, streamOutput } from "ndoctrinate-nbformat";

const cell = codeCell(
  "import pandas as pd\ndf = pd.DataFrame()",
  [streamOutput("DataFrame created\n")],
  {
    id: "cell-123",
    executionCount: 1,
    metadata: { tags: ["setup"] },
  }
);
```

##### `markdownCell(source, options?)`

Create a markdown cell node.

**Parameters:**
- `source: string` - Markdown source text
- `options?: { id?: string; metadata?: CellMetadata }`

**Returns:** `MarkdownCell`

**Example:**
```typescript
import { markdownCell } from "ndoctrinate-nbformat";

const cell = markdownCell(
  "## Data Analysis\n\nThis section analyzes the data.",
  {
    id: "intro",
    metadata: { tags: ["documentation"] },
  }
);
```

##### `rawCell(source, options?)`

Create a raw cell node.

**Parameters:**
- `source: string` - Raw source text
- `options?: { id?: string; format?: string; metadata?: CellMetadata }`

**Returns:** `RawCell`

**Example:**
```typescript
import { rawCell } from "ndoctrinate-nbformat";

const cell = rawCell(
  ".. note::\n   This is reStructuredText",
  {
    id: "raw-1",
    format: "text/restructuredtext",
  }
);
```

#### Output Builders

##### `streamOutput(text, stream?)`

Create a stream output node (stdout/stderr).

**Parameters:**
- `text: string` - Output text
- `stream?: "stdout" | "stderr"` - Stream name (default: "stdout")

**Returns:** `StreamOutput`

**Example:**
```typescript
import { streamOutput } from "ndoctrinate-nbformat";

const stdout = streamOutput("Execution complete\n");
const stderr = streamOutput("Warning: deprecated\n", "stderr");
```

##### `displayDataOutput(mimeBundle, options?)`

Create a display data output node.

**Parameters:**
- `mimeBundle: MimeBundle` - MIME-typed data representations
- `options?: { metadata?: Record<string, unknown> }`

**Returns:** `DisplayDataOutput`

**Example:**
```typescript
import { displayDataOutput } from "ndoctrinate-nbformat";

const output = displayDataOutput(
  {
    "text/plain": "<Figure size 640x480>",
    "image/png": "iVBORw0KGgo...", // base64 encoded
    "text/html": "<img src='...'>",
  },
  {
    metadata: { isolated: true },
  }
);
```

##### `executeResultOutput(count, mimeBundle, options?)`

Create an execute result output node.

**Parameters:**
- `executionCount: number` - Execution count when produced
- `mimeBundle: MimeBundle` - Result data in multiple formats
- `options?: { metadata?: Record<string, unknown> }`

**Returns:** `ExecuteResultOutput`

**Example:**
```typescript
import { executeResultOutput } from "ndoctrinate-nbformat";

const result = executeResultOutput(
  5,
  {
    "text/plain": "42",
    "text/html": "<strong>42</strong>",
  }
);
```

##### `errorOutput(ename, evalue, traceback)`

Create an error output node.

**Parameters:**
- `ename: string` - Exception name (e.g., "ValueError")
- `evalue: string` - Exception message
- `traceback: string[]` - Array of traceback lines

**Returns:** `ErrorOutput`

**Example:**
```typescript
import { errorOutput } from "ndoctrinate-nbformat";

const error = errorOutput(
  "NameError",
  "name 'x' is not defined",
  [
    "\u001b[0;31m---------------------------------------------------------------------------\u001b[0m",
    "\u001b[0;31mNameError\u001b[0m                                 Traceback (most recent call last)",
    "Cell \u001b[0;32mIn[3], line 1\u001b[0m\n\u001b[0;32m----> 1\u001b[0m print(\u001b[43mx\u001b[49m)\n",
    "\u001b[0;31mNameError\u001b[0m: name 'x' is not defined"
  ]
);
```

#### Convenience Builders

##### `pythonNotebook(cells, options?)`

Create a Python notebook with standard metadata.

**Parameters:**
- `cells: Cell[]` - Notebook cells
- `options?: { pythonVersion?: string; kernelName?: string }`

**Returns:** `NotebookRoot`

**Example:**
```typescript
import { pythonNotebook, codeCell, markdownCell } from "ndoctrinate-nbformat";

const nb = pythonNotebook(
  [
    markdownCell("# Python Analysis"),
    codeCell("import numpy as np"),
  ],
  {
    pythonVersion: "3.11.0",
    kernelName: "python3",
  }
);
```

##### `simpleNotebook(cellDescriptions)`

Create a notebook from simple cell descriptions.

**Parameters:**
- `cellDescriptions: Array<{type: "code"|"markdown"|"raw"; source: string; outputs?: Output[]}>`

**Returns:** `NotebookRoot`

**Example:**
```typescript
import { simpleNotebook, streamOutput } from "ndoctrinate-nbformat";

const nb = simpleNotebook([
  { type: "markdown", source: "# Hello" },
  { type: "code", source: "print('world')", outputs: [streamOutput("world\n")] },
  { type: "raw", source: "raw text" },
]);
```

##### `codeCellWithOutput(source, outputText, options?)`

Create a code cell with simple stdout output.

**Parameters:**
- `source: string` - Code source
- `outputText: string` - Output text
- `options?: { id?: string; executionCount?: number; metadata?: CellMetadata }`

**Returns:** `CodeCell`

**Example:**
```typescript
import { codeCellWithOutput } from "ndoctrinate-nbformat";

const cell = codeCellWithOutput(
  "print('Hello, World!')",
  "Hello, World!\n",
  { executionCount: 1 }
);
```

##### `codeCellWithResult(source, result, options?)`

Create a code cell with an execution result.

**Parameters:**
- `source: string` - Code source
- `result: string` - Result value as string
- `options?: { id?: string; executionCount?: number; metadata?: CellMetadata }`

**Returns:** `CodeCell`

**Example:**
```typescript
import { codeCellWithResult } from "ndoctrinate-nbformat";

const cell = codeCellWithResult(
  "2 + 2",
  "4",
  { executionCount: 1 }
);
```

##### `codeCellWithError(source, ename, evalue, traceback, options?)`

Create a code cell with an error output.

**Parameters:**
- `source: string` - Code source
- `ename: string` - Exception name
- `evalue: string` - Exception message
- `traceback: string[]` - Traceback lines
- `options?: { id?: string; executionCount?: number; metadata?: CellMetadata }`

**Returns:** `CodeCell`

**Example:**
```typescript
import { codeCellWithError } from "ndoctrinate-nbformat";

const cell = codeCellWithError(
  "undefined_var",
  "NameError",
  "name 'undefined_var' is not defined",
  ["Traceback...", "NameError: ..."]
);
```

---

### Utility API

#### Type Guards

Functions for runtime type checking of nbast nodes.

##### Node Type Guards

```typescript
// Root
isNotebookRoot(node: Node): node is NotebookRoot

// Cells
isCell(node: Node): node is Cell
isCodeCell(node: Node): node is CodeCell
isMarkdownCell(node: Node): node is MarkdownCell
isRawCell(node: Node): node is RawCell

// Outputs
isOutput(node: Node): node is Output
isStreamOutput(node: Node): node is StreamOutput
isDisplayDataOutput(node: Node): node is DisplayDataOutput
isExecuteResultOutput(node: Node): node is ExecuteResultOutput
isErrorOutput(node: Node): node is ErrorOutput
isTracebackLine(node: Node): node is TracebackLine
```

**Example:**
```typescript
import { visit } from "unist-util-visit";
import { isCodeCell, isMarkdownCell } from "ndoctrinate-nbformat";

visit(tree, (node) => {
  if (isCodeCell(node)) {
    console.log("Code:", node.data.source);
  } else if (isMarkdownCell(node)) {
    console.log("Markdown:", node.value);
  }
});
```

#### Cell Utilities

##### `getCellSource(cell: Cell): string`

Get source code/text from any cell type.

**Example:**
```typescript
import { getCellSource } from "ndoctrinate-nbformat";

const source = getCellSource(cell); // Works for code, markdown, or raw cells
```

##### `getCellId(cell: Cell): string`

Get the unique identifier from any cell.

**Example:**
```typescript
import { getCellId } from "ndoctrinate-nbformat";

const id = getCellId(cell); // Returns the cell ID
```

##### `getCellMetadata(cell: Cell): Record<string, unknown> | undefined`

Get metadata from any cell type.

**Example:**
```typescript
import { getCellMetadata } from "ndoctrinate-nbformat";

const metadata = getCellMetadata(cell);
if (metadata?.tags) {
  console.log("Tags:", metadata.tags);
}
```

##### `hasOutputs(cell: Cell): boolean`

Check if a cell has any outputs (only true for code cells with outputs).

**Example:**
```typescript
import { hasOutputs } from "ndoctrinate-nbformat";

if (hasOutputs(cell)) {
  console.log("Cell has outputs");
}
```

##### `getOutputs(cell: Cell): Output[]`

Get outputs from a cell (returns empty array for non-code cells).

**Example:**
```typescript
import { getOutputs } from "ndoctrinate-nbformat";

const outputs = getOutputs(cell);
console.log(`Cell has ${outputs.length} outputs`);
```

#### MIME Bundle Utilities

##### `getPrimaryText(mimeBundle: MimeBundle): string`

Extract the primary text/plain representation from a MIME bundle.

**Example:**
```typescript
import { getPrimaryText } from "ndoctrinate-nbformat";

const text = getPrimaryText({
  "text/plain": "Result: 42",
  "text/html": "<b>Result: 42</b>",
});
// Returns: "Result: 42"
```

##### `hasMimeType(mimeBundle: MimeBundle, mimeType: string): boolean`

Check if a MIME bundle contains a specific type.

**Example:**
```typescript
import { hasMimeType } from "ndoctrinate-nbformat";

if (hasMimeType(output.data.mimeBundle, "image/png")) {
  console.log("Output includes PNG image");
}
```

##### `getMimeTypes(mimeBundle: MimeBundle): string[]`

Get all available MIME types in a bundle.

**Example:**
```typescript
import { getMimeTypes } from "ndoctrinate-nbformat";

const types = getMimeTypes(output.data.mimeBundle);
console.log("Available formats:", types.join(", "));
```

##### `getMimeData(mimeBundle: MimeBundle, mimeType: string): unknown`

Get data for a specific MIME type.

**Example:**
```typescript
import { getMimeData } from "ndoctrinate-nbformat";

const html = getMimeData(output.data.mimeBundle, "text/html");
```

#### Source Text Utilities

##### `normalizeSource(source: string | string[]): string`

Convert multiline source (string or array) to a single string.

**Example:**
```typescript
import { normalizeSource } from "ndoctrinate-nbformat";

const text = normalizeSource(["line1\n", "line2\n", "line3"]);
// Returns: "line1\nline2\nline3"
```

##### `splitSource(source: string): string[]`

Split source text into array format (preserving newlines).

**Example:**
```typescript
import { splitSource } from "ndoctrinate-nbformat";

const lines = splitSource("line1\nline2\nline3");
// Returns: ["line1\n", "line2\n", "line3"]
```

#### Validation Utilities

##### `isValidCellId(id: string): boolean`

Validate cell ID format (1-64 alphanumeric characters, hyphens, underscores).

**Example:**
```typescript
import { isValidCellId } from "ndoctrinate-nbformat";

isValidCellId("cell-123"); // true
isValidCellId("a".repeat(65)); // false (too long)
isValidCellId("cell@invalid"); // false (invalid characters)
```

##### `generateCellId(): string`

Generate a random valid cell ID.

**Example:**
```typescript
import { generateCellId } from "ndoctrinate-nbformat";

const id = generateCellId(); // Returns something like "aB3dEf9h"
```

##### `isValidNbformatVersion(major: number, minor: number): boolean`

Validate nbformat version (must be 4.x).

**Example:**
```typescript
import { isValidNbformatVersion } from "ndoctrinate-nbformat";

isValidNbformatVersion(4, 5); // true
isValidNbformatVersion(3, 0); // false
```

## Pipeline Integration

The nbformat library integrates seamlessly with the ndoctrinate Effect-based pipeline:

```typescript
import { Processor } from "ndoctrinate-core";
import { NbformatParser, NbformatCompiler } from "ndoctrinate-nbformat";

// Create a processor
const processor = new Processor(
  new NbformatParser(),
  new NbformatCompiler()
);

// Process a notebook
const result = await Effect.runPromise(processor.process(notebookJson));

// Process with tree inspection
const [output, tree] = await Effect.runPromise(
  processor.processWithTree(notebookJson)
);
```

See the [notebook-pipeline example](../../../apps/typescript/examples/notebook-pipeline) for complete working examples.

## Integration with unist Ecosystem

nbast is fully compatible with the unist ecosystem, so you can use standard unist utilities:

```typescript
import { visit } from "unist-util-visit";
import { select, selectAll } from "unist-util-select";
import { parse } from "ndoctrinate-nbformat";
import { Effect } from "effect";

const tree = await Effect.runPromise(parse(notebookJson));

// Visit all code cells
visit(tree, "codeCell", (node) => {
  console.log(node.data.source);
});

// Select markdown cells with tags
const taggedCells = selectAll("[data.metadata.tags]", tree);

// Find first error output
const error = select("errorOutput", tree);
```

## Use Cases

### Extract All Code

```typescript
import { parse } from "ndoctrinate-nbformat";
import { visit } from "unist-util-visit";
import { Effect } from "effect";

async function extractCode(notebookJson: string): Promise<string[]> {
  const tree = await Effect.runPromise(parse(notebookJson));
  const code: string[] = [];

  visit(tree, "codeCell", (node) => {
    code.push(node.data.source);
  });

  return code;
}
```

### Clear All Outputs

```typescript
import { parse, compile } from "ndoctrinate-nbformat";
import { visit } from "unist-util-visit";
import { Effect } from "effect";

async function clearOutputs(notebookJson: string): Promise<string> {
  const tree = await Effect.runPromise(parse(notebookJson));

  visit(tree, "codeCell", (node) => {
    node.children = [];
    node.data.executionCount = null;
  });

  return await Effect.runPromise(compile(tree));
}
```

### Convert Markdown to HTML

```typescript
import { parse, compile } from "ndoctrinate-nbformat";
import { visit } from "unist-util-visit";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { Effect } from "effect";

async function convertMarkdownToHtml(notebookJson: string): Promise<string> {
  const tree = await Effect.runPromise(parse(notebookJson));

  for (const node of tree.children) {
    if (node.type === "markdownCell") {
      const html = await remark()
        .use(remarkHtml)
        .process(node.value);
      // Could convert to raw cell with HTML format
      node.value = String(html);
    }
  }

  return await Effect.runPromise(compile(tree));
}
```

## Related

- [unist](https://github.com/syntax-tree/unist) - Universal Syntax Tree specification
- [mdast](https://github.com/syntax-tree/mdast) - Markdown Abstract Syntax Tree
- [hast](https://github.com/syntax-tree/hast) - Hypertext Abstract Syntax Tree
- [nbformat](https://nbformat.readthedocs.io/) - Jupyter Notebook Format specification
- [@jupyterlab/nbformat](https://www.npmjs.com/package/@jupyterlab/nbformat) - Official nbformat TypeScript types

## License

See the main repository for license information.
