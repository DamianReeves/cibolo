# Simple Pipeline Example

This example demonstrates how to use the Effect-based processing pipeline to process content through parsers, transformers, and compilers.

## Overview

The pipeline follows the unified architecture:

```
Input -> Parser -> Syntax Tree -> Transformers -> Syntax Tree -> Compiler -> Output
```

## Components

- **Parser**: Converts input string into a syntax tree (AST)
- **Transformers**: Modify the syntax tree (uppercase text, prefix headings)
- **Compiler**: Converts the syntax tree back to output string

## Running the Example

```bash
bun run start
```

Or directly:

```bash
bun run src/index.ts
```

## What It Does

1. Parses markdown-like input into a simple AST
2. Applies two transformers:
   - Uppercases all text content
   - Adds `[IMPORTANT]` prefix to headings
3. Compiles the transformed AST back to text
4. Shows both the output and the final AST structure

## Example Output

The example processes this input:

```markdown
# Hello World

This is a simple paragraph.

# Another Heading

More content here.
```

And produces:

```markdown
# [IMPORTANT] HELLO WORLD

THIS IS A SIMPLE PARAGRAPH.

# [IMPORTANT] ANOTHER HEADING

MORE CONTENT HERE.
```

