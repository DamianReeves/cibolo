# ndoctrinate

A pluggable document translation tool built using WebAssembly (WASM) and the WASM Component Model.

## Building

### Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- Make (for using Makefile targets)

### Building the CLI

The CLI can be built as a single-file executable that includes all dependencies and requires no external runtime.

#### Using Make

```bash
make build-cli
```

This will create a standalone executable at `projects/typescript/cli/dist/ndoctrinate`.

#### Using Bun directly

```bash
cd projects/typescript/cli
bun run build
```

The executable will be created at `dist/ndoctrinate` and can be run directly:

```bash
./dist/ndoctrinate version
```

#### Building all targets

To build all project targets:

```bash
make build
```

### Development

For development instructions and guidelines, see [AGENTS.md](./AGENTS.md).