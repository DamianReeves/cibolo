#!/bin/bash
# Install MoonBit compiler
set -e

# Determine the correct user home directory
# Devcontainer features should run as the remoteUser (typically vscode)
# But we'll explicitly use /home/vscode if it exists, otherwise fall back to $HOME
if [ -d "/home/vscode" ]; then
    USER_HOME="/home/vscode"
elif [ -n "$HOME" ]; then
    USER_HOME="$HOME"
else
    USER_HOME="/home/vscode"
fi

# Ensure we're working with the correct user's home
export HOME="$USER_HOME"
cd "$HOME" || exit 1

# Read version options (empty means latest)
# Devcontainer features pass options as {OPTION_NAME}_OPTION environment variables
MOON_VERSION="${MOON_VERSION_OPTION:-}"
MOONC_VERSION="${MOONC_VERSION_OPTION:-}"
MOONRUN_VERSION="${MOONRUN_VERSION_OPTION:-}"

# Ensure Node.js is available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
fi

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js is required for MoonBit installation" >&2
    exit 1
fi

# Set MOON_HOME and ensure it's in PATH for version checking
export MOON_HOME="$HOME/.moon"
export PATH="$MOON_HOME/bin:$PATH"

# Ensure MOON_HOME directory exists and has correct permissions
mkdir -p "$MOON_HOME"
if [ "$(id -u)" = "0" ]; then
    # If running as root, ensure vscode user owns the directory
    if id "vscode" &>/dev/null; then
        chown -R vscode:vscode "$MOON_HOME" 2>/dev/null || true
    fi
fi

# Function to check if versions match requirements
check_versions_match() {
    local installed_moon="$1"
    local installed_moonc="$2"
    local installed_moonrun="$3"
    
    if [ -n "$MOON_VERSION" ] && [ "$installed_moon" != "$MOON_VERSION" ]; then
        return 1
    fi
    if [ -n "$MOONC_VERSION" ] && [ "$installed_moonc" != "$MOONC_VERSION" ]; then
        return 1
    fi
    if [ -n "$MOONRUN_VERSION" ] && [ "$installed_moonrun" != "$MOONRUN_VERSION" ]; then
        return 1
    fi
    return 0
}

# Check if moon is already installed and get versions
NEEDS_INSTALL=true
if command -v moon >/dev/null 2>&1; then
    echo "MoonBit is already installed, checking versions..."
    # Get versions using moon version --all --no-path
    VERSION_OUTPUT=$(moon version --all --no-path 2>/dev/null || echo "")
    
    if [ -n "$VERSION_OUTPUT" ]; then
        echo "Version output:"
        echo "$VERSION_OUTPUT"
        
        # Parse versions from output - try multiple patterns
        # Pattern 1: Look for lines containing "moon:" or "moon " followed by version
        INSTALLED_MOON=$(echo "$VERSION_OUTPUT" | grep -iE "moon[^c]|^moon:" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+[^[:space:]]*" | head -1 || echo "")
        # Pattern 2: Look for moonc specifically
        INSTALLED_MOONC=$(echo "$VERSION_OUTPUT" | grep -i "moonc" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+[^[:space:]]*" | head -1 || echo "")
        # Pattern 3: Look for moonrun specifically
        INSTALLED_MOONRUN=$(echo "$VERSION_OUTPUT" | grep -i "moonrun" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+[^[:space:]]*" | head -1 || echo "")
        
        # If parsing failed, try extracting all version numbers and assign in order
        if [ -z "$INSTALLED_MOON" ] || [ -z "$INSTALLED_MOONC" ] || [ -z "$INSTALLED_MOONRUN" ]; then
            ALL_VERSIONS=($(echo "$VERSION_OUTPUT" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+[^[:space:]]*" | head -3))
            if [ ${#ALL_VERSIONS[@]} -ge 3 ]; then
                INSTALLED_MOON="${ALL_VERSIONS[0]}"
                INSTALLED_MOONC="${ALL_VERSIONS[1]}"
                INSTALLED_MOONRUN="${ALL_VERSIONS[2]}"
            fi
        fi
        
        echo "Parsed versions: moon=${INSTALLED_MOON:-unknown}, moonc=${INSTALLED_MOONC:-unknown}, moonrun=${INSTALLED_MOONRUN:-unknown}"
        
        # Check if versions match requirements
        if check_versions_match "$INSTALLED_MOON" "$INSTALLED_MOONC" "$INSTALLED_MOONRUN"; then
            echo "Installed MoonBit versions match requirements, skipping installation."
            NEEDS_INSTALL=false
        else
            echo "Installed MoonBit versions do not match requirements, will reinstall."
        fi
    else
        echo "Could not determine MoonBit versions, will install/upgrade."
    fi
fi

# Install if needed
if [ "$NEEDS_INSTALL" = true ]; then
    echo "Installing MoonBit to $HOME/.moon..."
    # Try official installer first, fallback to TypeScript installer
    # The installer should install to $HOME/.moon automatically
    if ! curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash; then
        echo "Official installer failed, trying TypeScript installer..." >&2
        # Before using WASM installer, check if moon exists and versions
        if command -v moon >/dev/null 2>&1; then
            echo "Checking versions before WASM installer..."
            moon version --all --no-path || true
        fi
        curl -fsSL https://raw.githubusercontent.com/moonbitlang/moonbit-compiler/refs/heads/main/install.ts | node
    fi
    
    # Ensure correct ownership if we ran as root
    if [ "$(id -u)" = "0" ] && id "vscode" &>/dev/null; then
        chown -R vscode:vscode "$MOON_HOME" 2>/dev/null || true
    fi
    
    # Verify installation
    export PATH="$MOON_HOME/bin:$PATH"
    if command -v moon >/dev/null 2>&1; then
        echo "MoonBit installation complete. Installed versions:"
        moon version --all --no-path || true
    else
        echo "Warning: MoonBit installation may have failed. moon command not found in PATH."
        echo "MOON_HOME: $MOON_HOME"
        echo "Checking if binaries exist:"
        ls -la "$MOON_HOME/bin" 2>/dev/null || echo "Directory $MOON_HOME/bin does not exist"
    fi
fi

# Set MOON_HOME environment variable and add to .bashrc if not already present
export MOON_HOME="$HOME/.moon"
if ! grep -q "MOON_HOME" "$HOME/.bashrc" 2>/dev/null; then
    echo 'export MOON_HOME="$HOME/.moon"' >> "$HOME/.bashrc"
fi

# Add moon binaries to PATH
if ! grep -q "\$MOON_HOME/bin" "$HOME/.bashrc" 2>/dev/null; then
    echo 'export PATH="$MOON_HOME/bin:$PATH"' >> "$HOME/.bashrc"
fi

# Ensure .bashrc is sourced in .bash_profile or .profile for login shells
if [ -f "$HOME/.bash_profile" ]; then
    if ! grep -q "\.bashrc" "$HOME/.bash_profile" 2>/dev/null; then
        echo '[ -f "$HOME/.bashrc" ] && . "$HOME/.bashrc"' >> "$HOME/.bash_profile"
    fi
elif [ -f "$HOME/.profile" ]; then
    if ! grep -q "\.bashrc" "$HOME/.profile" 2>/dev/null; then
        echo '[ -f "$HOME/.bashrc" ] && . "$HOME/.bashrc"' >> "$HOME/.profile"
    fi
fi

