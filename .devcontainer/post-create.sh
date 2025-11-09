#!/bin/bash
set -e  # Exit on error
set -x  # Echo commands to console

echo "=== Post-Create Setup ==="

# Ensure unzip is available (required for some installations)
if ! command -v unzip &> /dev/null; then
    echo "Installing unzip..."
    sudo apt-get update && sudo apt-get install -y unzip
fi

# Ensure MOON_HOME is set and added to .bashrc
export MOON_HOME="$HOME/.moon"
if ! grep -q "MOON_HOME" ~/.bashrc 2>/dev/null; then
    echo 'export MOON_HOME="$HOME/.moon"' >> ~/.bashrc
    echo "Added MOON_HOME to .bashrc"
fi

# Add moon binaries to PATH
if ! grep -q "\$MOON_HOME/bin" ~/.bashrc 2>/dev/null; then
    echo 'export PATH="$MOON_HOME/bin:$PATH"' >> ~/.bashrc
    echo "Added moon binaries to PATH in .bashrc"
fi

# Print tool versions for verification
echo "=== Tool Versions ==="
echo -n "Node: "; node --version || echo "not installed"
echo -n "Bun: "; bun --version || echo "not installed"
echo -n "Rust: "; rustc --version || echo "not installed"
echo -n "Cargo: "; cargo --version || echo "not installed"
echo -n "Java: "; java -version 2>&1 | head -1 || echo "not installed"
if command -v moon >/dev/null 2>&1; then echo -n "MoonBit: "; moon --version || true; fi
if command -v proto >/dev/null 2>&1; then echo -n "proto-cli: "; proto --version || true; fi
if command -v wasm-opt >/dev/null 2>&1; then echo -n "wasm-opt: "; wasm-opt --version || true; fi
if command -v wasm-tools >/dev/null 2>&1; then echo -n "wasm-tools: "; wasm-tools --version || true; fi
if command -v wit-bindgen >/dev/null 2>&1; then echo -n "wit-bindgen-cli: "; wit-bindgen --version || true; fi
if command -v wac >/dev/null 2>&1; then echo -n "wac: "; wac --version || true; fi
if command -v jco >/dev/null 2>&1; then echo -n "jco: "; jco --version || true; fi

echo "=== Post-Create Setup Complete ==="
