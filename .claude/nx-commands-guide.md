# Nx Command Guide

This guide explains how to use Nx commands directly instead of through package.json wrapper scripts.

## npx nx vs nx

You'll see two ways to run Nx commands:

```bash
npx nx run-many -t test    # Always works
nx run-many -t test        # Works if nx is in PATH
```

**Use `npx nx`** if:
- You haven't installed nx globally
- You want to ensure you use the project's Nx version
- You're writing scripts/CI that should be portable

**Use bare `nx`** if:
- You've installed nx globally: `npm install -g nx`
- You've set up shell aliases (they'll use `npx` internally)
- You want shorter commands for daily development

For this guide, most examples use bare `nx` for brevity, but you can always prefix with `npx`.

## What Changed and Why

### Before (Wrapper Script Approach)
```json
// Root package.json
{
  "scripts": {
    "build": "nx run-many -t build",
    "test": "nx run-many -t test",
    "verify": "nx run-many -t verify"
  }
}
```
You ran: `bun run build` → which called → `nx run-many -t build`

### After (Direct Nx Approach)
```json
// Root package.json - minimal, only convenience scripts
{
  "scripts": {
    "cli": "nx run ndoctrinate:dev",
    "example:simple-pipeline": "nx run simple-pipeline-example:start"
  }
}
```
You run: `nx run-many -t build` directly (or use shell aliases)

## Why This Is Better

1. **More Explicit**: You see exactly what command runs
2. **Better IDE Support**: IDEs can integrate directly with Nx
3. **Less Indirection**: Fewer layers between you and the actual tool
4. **Standard Pattern**: Matches Nx documentation and community examples
5. **Flexibility**: Access full Nx CLI options without wrapper limitations

## The Command Patterns

### Pattern 1: Run Target on Single Project
```bash
nx run <project-name>:<target> [args]
```

Examples:
```bash
nx run ndoctrinate-core:test
nx run ndoctrinate:build
nx run ndoctrinate:dev version  # Pass args to the CLI
```

### Pattern 2: Run Target on All Projects
```bash
nx run-many -t <target> [options]
```

Examples:
```bash
nx run-many -t test              # Test all projects
nx run-many -t build             # Build all projects
nx run-many -t verify            # Type check + lint all projects
nx run-many -t test --parallel=3 # Run with specific parallelism
```

### Pattern 3: Run Target on Affected Projects Only
```bash
nx affected -t <target> [options]
```

Examples:
```bash
nx affected -t test              # Test only changed projects
nx affected -t build             # Build only affected projects
nx affected -t verify            # Verify only affected projects
nx affected -t test --base=main  # Compare against main branch
```

### Pattern 4: Utility Commands
```bash
nx graph                         # Visualize dependency graph
nx show projects                 # List all projects
nx show projects --affected      # List affected projects
nx reset                         # Clear Nx cache
nx daemon --stop                 # Stop Nx daemon
```

## Quick Reference Cheat Sheet

| Task | Command |
|------|---------|
| Test one project | `nx run ndoctrinate-core:test` |
| Test all projects | `nx run-many -t test` |
| Test affected only | `nx affected -t test` |
| Build all | `nx run-many -t build` |
| Build affected | `nx affected -t build` |
| Verify all | `nx run-many -t verify` |
| Verify affected | `nx affected -t verify` |
| Check all (verify + test) | `nx run-many -t check` |
| Run CLI in dev mode | `bun run cli` or `nx run ndoctrinate:dev` |
| Run example | `bun run example:simple-pipeline` |
| View dependency graph | `nx graph` |
| List all projects | `nx show projects` |
| Clear cache | `nx reset` |

## Shell Aliases (Recommended)

Add these to your `~/.bashrc`, `~/.zshrc`, or `~/.config/fish/config.fish`:

