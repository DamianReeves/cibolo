# Ndoctrinate WebAssembly Component Model Interface

This directory contains the WebAssembly Component Model interface definitions (WIT) for the Ndoctrinate document processing pipeline. These interfaces enable parsers, transformers, and compilers to be implemented in any language that can compile to WebAssembly, including MoonBit, Rust, Go, Gleam, and more.

## Overview

Ndoctrinate uses the [WebAssembly Component Model](https://github.com/WebAssembly/component-model) to create a language-agnostic, composable document processing pipeline. The WIT definitions in this directory specify the contracts that WASM components must implement to participate in the pipeline.

## Architecture

### Pipeline Flow

```
Input → Parser → AST → Transformer(s) → AST → Compiler → Output
        (WASM)         (WASM)                   (WASM)
```

- **Parser**: Converts input (text/binary) into an Abstract Syntax Tree (AST)
- **Transformer**: Modifies the AST (one or more in sequence)
- **Compiler**: Converts the AST into output format (text/binary)

### Design Principles

1. **Algebraic Data Types**: Use variants and records for type-safe data modeling
2. **Immutability**: All transformations return new data structures
3. **Composability**: Components are small, focused, and chainable
4. **Language Agnostic**: Any language that compiles to WASM can implement components
5. **Progressive Enhancement**: Start with simple implementations, extend as needed
6. **Type Safety**: Leverage WIT's type system for compile-time guarantees

## Directory Structure

```
wit/
├── README.md                    # This file
├── world.wit                    # Main world definitions
├── deps/                        # External WIT dependencies
├── types/                       # Shared type definitions
│   ├── common.wit              # Common primitives (position, point, message)
│   ├── errors.wit              # Error variants (parse, transform, compile)
│   ├── ast.wit                 # AST node types (unist-compatible)
│   └── vfile.wit               # Virtual file representation
└── components/                  # Component interfaces
    ├── parser.wit              # Parser component interface
    ├── transformer.wit         # Transformer component interface
    ├── compiler.wit            # Compiler component interface
    └── markdown-parser.wit     # Example: Markdown parser
```

## Core Types

### Virtual File (VFile)

The `virtual-file` type flows through the entire pipeline, carrying:

- File content (text or binary)
- Metadata (JSON-encoded for flexibility)
- Path information (path, base, cwd)
- Accumulated messages (warnings, errors, info)
- History tracking

```wit
record virtual-file {
  path: option<string>,
  base: option<string>,
  cwd: option<string>,
  content: file-content,          // text or binary
  data: option<metadata>,          // JSON-encoded metadata
  messages: list<message>,         // accumulated diagnostics
  history: list<history-entry>,
  modified: bool,
  source-map: option<string>,
}
```

### Abstract Syntax Tree (AST)

The AST follows the [unist specification](https://github.com/syntax-tree/unist) for universal syntax trees. It uses a hybrid approach:

1. **Structured types** for common nodes (root, text, parent, literal)
2. **Flexible JSON representation** for format-specific extensions

```wit
variant node {
  root(node-root),
  text(node-text),
  parent(node-parent),
  literal(node-literal),
  generic(node-generic),  // JSON for extensibility
}

record syntax-tree {
  root-id: node-id,
  nodes: list<tuple<node-id, node>>,
}
```

The flat structure with node IDs simplifies serialization and enables efficient tree traversal in WASM.

### Error Types

All errors are structured variants following algebraic data type principles:

```wit
variant pipeline-error {
  parse(parse-error),
  transform(transform-error),
  compile(compile-error),
}

record parse-error {
  message: string,
  position: option<position>,
  cause: option<error-cause>,
  code: option<string>,
}
```

## Component Interfaces

### Parser

Converts input into an AST.

```wit
interface parser {
  parse: func(file: virtual-file) -> result<parse-result, parse-error>;
  get-info: func() -> parser-info;
  configure: func(config: string) -> result<_, string>;
}
```

**Key Features:**

- Takes a `virtual-file` as input
- Returns `parse-result` with both tree and updated file
- Supports runtime configuration via JSON
- Provides metadata about supported formats

### Transformer

Modifies an AST.

```wit
interface transformer {
  transform: func(tree: syntax-tree, file: virtual-file)
    -> result<transform-result, transform-error>;
  get-info: func() -> transformer-info;
  configure: func(config: string) -> result<_, string>;
}
```

**Key Features:**

- Takes tree and file as input (immutable transformation)
- Returns new tree and updated file
- Can be chained with other transformers
- Declares target node types for optimization

### Compiler

Converts an AST to output format.

```wit
interface compiler {
  compile: func(tree: syntax-tree, file: virtual-file)
    -> result<compile-result, compile-error>;
  get-info: func() -> compiler-info;
  configure: func(config: string) -> result<_, string>;
}
```

**Key Features:**

- Takes tree and file as input
- Returns file with compiled content
- Supports both text and binary output
- Declares output format/MIME type

## Worlds

Worlds define what a component imports and exports. Ndoctrinate provides several world patterns:

### Specialized Components

```wit
world pipeline-parser {
  export ndoctrinate:components/parser;
  import host-capabilities;
}

world pipeline-transformer {
  export ndoctrinate:components/transformer;
  import host-capabilities;
}

world pipeline-compiler {
  export ndoctrinate:components/compiler;
  import host-capabilities;
}
```

### Combined Components

```wit
world pipeline-converter {
  export ndoctrinate:components/parser;
  export ndoctrinate:components/compiler;
  import host-capabilities;
}

world pipeline-all-in-one {
  export ndoctrinate:components/parser;
  export ndoctrinate:components/transformer;
  export ndoctrinate:components/compiler;
  import host-capabilities;
}
```

## Host Capabilities

The TypeScript/Bun host runtime provides services to WASM components:

```wit
interface host-capabilities {
  log: func(level: message-severity, message: string, source: option<string>);
  get-cwd: func() -> string;
  resolve-path: func(path: string) -> string;
  get-env: func(name: string) -> option<string>;
}
```

## Implementation Guide

### Step 1: Choose Your Language

Pick a language that can compile to WebAssembly Component Model:

- **MoonBit**: First-class WASM component support (recommended for Ndoctrinate)
- **Rust**: Use `wit-bindgen` for binding generation
- **Go**: Use TinyGo with WASI support
- **Gleam**: Compile to JavaScript, then to WASM via Bun

### Step 2: Choose Your Component Type

Decide which interface(s) to implement:

- Parser only (most common starting point)
- Transformer only (for AST modifications)
- Compiler only (for output generation)
- Combined (parser + compiler for format conversion)

### Step 3: Generate Bindings

Use language-specific tools to generate bindings from WIT:

**MoonBit:**

```bash
# MoonBit has built-in WIT support
moon build --target wasm-gc
```

**Rust:**

```bash
wit-bindgen rust ./wit
```

**Go:**

```bash
wit-bindgen tiny-go ./wit
```

### Step 4: Implement the Interface

Implement the exported functions:

**Example: Parser in MoonBit (pseudocode)**

```moonbit
// Implement the parse function
pub fn parse(file : VirtualFile) -> Result[ParseResult, ParseError] {
  // Parse the file content
  let content = file.content.as_text()?
  let tree = parse_markdown(content)?

  // Return result with tree and updated file
  Ok(ParseResult {
    tree: tree,
    file: file.with_messages(collected_messages)
  })
}

// Implement get-info
pub fn get_info() -> ParserInfo {
  ParserInfo {
    name: "markdown-parser",
    description: "CommonMark parser",
    version: "0.1.0",
    supported_formats: ["text/markdown"]
  }
}
```

### Step 5: Build and Test

Compile your component to WASM:

```bash
# MoonBit
moon build --target wasm-gc

# Rust
cargo component build --release

# Validate the component
wasm-tools validate --features component-model parser.wasm

# Inspect exports
wasm-tools component wit parser.wasm
```

### Step 6: Integrate with TypeScript Host

Use `jco` to generate TypeScript bindings:

```bash
# Generate TypeScript bindings from WASM component
jco transpile parser.wasm -o ./generated

# Use in TypeScript
import { parse } from './generated/parser.js'

const file = createVirtualFile('# Hello\nWorld')
const result = await parse(file)
```

## Examples

### Markdown Parser

See [`components/markdown-parser.wit`](./components/markdown-parser.wit) for a complete example showing:

- Markdown-specific AST node types
- Configuration options (GFM, frontmatter, math, etc.)
- How to extend the base parser interface

### Future Examples

- **AsciiDoc Parser**: Similar to Markdown but with different node types
- **DOCX Parser**: Binary input, complex structure
- **Heading ID Transformer**: Adds IDs to heading nodes
- **Link Rewriter Transformer**: Modifies URLs in link nodes
- **HTML Compiler**: Converts AST to HTML
- **PDF Compiler**: Binary output generation

## Type System Philosophy

### Why JSON for Extensibility?

The WIT definitions use a hybrid approach:

1. **Structured types** for core, stable concepts (node types, errors, positions)
2. **JSON-encoded strings** for flexible, extensible data (metadata, properties, generic nodes)

This provides:

- **Type safety** at component boundaries
- **Flexibility** for format-specific extensions
- **Simplicity** in serialization
- **Compatibility** across languages

As patterns emerge, JSON-encoded types can be promoted to structured WIT types in future versions.

### Algebraic Data Types

The interfaces heavily use WIT variants (sum types) and records (product types):

```wit
variant node {
  root(node-root),    // Discriminated union
  text(node-text),
  parent(node-parent),
  // ...
}
```

This ensures:

- **Exhaustive pattern matching** in implementing languages
- **Type-safe error handling** with `result<T, E>`
- **Clear data modeling** following functional principles

## Mapping to TypeScript

The WIT interfaces map to the existing TypeScript Effect-based pipeline:

| WIT Type                  | TypeScript Type           |
| ------------------------- | ------------------------- |
| `virtual-file`            | `VFile`                   |
| `syntax-tree`             | `Root` (unist)            |
| `node`                    | `Node` (unist)            |
| `result<T, parse-error>`  | `Effect<T, ParseError>`   |
| `parser.parse()`          | `Parser.parse()`          |
| `transformer.transform()` | `Transformer.transform()` |
| `compiler.compile()`      | `Compiler.compile()`      |

The host runtime (TypeScript) handles:

- Effect composition and execution
- Component loading and instantiation
- Pipeline orchestration
- Resource management

## Testing Components

### Unit Testing

Test WASM components in isolation:

```typescript
import { parse } from "./parser.wasm";

describe("Markdown Parser", () => {
  it("should parse headings", async () => {
    const file = createVirtualFile("# Hello");
    const result = await parse(file);

    expect(result.tree.nodes).toContainNodeType("heading");
  });
});
```

### Integration Testing

Test full pipeline with multiple components:

```typescript
const processor = new Processor()
  .use(wasmParser) // WASM markdown parser
  .use(headingIdPlugin) // TypeScript transformer
  .use(wasmCompiler); // WASM HTML compiler

const result = await processor.process("# Hello");
```

## Performance Considerations

### Memory Management

- WASM components use linear memory
- Large trees should use streaming or chunking (future work)
- The flat node structure minimizes allocation overhead

### Serialization

- VFile and AST cross the WASM boundary
- JSON encoding adds overhead but maintains flexibility
- Future optimization: binary encoding for hot paths

### Component Composition

- **Host orchestration**: TypeScript manages pipeline (current)
- **WASM linking**: Components call each other directly (future)
- Hybrid approach provides best balance

## Versioning

The WIT interfaces use semantic versioning:

```wit
package ndoctrinate:types@0.1.0
package ndoctrinate:components@0.1.0
package ndoctrinate:pipeline@0.1.0
```

Breaking changes increment the major version. Components declare version compatibility in `get-info()`.

## Future Enhancements

### Planned Features

1. **Streaming Support**: Process large documents incrementally
2. **Binary AST Encoding**: Optimize serialization overhead
3. **Schema Validation**: Structured JSON Schema for metadata
4. **Plugin Discovery**: Dynamic component loading and registration
5. **Async Transformers**: Support for async operations in WASM
6. **Resource Handles**: Share resources between components efficiently

### Potential Optimizations

- Binary encoding for AST (MessagePack, Protocol Buffers)
- Shared memory for large data structures
- Component-to-component calls without host mediation
- Lazy node materialization

## Contributing

When adding new component types:

1. Define types in `wit/types/` if shared across components
2. Define interfaces in `wit/components/`
3. Add example implementations
4. Update this README
5. Add tests

## Resources

- [WebAssembly Component Model](https://github.com/WebAssembly/component-model)
- [WIT Format Specification](https://github.com/WebAssembly/component-model/blob/main/design/mvp/WIT.md)
- [unist - Universal Syntax Tree](https://github.com/syntax-tree/unist)
- [VFile - Virtual File](https://github.com/vfile/vfile)
- [MoonBit Documentation](https://www.moonbitlang.com/docs)
- [jco - JavaScript Component Tools](https://github.com/bytecodealliance/jco)

## License

See the main repository LICENSE file.
