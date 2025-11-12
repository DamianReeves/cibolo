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

### Parser

#### `NbformatParser`

Class for parsing nbformat JSON to nbast.

```typescript
import { NbformatParser } from "ndoctrinate-nbformat";
import { Effect } from "effect";

const parser = new NbformatParser();
const tree = await Effect.runPromise(parser.parse(jsonString));
```

#### `parse(input, file?)`

Convenience function for parsing.

```typescript
import { parse } from "ndoctrinate-nbformat";

const tree = await Effect.runPromise(parse(jsonString));
```

### Compiler

#### `NbformatCompiler`

Class for compiling nbast to nbformat JSON.

```typescript
import { NbformatCompiler } from "ndoctrinate-nbformat";
import { Effect } from "effect";

const compiler = new NbformatCompiler({
  pretty: true, // Pretty-print JSON (default: true)
  indent: 2, // Indentation spaces (default: 2)
  multilineSource: false, // Use string[] for sources (default: false)
});

const json = await Effect.runPromise(compiler.compile(tree));
```

#### `compile(tree, options?, file?)`

Convenience function for compiling.

```typescript
import { compile } from "ndoctrinate-nbformat";

const json = await Effect.runPromise(
  compile(tree, {
    pretty: true,
    indent: 2,
  })
);
```

### Builders

Functions for constructing nbast nodes:

- `notebook(cells, options?)` - Create notebook root
- `codeCell(source, outputs?, options?)` - Create code cell
- `markdownCell(source, options?)` - Create markdown cell
- `rawCell(source, options?)` - Create raw cell
- `streamOutput(text, stream?)` - Create stream output
- `displayDataOutput(mimeBundle, options?)` - Create display data
- `executeResultOutput(count, mimeBundle, options?)` - Create execute result
- `errorOutput(ename, evalue, traceback)` - Create error output

Convenience builders:

- `pythonNotebook(cells, options?)` - Create Python notebook with metadata
- `simpleNotebook(cellDescriptions)` - Create notebook from simple descriptions
- `codeCellWithOutput(source, outputText, options?)` - Code cell with stream output
- `codeCellWithResult(source, result, options?)` - Code cell with execute result
- `codeCellWithError(source, ename, evalue, traceback, options?)` - Code cell with error

### Utilities

Type guards:

- `isNotebookRoot(node)` - Check if node is notebook root
- `isCell(node)` - Check if node is any cell type
- `isCodeCell(node)` - Check if node is code cell
- `isMarkdownCell(node)` - Check if node is markdown cell
- `isRawCell(node)` - Check if node is raw cell
- `isOutput(node)` - Check if node is any output type
- `isStreamOutput(node)` - Check if node is stream output
- `isDisplayDataOutput(node)` - Check if node is display data output
- `isExecuteResultOutput(node)` - Check if node is execute result output
- `isErrorOutput(node)` - Check if node is error output

Helper functions:

- `getCellSource(cell)` - Get source from any cell type
- `getCellId(cell)` - Get cell ID
- `getCellMetadata(cell)` - Get cell metadata
- `hasOutputs(cell)` - Check if cell has outputs
- `getOutputs(cell)` - Get outputs from cell
- `getPrimaryText(mimeBundle)` - Get text/plain from MIME bundle
- `hasMimeType(mimeBundle, type)` - Check for MIME type
- `getMimeTypes(mimeBundle)` - Get all MIME types
- `generateCellId()` - Generate valid cell ID
- `isValidCellId(id)` - Validate cell ID format

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