### Bash/Zsh
```bash
# Nx shortcuts
alias nxb="nx run-many -t build"
alias nxt="nx run-many -t test"
alias nxv="nx run-many -t verify"
alias nxc="nx run-many -t check"
alias nxba="nx affected -t build"
alias nxta="nx affected -t test"
alias nxva="nx affected -t verify"
alias nxg="nx graph"
alias nxp="nx show projects"
alias nxr="nx reset"
```

### Fish Shell
```fish
# Nx shortcuts
alias nxb="nx run-many -t build"
alias nxt="nx run-many -t test"
alias nxv="nx run-many -t verify"
alias nxc="nx run-many -t check"
alias nxba="nx affected -t build"
alias nxta="nx affected -t test"
alias nxva="nx affected -t verify"
alias nxg="nx graph"
alias nxp="nx show projects"
alias nxr="nx reset"
```

Then reload your shell:
```bash
source ~/.bashrc  # or ~/.zshrc for zsh
```

Now you can use short commands:
```bash
nxt      # Test all projects
nxta     # Test affected projects
nxb      # Build all projects
nxba     # Build affected projects
nxg      # View graph
```

## Advanced Usage

### Running Multiple Targets
```bash
# Run test and build on all projects
nx run-many -t test,build

# Run on affected projects
nx affected -t test,build
```

### Filtering by Tags
Projects can be tagged in their `project.json`:
```json
{
  "tags": ["type:library", "scope:core"]
}
```

Then filter:
```bash
nx run-many -t test --projects=tag:type:library
nx affected -t build --exclude=tag:type:example
```

### Verbose Output
```bash
nx run-many -t test --verbose
nx affected -t build --verbose
```

### Skip Cache
```bash
nx run-many -t test --skip-nx-cache
nx run ndoctrinate:build --skip-nx-cache
```

### Parallel Execution Control
```bash
nx run-many -t test --parallel=3      # Max 3 tasks at once
nx run-many -t test --parallel=false  # Sequential execution
```

## How Task Inference Works

Because your `nx.json` has `"extends": "nx/presets/npm.json"`, Nx automatically:

1. **Discovers projects** from workspace packages in package.json
2. **Infers tasks** from each project's package.json scripts
3. **Applies rules** from nx.json's `targetDefaults`

Example - the `ndoctrinate-core` project:
```json
// projects/typescript/core/package.json
{
  "scripts": {
    "test": "bun test",
    "verify": "bun run --bun tsc --noEmit && ..."
  }
}
```

Nx sees these scripts and creates:
- `nx run ndoctrinate-core:test` → runs `bun test`
- `nx run ndoctrinate-core:verify` → runs the verify script

The `targetDefaults` in nx.json then add:
- Caching for these targets
- Dependency rules (e.g., verify depends on ^build)

## When to Use project.json

You still have `project.json` files for:
- Custom executors beyond package.json scripts
- Complex target configurations
- Explicit control over caching inputs/outputs

The hybrid approach gives you:
- Simple tasks: Use package.json scripts (auto-inferred)
- Complex tasks: Use project.json (explicit config)

## CI/CD Integration

In your CI pipeline, you can use affected commands to only test/build what changed:

```yaml
# .github/workflows/ci.yml
- name: Test affected
  run: nx affected -t test --base=origin/main

- name: Build affected
  run: nx affected -t build --base=origin/main
```

This dramatically speeds up CI for large monorepos.

## Troubleshooting

### "Cannot find project"
Run `nx show projects` to see all available projects.

### "Cannot find target"
Check the project's package.json scripts or project.json targets.
Run `nx show project <name> --web` to see all targets.

### Cache issues
Clear the cache with `nx reset`.

### Nx daemon issues
Stop the daemon: `nx daemon --stop`

## Further Reading

- [Nx Task Pipeline Configuration](https://nx.dev/concepts/task-pipeline-configuration)
- [Nx Run Commands](https://nx.dev/nx-api/nx/executors/run-commands)
- [Nx Affected](https://nx.dev/concepts/affected)
