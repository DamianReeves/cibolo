#!/bin/bash
# Install Bun
set -e

# Install Bun via official installer
curl -fsSL https://bun.sh/install | bash

# Set environment variables
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Add to bashrc if not already present
if ! grep -q "BUN_INSTALL" "$HOME/.bashrc" 2>/dev/null; then
    echo 'export BUN_INSTALL="$HOME/.bun"' >> "$HOME/.bashrc"
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> "$HOME/.bashrc"
fi

