#!/bin/bash
# Install WASM tooling
set -e

# Install wasm-opt (Binaryen) via apt
if ! command -v wasm-opt >/dev/null 2>&1; then
    echo "Installing wasm-opt (Binaryen)..."
    sudo apt-get update && sudo apt-get install -y binaryen
fi

# Setup cargo environment
export PATH="$HOME/.cargo/bin:$PATH"
[ -s "$HOME/.cargo/env" ] && . "$HOME/.cargo/env" || true

# Install wasm-tools via cargo
if ! command -v wasm-tools >/dev/null 2>&1; then
    echo "Installing wasm-tools..."
    cargo install wasm-tools --locked || true
fi

# Install wit-bindgen-cli via cargo
if ! command -v wit-bindgen >/dev/null 2>&1; then
    echo "Installing wit-bindgen-cli..."
    cargo install wit-bindgen-cli --locked || true
fi

# Install wac via cargo (try both crate names)
if ! command -v wac >/dev/null 2>&1; then
    echo "Installing wac..."
    cargo install wac --locked || cargo install wac-cli --locked || true
fi

# Setup bun environment
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Install jco via bun
if ! command -v jco >/dev/null 2>&1; then
    echo "Installing jco..."
    bun add -g @bytecodealliance/jco || true
fi

