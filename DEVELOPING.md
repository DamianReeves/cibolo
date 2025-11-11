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
nx run-many -t build
./projects/typescript/cli/dist/ndoctrinate version
```
- Run tests:
```bash
nx run-many -t test
```
- View project dependency graph:
```bash
nx graph
```
- See [.claude/nx-commands-guide.md](.claude/nx-commands-guide.md) for shell aliases and advanced usage.

## Overview
Ndoctrinate is a polyglot monorepo built around the WASM Component Model. Core pieces:
- **TypeScript/Bun**: CLI, web server, host runtime for WASM components.
- **MoonBit**: Primary language for component implementations compiled to WASM.
- **Rust / WASM Tools**: Tooling for component composition, optimization, binding generation.
- **Java (GraalVM)**: Native-image and potential JVM-based tooling.
- **Nx**: Workspace management and task runner with intelligent caching and dependency tracking.

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
  typescript/cli              # CLI source (Bun)
  typescript/core             # Core processing logic
  typescript/tools            # Document processors
  typescript/examples/        # Example applications
  moonbit/                    # MoonBit WASM components (planned / in progress)
  shared/                     # Shared types and schemas
  wit/                        # WIT interface definitions
```

## Nx Workspace Management

This monorepo uses Nx for intelligent task running, caching, and dependency management. Nx automatically detects project dependencies and runs tasks in the optimal order.

### Key Nx Concepts

- **Projects**: Each package in `projects/typescript/` is an Nx project
- **Targets**: Tasks like `build`, `test`, `verify`, `check` inferred from package.json scripts
- **Task Graph**: Nx builds a dependency graph and runs tasks in the correct order
- **Caching**: Successful task runs are cached; unchanged projects skip re-execution
- **Affected**: Run tasks only on projects affected by your changes

### Quick Command Reference

This project uses **direct Nx commands** instead of wrapper scripts in package.json. This is more explicit and gives you full access to Nx's features.

Run a specific target for one project:
```bash
nx run <project-name>:<target>
# Examples:
nx run ndoctrinate-core:test
nx run ndoctrinate:build
```

Run a target across all projects:
```bash
nx run-many -t <target>
# Examples:
nx run-many -t build        # Build all projects
nx run-many -t test         # Test all projects
nx run-many -t verify       # Verify all projects (type check, lint, format)
```

Run a target only on affected projects:
```bash
nx affected -t <target>
# Examples:
nx affected -t build        # Build affected projects
nx affected -t test         # Test affected projects
nx affected -t verify       # Verify affected projects
```

Utility commands:
```bash
nx graph                    # Visualize project dependency graph
nx show projects            # List all projects
nx show projects --affected # List affected projects
nx reset                    # Clear Nx cache
```

**💡 Pro Tip**: Set up shell aliases for common commands. See [.claude/nx-commands-guide.md](.claude/nx-commands-guide.md) for recommended aliases and advanced usage.

### Project Structure

Each TypeScript project has:
- `package.json` - Dependencies and npm scripts
- `project.json` - Nx configuration defining targets and their dependencies
- `src/` - Source code
- `tsconfig.json` - TypeScript configuration

### How Caching Works

Nx caches task outputs based on:
- Project source files
- Project configuration files
- Shared configuration (root `.eslintrc.json`, `.prettierrc.json`, etc.)
- Dependency project outputs (for tasks with `dependsOn`)

When you re-run a task and nothing has changed, Nx restores from cache instantly.

Example:
```bash
npx nx run ndoctrinate-core:test  # First run: executes tests
npx nx run ndoctrinate-core:test  # Second run: reads from cache
```

### Dependency Management

Projects declare dependencies in their `project.json`:
```json
{
  "targets": {
    "verify": {
      "dependsOn": ["^build"]  // Run build on dependencies first
    }
  }
}
```

The CLI project depends on `core` and `tools`, so building the CLI automatically builds its dependencies first.

## Common Developer Tasks

### Install Dependencies (TypeScript)
Bun automatically installs on first run:
```bash
bun install
```

### Run Tests
Run tests for all projects:
```bash
nx run-many -t test
# Or for a specific project:
nx run ndoctrinate-core:test
```

Run tests only on affected projects:
```bash
nx affected -t test
```

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

### Build Projects

Build all projects:
```bash
nx run-many -t build
```

Build only affected projects:
```bash
nx affected -t build
```

Build a specific project:
```bash
nx run ndoctrinate:build
```

Build CLI using Make:
```bash
make build-cli
```

Build everything using Make:
```bash
make build
```

### Verify Code Quality

Run type checking, linting, and formatting checks:
```bash
nx run-many -t verify    # All projects
nx affected -t verify    # Only affected projects
```

### Run Examples

Run the simple pipeline example:
```bash
bun run example:simple-pipeline
# Or directly:
nx run simple-pipeline-example:start
```

### Working with MoonBit Components
(When MoonBit sources present in `projects/moonbit/`)
```bash
# Compile MoonBit project (example; adjust to actual commands once added)
moon build
# Output WASM component artifacts and integrate via jco/wit-bindgen as needed.
```

### Debugging and Development Tips

Check which projects are affected by your changes:
```bash
nx show projects --affected
```

See what tasks will run for a target:
```bash
nx show project ndoctrinate-core --with-target=test
```

Run with verbose output to debug task execution:
```bash
nx run ndoctrinate-core:test --verbose
```

Skip Nx cache for debugging:
```bash
nx run ndoctrinate-core:test --skip-nx-cache
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
