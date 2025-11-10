#!/bin/bash
# Install SDK and version manager tooling
set -e

# Install git via OS package manager (as root, then switch back)
if ! command -v git >/dev/null 2>&1; then
    echo "Installing git..."
    sudo apt-get update && sudo apt-get install -y git && sudo rm -rf /var/lib/apt/lists/*
fi

# Install SDKMAN if not already installed
if [ ! -d "$HOME/.sdkman" ] && [ ! -d "/usr/local/sdkman" ]; then
    echo "Installing SDKMAN..."
    curl -s "https://get.sdkman.io" | bash
fi

# Setup SDKMAN environment
if [ -d "$HOME/.sdkman" ]; then
    export SDKMAN_DIR="$HOME/.sdkman"
elif [ -d "/usr/local/sdkman" ]; then
    export SDKMAN_DIR="/usr/local/sdkman"
    if [ ! -e "$HOME/.sdkman" ]; then
        ln -s /usr/local/sdkman "$HOME/.sdkman"
    fi
fi

: "${SDKMAN_CANDIDATES_API:=https://api.sdkman.io/2}"
: "${SDKMAN_CURRENT_API:=https://api.sdkman.io/candidates}"
if [ -s "$SDKMAN_DIR/bin/sdkman-init.sh" ]; then
    source "$SDKMAN_DIR/bin/sdkman-init.sh"
fi

# Install nvm if Node.js feature didn't install it
if [ ! -d "$HOME/.nvm" ]; then
    echo "Installing nvm..."
    export NVM_DIR="$HOME/.nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    # Install LTS Node.js
    nvm install --lts && nvm use --lts
fi

# Install proto-cli (moonrepo) - requires cargo
if ! command -v proto >/dev/null 2>&1; then
    echo "Installing proto-cli..."
    export PATH="$HOME/.cargo/bin:$PATH"
    [ -s "$HOME/.cargo/env" ] && . "$HOME/.cargo/env" || true
    cargo install proto-cli --locked || true
fi

# Set environment variables
echo "export SDKMAN_DIR=\"\$HOME/.sdkman\"" >> "$HOME/.bashrc"
echo "[[ -s \"\$HOME/.sdkman/bin/sdkman-init.sh\" ]] && source \"\$HOME/.sdkman/bin/sdkman-init.sh\"" >> "$HOME/.bashrc"
echo "export NVM_DIR=\"\$HOME/.nvm\"" >> "$HOME/.bashrc"
echo "[ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"" >> "$HOME/.bashrc"

