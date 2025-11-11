# Ndoctrinate Client

React-based frontend client for Ndoctrinate document processing.

## Features

- **React 18**: Modern React with hooks
- **Vite**: Fast development server and optimized builds
- **TypeScript**: Full type safety
- **Effect**: Functional error handling and async operations
- **API Integration**: Connected to ElysiaJS backend

## Development

```bash
# Start development server
nx run ndoctrinate-client:dev

# Build for production
nx run ndoctrinate-client:build

# Preview production build
nx run ndoctrinate-client:preview

# Run tests
nx run ndoctrinate-client:test

# Verify code quality
nx run ndoctrinate-client:verify

# Run all checks
nx run ndoctrinate-client:check
```

## Architecture

- **Dev Server**: Runs on port 5173
- **API Proxy**: `/api` routes are proxied to backend at `http://localhost:3000`
- **Hot Module Replacement**: Instant updates during development

## Dependencies

- **Shared workspace packages**:
  - `ndoctrinate-core`: Core types and interfaces

- **External packages**:
  - `react`: UI library
  - `react-dom`: React DOM renderer
  - `vite`: Build tool
  - `@vitejs/plugin-react`: React plugin for Vite
  - `effect`: Functional programming utilities

## Backend Integration

The client communicates with the Ndoctrinate backend API:
- Backend runs on `http://localhost:3000`
- API endpoints available at `/api/*`
- Swagger documentation at `http://localhost:3000/swagger`

## Getting Started

1. Ensure the backend is running:
   ```bash
   nx run ndoctrinate-backend:dev
   ```

2. Start the frontend dev server:
   ```bash
   nx run ndoctrinate-client:dev
   ```

3. Open your browser to `http://localhost:5173`
