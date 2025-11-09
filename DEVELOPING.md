# Developing Ndoctrinate

This guide provides practical instructions for setting up a development environment, using the Dev Container, building the monorepo components, and working with the WebAssembly toolchain.

## TL;DR
- Open in VS Code → "Dev Containers: Reopen in Container".
- Or build and run the dev image locally:
```bash
make docker-build
make docker-run
```
- Build CLI and run a quick sanity check:
```bash
make build-cli
./projects/typescript/cli/dist/ndoctrinate version
```
- Run tests:
```bash
bun test
```

## Overview
Ndoctrinate is a polyglot monorepo built around the WASM Component Model. Core pieces:
- **TypeScript/Bun**: CLI, web server, host runtime for WASM components.
- **MoonBit**: Primary language for component implementations compiled to WASM.
- **Rust / WASM Tools**: Tooling for component composition, optimization, binding generation.
- **Java (GraalVM)**: Native-image and potential JVM-based tooling.

## Dev Container Usage
A `.devcontainer/Dockerfile` provides a reproducible environment. It includes:
- Node (nvm), Bun, Rust (cargo), Java (GraalVM via SDKMAN), MoonBit
- WASM-related tools: `wasm-tools`, `wasm-opt` (binaryen), `wit-bindgen-cli`, `wac`, `jco`
- Proto (moonrepo), native-image (if available)

### Opening in VS Code
1. Install the **Dev Containers** extension.
2. Open the repository folder in VS Code.
3. Command Palette → "Dev Containers: Reopen in Container".
4. Wait for build to finish (subsequent opens are faster due to layer caching).

### Customizing Tool Versions
The Dockerfile defines build args for pinning versions:
- `WASM_TOOLS_VERSION`
- `WIT_BINDGEN_VERSION`
- `WAC_VERSION`
- `JCO_VERSION`
- `GRAALVM_PREFERRED` (e.g. `oracle`, `graalvm`, or a specific match token)

Example build with pins:
```bash
docker build \
  --build-arg WASM_TOOLS_VERSION=1.0.0 \
  --build-arg WIT_BINDGEN_VERSION=0.23.1 \
  --build-arg WAC_VERSION=0.2.0 \
  --build-arg JCO_VERSION=0.10.5 \
  --build-arg GRAALVM_PREFERRED=oracle \
  -f .devcontainer/Dockerfile -t ndoctrinate-dev .
```
Then start a container:
```bash
docker run -it --rm -v "$PWD:/workspace" -w /workspace ndoctrinate-dev bash
```

Alternatively with Make targets:
```bash
make docker-build BUILD_ARGS='--build-arg WIT_BINDGEN_VERSION=0.23.1'
make docker-run
```

## Manual Docker Build (Outside VS Code)
If you prefer not to use a Dev Container:
```bash
docker build -f .devcontainer/Dockerfile -t ndoctrinate-dev .
```
Run a shell inside:
```bash
docker run -it --rm -v "$PWD:/workspace" -w /workspace ndoctrinate-dev bash
```

### Make Targets (helpers)
Common helper targets are available in the `Makefile`:

- Build dev image (un-pinned):
```bash
make docker-build
```
- Build dev image with default pins (reproducible):
```bash
make docker-build-pinned
```
- Build with BuildKit caches (faster for cargo):
```bash
make docker-buildx
make docker-buildx-pinned
```
- Run a shell in the image with the repo mounted:
```bash
make docker-run
```
- Override pins or pass custom args:
```bash
make docker-build BUILD_ARGS='--build-arg WIT_BINDGEN_VERSION=0.23.1'
```

## Monorepo Layout
```
projects/
  typescript/cli        # CLI source (Bun)
  typescript/core       # Core processing logic
  typescript/tools      # Document processors
  moonbit/              # MoonBit WASM components (planned / in progress)
  shared/               # Shared types and schemas
  wit/                  # WIT interface definitions
```

## Common Developer Tasks
### Install Dependencies (TypeScript)
Bun automatically installs on first run:
```bash
bun install
```

### Run Tests (TypeScript)
```bash
bun test
```
(Or use `make test` if provided.)

Shorthand via Make:
```bash
make test
```

### Run Integration Tests
Focused integration tests exist for the CLI build flow:
```bash
# From repo root
bun test projects/typescript/cli/src/build.integration.test.ts
```
You can still run the entire suite with `bun test` if preferred.

Shorthand via Make:
```bash
make itest
```

### Build CLI
Using Make:
```bash
make build-cli
```
Or directly:
```bash
cd projects/typescript/cli
bun run build
./dist/ndoctrinate version
```

### Build Everything
```bash
make build
```

### Working with MoonBit Components
(When MoonBit sources present in `projects/moonbit/`)
```bash
# Compile MoonBit project (example; adjust to actual commands once added)
moon build
# Output WASM component artifacts and integrate via jco/wit-bindgen as needed.
```

### WASM Tooling
- Generate TypeScript bindings from WIT:
```bash
wit-bindgen js --world your-world --wit wit/ -o generated/
```
- Inspect / compose components:
```bash
wasm-tools component new input.wasm -o component.wasm
wac compose pipeline.wac -o composed.wasm
```
- Optimize binaries:
```bash
wasm-opt -O3 component.wasm -o component.opt.wasm
```
- Use jco for Component Model operations:
```bash
jco transpile component.wasm -o ts-bindings/
```

### Updating GraalVM / Java
Inside container:
```bash
source "$SDKMAN_DIR/bin/sdkman-init.sh"
sdk list java
sdk install java <identifier>
sdk default java <identifier>
```
If you need a different preference, rebuild with `--build-arg GRAALVM_PREFERRED=<token>`.

### Native Image
If `gu` installed native-image:
```bash
native-image --version
```
Build a binary (example):
```bash
native-image -jar your-app.jar
```

## Environment Variables
Key env vars set in container:
- `JAVA_HOME` → GraalVM install
- `MOON_HOME` → MoonBit home
- `SDKMAN_DIR` → SDKMAN root
- `PATH` includes proto, bun, GraalVM, installed cargo bins.

## Caching Notes
Cargo builds use BuildKit cache mounts in the Dockerfile; rebuild with `docker buildx` for best performance.
```bash
docker buildx build -f .devcontainer/Dockerfile -t ndoctrinate-dev .
```

## Troubleshooting
| Issue | Possible Fix |
|-------|--------------|
| Missing tool in PATH | Reopen container; ensure installs finished without errors. |
| Slow rebuilds | Use BuildKit `docker buildx` and keep version pins stable. |
| GraalVM not selected | Verify `GRAALVM_PREFERRED` arg or run `sdk default java <id>`. |
| Bun not found | Ensure the initial RUN layer completed; check `$HOME/.bun/bin` in PATH. |

## Contributing Workflow
1. Open dev container.
2. Create feature branch.
3. Implement changes with tests.
4. Run builds: `make build`.
5. Run tests: `bun test` (and MoonBit tests when available).
6. Commit and open PR.

## Updating Tools
Rebuild with new pins:
```bash
docker build \
  --build-arg WASM_TOOLS_VERSION=1.1.0 \
  --build-arg WIT_BINDGEN_VERSION=0.24.0 \
  --build-arg WAC_VERSION=0.3.0 \
  --build-arg JCO_VERSION=0.11.0 \
  -f .devcontainer/Dockerfile -t ndoctrinate-dev .
```

## Further Reading
- See `AGENTS.md` for architectural philosophy.
- Explore `wit/` for component interface definitions.

---
Feel free to extend this guide with language-specific deep dives as MoonBit and other components mature.
