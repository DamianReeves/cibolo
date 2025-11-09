#!/bin/bash
# Install MoonBit compiler
set -e

# Ensure Node.js is available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
fi

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is required for MoonBit installation" >&2
    exit 1
fi

# Try official installer first, fallback to TypeScript installer
if ! curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash; then
    echo "Official installer failed, trying TypeScript installer..." >&2
    curl -fsSL https://raw.githubusercontent.com/moonbitlang/moonbit-compiler/refs/heads/main/install.ts | node
fi

# Set MOON_HOME environment variable
export MOON_HOME="$HOME/.moon"
echo "export MOON_HOME=\"\$HOME/.moon\"" >> "$HOME/.bashrc"

