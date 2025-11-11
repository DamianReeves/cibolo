# Code Formatting Guide

This project uses a **hybrid formatting approach** that combines script-based and Nx-native formatting strategies.

## Overview

We use:
- **Prettier** for code formatting (automatic fixing)
- **ESLint** for linting (automatic fixing)
- **TypeScript** for type checking (verification only)
- **Nx** for task orchestration and caching

## The Hybrid Approach

### Script-Based (Primary Method)

Each TypeScript project has `format` and `lint` scripts in its package.json:

```json
{
  "scripts": {
    "format": "bunx prettier --write \"src/**/*.{ts,tsx,json}\"",
    "lint": "bunx eslint --config ../../../.eslintrc.json \"src/**/*.{ts,tsx}\" --fix",
    "verify": "bun run --bun tsc --noEmit && bunx prettier --check ... && bunx eslint ..."
  }
}
```

**When to use:**
- Formatting specific projects
- Customizing formatting per project
- Running as part of task pipelines

### Nx Native (Future Option)

Nx provides workspace-level `nx format:write` and `nx format:check` commands.

**When to use:**
- Formatting only changed files workspace-wide
- CI formatting checks
- Pre-commit hooks

## Common Tasks

### Format Code

#### Single Project
```bash
nx run ndoctrinate-core:format
nx run ndoctrinate:format
nx run ndoctrinate-tools:format
```

#### All Projects
```bash
nx run-many -t format
```

#### Only Changed Projects
```bash
nx affected -t format
```

#### Specific Files (with Nx native)
```bash
# Requires Nx native setup (future)
nx format:write --files="src/app.ts,src/utils.ts"
```

### Fix Lint Issues

#### Single Project
```bash
nx run ndoctrinate-core:lint
```

#### All Projects
```bash
nx run-many -t lint
```

#### Only Changed Projects
```bash
nx affected -t lint
```

### Combined Workflow

```bash
# Format then lint all projects
nx run-many -t format && nx run-many -t lint

# Format then lint only affected
nx affected -t format && nx affected -t lint

# Verify everything is clean
nx run-many -t verify
```

## Verification (Read-Only)

The `verify` target checks without modifying files:

```bash
# Check all projects
nx run-many -t verify

# Check only affected
nx affected -t verify

# Check specific project
nx run ndoctrinate-core:verify
```

This runs:
1. TypeScript type checking (`tsc --noEmit`)
2. Prettier formatting check (`prettier --check`)
3. ESLint linting (`eslint` without `--fix`)

## Configuration Files

### Project-Level
Each project's package.json defines its scripts (format, lint, verify).

### Workspace-Level
- `.prettierrc.json` - Prettier rules
- `.eslintrc.json` - ESLint rules
- `nx.json` - Nx caching configuration

## Caching

Nx caches format and lint operations:

```bash
# First run: executes
nx run ndoctrinate-core:format

# Second run: uses cache (instant)
nx run ndoctrinate-core:format
```

Cache is based on:
- Source file content
- Configuration files (.prettierrc.json, .eslintrc.json)
- Package.json scripts

Clear cache:
```bash
nx reset
```

## CI/CD Integration

### Pull Request Checks

```yaml
# .github/workflows/pr.yml
- name: Check formatting
  run: nx affected -t verify --base=origin/main
```

### Pre-Commit Workflow

```bash
# Format and lint staged changes
nx affected -t format --base=HEAD~1
nx affected -t lint --base=HEAD~1
git add -u
```

### Pre-Push Workflow

```bash
# Verify everything before push
nx affected -t verify --base=origin/main
```

## Shell Aliases

Add to `~/.bashrc`, `~/.zshrc`, or `~/.config/fish/config.fish`:

```bash
# Format
alias nxf="nx run-many -t format"
alias nxfa="nx affected -t format"

# Lint
alias nxl="nx run-many -t lint"
alias nxla="nx affected -t lint"

# Format + Lint
alias nxfix="nx run-many -t format && nx run-many -t lint"
alias nxfixa="nx affected -t format && nx affected -t lint"

# Verify
alias nxv="nx run-many -t verify"
alias nxva="nx affected -t verify"
```

Then use:
```bash
nxf      # Format all
nxfa     # Format affected
nxfix    # Format + lint all
nxva     # Verify affected
```

## What Gets Formatted

Current patterns in scripts:
- `**/*.ts` - TypeScript files
- `**/*.tsx` - TypeScript + JSX files
- `**/*.json` - JSON files

To add more file types, update the `format` script in project's package.json:

```json
{
  "scripts": {
    "format": "bunx prettier --write \"src/**/*.{ts,tsx,json,md,yaml}\""
  }
}
```

## Comparison: Script-Based vs Nx Native

| Feature | Script-Based (Current) | Nx Native |
|---------|----------------------|-----------|
| Command | `nx run-many -t format` | `nx format:write` |
| Scope | Per-project | Workspace-wide |
| Customization | Easy (per-project) | Global |
| Setup | Simple | Requires plugin |
| File detection | Project globs | Changed files |
| Duplicate work | Possible | None |
| Caching | ✅ Yes | ✅ Yes |

## Best Practices

1. **Format before committing**
   ```bash
   nx affected -t format --base=HEAD~1
   ```

2. **Lint after formatting**
   ```bash
   nx run-many -t format && nx run-many -t lint
   ```

3. **Verify before pushing**
   ```bash
   nx affected -t verify --base=origin/main
   ```

4. **Use affected commands in CI**
   ```bash
   nx affected -t verify --base=origin/main
   ```

5. **Clear cache when debugging**
   ```bash
   nx reset
   ```

## Troubleshooting

### "No files found"
Check your glob patterns in package.json scripts match your file structure.

### "Format keeps changing files"
- Ensure `.prettierrc.json` and `.eslintrc.json` don't conflict
- Check `eslint-config-prettier` is installed to disable conflicting ESLint rules

### "Cache not working"
- Verify `format` and `lint` are in nx.json's `cacheableOperations`
- Check file patterns in `namedInputs`
- Clear cache: `nx reset`

### "Want to format only specific files"
Use Prettier directly:
```bash
bunx prettier --write "src/specific-file.ts"
```

Or add Nx native format support (see below).

## Future: Adding Nx Native Format

To add workspace-level formatting:

1. **Install plugin** (if not using @nx/js already):
   ```bash
   bun add -D @nx/eslint
   ```

2. **Use Nx format commands**:
   ```bash
   nx format:write                    # All files
   nx format:write --uncommitted      # Uncommitted files
   nx format:check                    # Check only
   ```

3. **Keep script-based for per-project control**

This gives you both approaches!

## Related Documentation

- [DEVELOPING.md](../DEVELOPING.md) - Developer workflow guide
- [.claude/nx-commands-guide.md](nx-commands-guide.md) - Nx command reference
- [.prettierrc.json](../.prettierrc.json) - Prettier configuration
- [.eslintrc.json](../.eslintrc.json) - ESLint configuration
