# AGENTS.md

This document provides comprehensive information about the Cibolo project for AI agents and developers working on the codebase.

## Project Overview

Cibolo is a pluggable document translation tool built using WebAssembly (WASM) and the WASM Component Model. The project enables modular, composable translation capabilities through WASM components that can be dynamically loaded and executed.

## Core Technologies

### Primary Languages & Runtimes

- **Moonbit**: Primary language for WASM component development
  - Compiles to WASM/WASM-GC, JavaScript, Native, and LLVM backends
  - Used for creating WASM components following the Component Model specification
  
- **TypeScript/JavaScript**: Host runtime and fullstack development
  - **Bun**: Fullstack toolchain serving as both bundler and runtime
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
cibolo/
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

## Development Workflow

### CLI Development

The CLI provides two main capabilities:

1. **Document Translation**: Translate documents using WASM component plugins
   - Load WASM components dynamically
   - Process documents through translation pipelines
   - Output translated documents

2. **Web Application Server**: Serve a fullstack web application
   - Bun serves as both bundler and runtime
   - Web app can interact with WASM components
   - Hot reloading and development server support

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

1. Documents are parsed into well-typed structures (parse, don't validate)
2. Parsed documents flow through WASM component pipelines
3. Components transform documents using functional transformations
4. Results are validated and output in the desired format

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

## Future Considerations

- Integration of Gleam components for additional functionality
- Python component support for ecosystem integration
- Advanced component composition patterns
- Performance optimization of WASM component execution
- Plugin system for third-party component integration

## Resources

- [Moonbit Documentation](https://www.moonbitlang.com/)
- [WASM Component Model](https://component-model.bytecodealliance.org/)
- [jco Tooling](https://github.com/bytecodealliance/jco)
- [wasm-tools](https://github.com/bytecodealliance/wasm-tools)
- [mill Build Tool](https://com-lihaoyi.github.io/mill/)
- [Bun Documentation](https://bun.sh/docs)


