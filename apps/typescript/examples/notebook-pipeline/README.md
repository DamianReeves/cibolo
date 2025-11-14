# Notebook Pipeline Example

This example demonstrates how to process Jupyter notebooks using the `ndoctrinate-nbformat` library with the Effect-based processing pipeline.

## Features Demonstrated

1. **Clear Outputs** - Remove all outputs from code cells
2. **Extract Code** - Convert notebook to Python script
3. **Add Tags** - Programmatically tag cells
4. **Pipeline Transformation** - Full parse → transform → compile workflow
5. **Notebook Analysis** - Extract statistics and insights

## Running the Example

```bash
bun run start
```

Or with watch mode:

```bash
bun run dev
```

## What It Shows

### Example 1: Clear All Outputs
Demonstrates how to remove execution outputs and reset execution counts across all code cells.

### Example 2: Extract Code to Python Script
Shows how to extract just the code cells and combine them into a standalone Python script.

### Example 3: Add Tags to Cells
Illustrates programmatic metadata manipulation by adding tags to cells.

### Example 4: Full Pipeline Transformation
Complete workflow showing:
- Parsing notebook JSON to nbast
- Transforming the syntax tree
- Compiling back to notebook JSON

### Example 5: Notebook Analysis
Statistical analysis of notebook structure:
- Cell type counts
- Code line counts
- Library imports
- Execution status

## Key Concepts

### Using the Parser
```typescript
import { NbformatParser, parse } from "ndoctrinate-nbformat";

const tree = await Effect.runPromise(parse(notebookJson));
```

### Transforming with unist-util-visit
```typescript
import { visit } from "unist-util-visit";

visit(tree, "codeCell", (node: CodeCell) => {
  // Transform code cells
  node.children = []; // Clear outputs
});
```

### Compiling Back to JSON
```typescript
import { compile } from "ndoctrinate-nbformat";

const json = await Effect.runPromise(compile(tree));
```

### Pipeline Integration
```typescript
import { Processor } from "ndoctrinate-core";
import { NbformatParser, NbformatCompiler } from "ndoctrinate-nbformat";

const processor = new Processor(
  new NbformatParser(),
  new NbformatCompiler()
);

const result = await Effect.runPromise(processor.process(input));
```

## Learn More

- [ndoctrinate-nbformat README](../../../../libs/typescript/nbformat/README.md)
- [Jupyter Notebook Format](https://nbformat.readthedocs.io/)
- [unist Specification](https://github.com/syntax-tree/unist)
- [Effect Documentation](https://effect.website/)
