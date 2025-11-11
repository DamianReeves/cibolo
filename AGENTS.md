# AGENTS.md

This document provides comprehensive information about the Ndoctrinate project for AI agents and developers working on the codebase.

## Project Overview

Ndoctrinate is a pluggable document translation tool built using WebAssembly (WASM) and the WASM Component Model. The project enables modular, composable translation capabilities through WASM components that can be dynamically loaded and executed.

## Core Technologies

### Primary Languages & Runtimes

- **Moonbit**: Primary language for WASM component development
  - Compiles to WASM/WASM-GC, JavaScript, Native, and LLVM backends
  - Used for creating WASM components following the Component Model specification
  
- **TypeScript/JavaScript**: Host runtime and fullstack development
  - **Bun**: Fullstack toolchain serving as both bundler and runtime
  - **ElysiaJS**: TypeScript backend framework for building the web application server
  - **Eden**: Type-safe client framework for ElysiaJS, providing end-to-end type safety
  - **ArkType**: Preferred TypeScript schema validation framework
    - Aligns with "parse, don't validate" principle through type-safe parsing
  - **trpc-cli**: Preferred CLI framework for command-line interface development
    - Native integration with ArkType for type-safe command-line argument parsing
    - Built on tRPC for end-to-end type safety
    - Allows reuse of ArkType schemas directly in CLI commands
  - Used for CLI development, web application, and WASM component host
  
- **Gleam**: Functional language for additional components (planned)
  
- **Python**: Additional language support (planned)

### WebAssembly Tooling

- **jco**: WebAssembly Component Model tooling for component manipulation and integration
- **wasm-tools**: WebAssembly tooling suite for component manipulation, validation, and transformation
- **WASM Component Model**: Standard for component interoperability and composition

## Architecture & Design Principles

### Functional Programming Approach

- **Functional Style**: Prefer functional programming patterns throughout
- **Algebraic Data Types (ADTs)**: Use ADTs for modeling domain concepts and error handling
- **Parse, Don't Validate**: Transform and validate data at boundaries using parsing rather than validation
  - Input data should be parsed into well-typed structures
  - Invalid data should be rejected at parse boundaries, not during processing

### Component Architecture

- **Pluggable Components**: Translation and document processing capabilities are implemented as WASM components
- **Host Runtime**: TypeScript/Bun runtime acts as the host for WASM components
- **Component Composition**: Components can be composed and chained for complex translation workflows

## Project Structure

This is a **monorepo** that supports multiple languages and their respective build systems:

```
ndoctrinate/
└── projects/
    ├── moonbit/      # Moonbit WASM components
    ├── typescript/   # TypeScript/JavaScript code (CLI, web app, host)
    ├── gleam/        # Gleam components (planned)
    ├── python/       # Python components (planned)
    ├── shared/       # Shared schemas, types, and interfaces
    └── wit/          # WebAssembly Interface Types (WIT) definitions
```

### Monorepo Organization

- All project code is organized under the `projects/` directory
- Each language has its own directory with appropriate build configuration
- The `wit/` folder contains WebAssembly Interface Types definitions used by the Component Model
- Shared interfaces and schemas are defined to ensure component interoperability

### Build System

- **mill**: Build tool used for coordinating cross-language compilation and bundling
  - Note: Using mill for monorepo build coordination is unconventional, but this project is testing the limits of mill's capabilities
  - mill orchestrates builds across Moonbit, TypeScript, and other language projects
  - Coordinates WASM component compilation, TypeScript bundling, and integration steps

