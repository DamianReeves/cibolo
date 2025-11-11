# Ndoctrinate Backend

ElysiaJS-based backend API for Ndoctrinate document processing.

## Features

- **ElysiaJS**: Fast and type-safe web framework
- **Swagger/OpenAPI**: Automatic API documentation
- **CORS**: Configured for local development
- **Effect**: Functional error handling and async operations
- **TypeScript**: Full type safety

## Development

```bash
# Start development server with hot reload
nx run ndoctrinate-backend:dev

# Build for production
nx run ndoctrinate-backend:build

# Run production build
nx run ndoctrinate-backend:start

# Run tests
nx run ndoctrinate-backend:test

# Verify code quality
nx run ndoctrinate-backend:verify

# Run all checks
nx run ndoctrinate-backend:check
```

## API Documentation

When running, Swagger documentation is available at:
- http://localhost:3000/swagger

## Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/examples` - Example endpoints (demonstrating structure)

## Dependencies

- **Shared workspace packages**:
  - `ndoctrinate-core`: Core types and interfaces
  - `ndoctrinate-tools`: Document processing tools

- **External packages**:
  - `elysia`: Web framework
  - `@elysiajs/swagger`: API documentation
  - `@elysiajs/cors`: CORS support
  - `effect`: Functional programming utilities