- **Nx**: Workspace management and task runner for TypeScript projects
  - Provides intelligent task execution with caching and dependency tracking
  - Automatically infers tasks from package.json scripts
  - Enables affected-only builds and tests for CI optimization
  - Visualizes project dependencies through interactive graphs
  - See [Nx Workspace Management](#nx-workspace-management) section below for details

## Development Workflow

### Documentation Maintenance

- **README.md**: Keep development and build instructions up to date in the README
  - Include clear build instructions for all components
  - Document prerequisites and setup steps
  - Provide examples of common development tasks
  - Update build instructions when build processes change

### CLI Development

The CLI provides two main capabilities:

1. **Document Translation**: Translate documents using WASM component plugins
   - Load WASM components dynamically
   - Process documents through translation pipelines
   - Output translated documents

2. **Web Application Server**: Serve a fullstack web application
   - Built with ElysiaJS backend framework
   - Eden provides type-safe client-server communication
   - Bun serves as both bundler and runtime
   - Web app can interact with WASM components
   - Hot reloading and development server support

**CLI Framework Requirements:**
- **Preferred Framework**: trpc-cli
  - Native ArkType integration for type-safe command-line parsing
  - Enables reuse of existing ArkType schemas for CLI argument validation
  - Provides end-to-end type safety from CLI arguments to execution
- **Framework Selection Criteria**: Any CLI framework must integrate with ArkType and/or standard schema validation libraries
  - Ensures consistency with the "parse, don't validate" principle
  - Allows shared type definitions between CLI, API, and internal logic

### Component Development

1. **Moonbit Components**: Write translation logic in Moonbit
   - Compile to WASM Component Model format
   - Export well-defined interfaces
   - Follow functional design principles

2. **Component Integration**: Use jco to integrate components
   - Generate TypeScript bindings from WASM components
   - Compose components in the host runtime
   - Handle component lifecycle and resource management

## Testing Strategy

- **TypeScript/JavaScript**: Use Bun's built-in test runner
  - All JS/TS code must have comprehensive tests
  - Test component integration and host functionality
  
- **Moonbit**: Use Moonbit's testing framework
  - Unit tests for component logic
  - Property-based testing where appropriate
  
- **Integration Tests**: Test WASM component loading and execution
  - Verify component model compliance
  - Test cross-language interoperability

## Deployment

- **Single-File Executable**: Deploy as a single-file executable created by Bun
  - Includes all dependencies and WASM components
  - Portable and easy to distribute
  - No external runtime dependencies required

## Key Implementation Notes

### WASM Component Model Integration

- Components are developed in Moonbit and compiled to WASM Component Model format
- The TypeScript host uses jco to:
  - Generate TypeScript bindings from component interfaces
  - Load and instantiate components at runtime
  - Handle component resource management

### Data Flow

1. Documents are parsed into well-typed structures using ArkType (parse, don't validate)
2. Parsed documents flow through WASM component pipelines
3. Components transform documents using functional transformations
4. Results are validated and output in the desired format

### Schema Validation

- **ArkType**: Primary schema validation framework for TypeScript
  - Provides type-safe parsing that aligns with "parse, don't validate" principle
  - Used at API boundaries (ElysiaJS routes) and data transformation points
  - Ensures type safety from input parsing through to output

### Error Handling

- Use algebraic data types (Result/Either types) for error handling
- Errors are part of the type system, not exceptions
- Parse failures are explicit and typed

## Development Guidelines

### Code Style

- **Functional First**: Prefer functional patterns over imperative
- **Type Safety**: Leverage type systems to catch errors at compile time
- **Immutability**: Prefer immutable data structures
- **Composition**: Build complex behavior from simple, composable functions

### Component Design

- Components should be stateless where possible
- Use ADTs for component interfaces and data structures
- Components should be testable in isolation
- Document component contracts clearly

### Testing Requirements

- All public APIs must have tests
- Integration tests for component workflows
- Property-based tests for complex transformations
- Test error cases and edge conditions

## Nx Workspace Management

The TypeScript monorepo uses **Nx** for intelligent task running, caching, and dependency management. This enables fast, efficient development through computation caching and smart task execution.

### Key Features

1. **Task Inference**: Nx automatically discovers projects and infers tasks from package.json scripts
   - Each TypeScript project under `projects/typescript/` is an Nx project
   - Tasks like `build`, `test`, `verify` are inferred from package.json scripts
   - No manual configuration needed for basic tasks

2. **Intelligent Caching**: Nx caches task outputs based on file content and configuration
   - Skip re-running unchanged code
   - Cache is content-addressable (based on file hashes)
   - Shared across team members via Nx Cloud (optional)

3. **Dependency Graph**: Nx builds and maintains a project dependency graph
   - Runs tasks in correct order based on dependencies
   - Visualize with `nx graph`
   - CLI depends on core and tools libraries

4. **Affected Commands**: Run tasks only on projects affected by changes
   - `nx affected -t test` tests only what changed
   - Dramatically speeds up CI pipelines
   - Compares against a base branch (default: main)

### Command Patterns

This project uses **direct Nx commands** instead of wrapper scripts for explicitness and flexibility.

#### Single Project Tasks
```bash
nx run <project-name>:<target> [args]

# Examples:
nx run ndoctrinate-core:test          # Test core library
nx run ndoctrinate:build              # Build CLI
nx run ndoctrinate:dev version        # Run CLI with args
```

#### Multi-Project Tasks
```bash
nx run-many -t <target> [options]

# Examples:
nx run-many -t test                   # Test all projects
nx run-many -t build                  # Build all projects
nx run-many -t verify                 # Type-check & lint all
nx run-many -t test --parallel=3      # Control parallelism
```

#### Affected-Only Tasks
```bash
nx affected -t <target> [options]

# Examples:
nx affected -t test                   # Test affected projects
nx affected -t build                  # Build affected projects
nx affected -t verify --base=main     # Compare against main
```

#### Utility Commands
```bash
nx graph                              # Visualize dependencies
nx show projects                      # List all projects
nx show projects --affected           # List affected projects
nx reset                              # Clear cache
```

### Project Configuration

Each TypeScript project has two configuration files:

1. **package.json**: Defines npm scripts that Nx infers as tasks
   ```json
   {
     "scripts": {
       "test": "bun test",
       "verify": "bun run --bun tsc --noEmit && bunx prettier --check ..."
     }
   }
   ```

2. **project.json**: Nx-specific configuration for advanced control
   ```json
   {
     "name": "ndoctrinate-core",
     "targets": {
       "test": {
         "executor": "nx:run-commands",
         "options": { "command": "bun test" }
       }
     },
     "tags": ["type:library", "scope:core"]
   }
   ```

### Workspace Configuration

**nx.json** at the repository root defines:

- **Task Presets**: Inherits from `nx/presets/npm.json` for automatic task inference
- **Target Defaults**: Global configuration for caching and dependencies
  ```json
  {
    "targetDefaults": {
      "build": {
        "dependsOn": ["^build"],  // Build dependencies first
        "cache": true
      }
    }
  }
  ```
- **Named Inputs**: Define what files affect cache keys (source files, configs, etc.)
- **Affected Base**: Default branch for affected comparisons (main)

### Caching Behavior

Nx caches based on:
- Project source files (`{projectRoot}/**/*`)
- Project configuration files (package.json, project.json, tsconfig.json)
- Shared configuration (root .eslintrc.json, .prettierrc.json)
- Dependency outputs (for tasks with `dependsOn`)

**Cache Location**: `.nx/cache` (gitignored)

**Cache Operations**:
- First run: Executes and caches
- Subsequent runs: Restores from cache if inputs unchanged
- `nx reset`: Clears cache for debugging

### CI/CD Integration

Use affected commands in CI to speed up pipelines:

```yaml
# Example GitHub Actions workflow
- name: Test affected projects
  run: nx affected -t test --base=origin/main

- name: Build affected projects
  run: nx affected -t build --base=origin/main
```

This ensures CI only runs tasks on changed projects, dramatically reducing build times.

### Development Tips

1. **Shell Aliases**: Set up aliases for common commands
   ```bash
   alias nxb="nx run-many -t build"
   alias nxt="nx run-many -t test"
   alias nxta="nx affected -t test"
   alias nxg="nx graph"
   ```

2. **Project Tags**: Use tags in project.json for filtering
   ```bash
   nx run-many -t test --projects=tag:type:library
   ```

3. **Verbose Output**: Debug task execution
   ```bash
   nx run ndoctrinate-core:test --verbose
   ```

4. **Skip Cache**: Bypass cache for debugging
   ```bash
   nx run ndoctrinate-core:test --skip-nx-cache
   ```

### Documentation

- **Comprehensive Guide**: [.claude/nx-commands-guide.md](.claude/nx-commands-guide.md)
  - Detailed command patterns
  - Shell alias recommendations
  - Advanced usage examples
  - CI/CD integration patterns
  - Troubleshooting tips

- **Developer Guide**: [DEVELOPING.md](DEVELOPING.md)
  - Quick start examples
  - Common development tasks
  - Project structure details

### Important Notes for AI Agents

When working with this codebase:

1. **Use Direct Commands**: Don't add wrapper scripts to root package.json
   - Use `nx run-many -t test` instead of creating a "test" script
   - Keeps commands explicit and flexible

2. **Task Inference**: Nx automatically finds tasks from package.json
   - Adding a "build" script to a project's package.json creates an `nx run project:build` task
   - No need to manually register tasks in most cases

3. **Dependency Management**: Use `dependsOn` in project.json for task dependencies
   ```json
   {
     "targets": {
       "verify": {
         "dependsOn": ["^build"]  // Builds dependencies first
       }
     }
   }
   ```

4. **Running Tasks**: Always prefer `nx` commands over direct script execution
   - ✅ `nx run ndoctrinate-core:test` (uses cache, respects dependencies)
   - ❌ `cd projects/typescript/core && bun test` (bypasses Nx)

5. **Affected Analysis**: When suggesting CI improvements, use affected commands
   - Reduces CI time from minutes to seconds for focused changes
   - Only runs what's necessary based on changed files

## Future Considerations

- Integration of Gleam components for additional functionality
- Python component support for ecosystem integration
- Advanced component composition patterns
- Performance optimization of WASM component execution
- Plugin system for third-party component integration

## Resources

### Core Technologies
- [Moonbit Documentation](https://www.moonbitlang.com/)
- [WASM Component Model](https://component-model.bytecodealliance.org/)
- [jco Tooling](https://github.com/bytecodealliance/jco)
- [wasm-tools](https://github.com/bytecodealliance/wasm-tools)
- [Bun Documentation](https://bun.sh/docs)

### Build & Development Tools
- [mill Build Tool](https://com-lihaoyi.github.io/mill/)
- [Nx](https://nx.dev/)
- [Nx Task Pipeline Configuration](https://nx.dev/concepts/task-pipeline-configuration)
- [Nx Affected Commands](https://nx.dev/concepts/affected)

### TypeScript Frameworks
- [ElysiaJS](https://elysiajs.com/)
- [Eden](https://elysiajs.com/eden/overview.html)
- [ArkType](https://arktype.io/)
- [trpc-cli](https://github.com/mmkal/trpc-cli)


