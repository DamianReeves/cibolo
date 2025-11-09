#!/bin/bash
# Install GraalVM using SDKMAN (SDKMAN should be installed by sdk-tooling feature)
set -e

GRAALVM_PREFERRED="${GRAALVM_PREFERRED_OPTION:-oracle}"

# Source SDKMAN (should be installed by sdk-tooling feature)
if [ -d "$HOME/.sdkman" ]; then
    export SDKMAN_DIR="$HOME/.sdkman"
elif [ -d "/usr/local/sdkman" ]; then
    export SDKMAN_DIR="/usr/local/sdkman"
    if [ ! -e "$HOME/.sdkman" ]; then
        ln -s /usr/local/sdkman "$HOME/.sdkman"
    fi
else
    echo "SDKMAN not found. Please ensure sdk-tooling feature is installed first." >&2
    exit 1
fi

: "${SDKMAN_CANDIDATES_API:=https://api.sdkman.io/2}"
: "${SDKMAN_CURRENT_API:=https://api.sdkman.io/candidates}"
if [ -s "$SDKMAN_DIR/bin/sdkman-init.sh" ]; then
    source "$SDKMAN_DIR/bin/sdkman-init.sh"
else
    echo "SDKMAN init script not found at $SDKMAN_DIR/bin/sdkman-init.sh" >&2
    exit 1
fi

# Find GraalVM candidate (prefer Oracle)
GRAAL_ID=$( \
    sdk list java | awk -F'|' ' \
        /graal/ { \
            for (i=1; i<=NF; i++) { gsub(/^[ \t]+|[ \t]+$/, "", $i) } \
            if ($NF ~ /oracle|graalvm/i) { print $NF; exit } \
        }' \
)

if [ -z "$GRAAL_ID" ]; then
    GRAAL_ID=$( \
        sdk list java | awk -F'|' ' \
            /graal/ { \
                for (i=1; i<=NF; i++) { gsub(/^[ \t]+|[ \t]+$/, "", $i) } \
                if ($NF!="") { print $NF; exit } \
            }' \
    )
fi

if [ -z "$GRAAL_ID" ]; then
    echo "No GraalVM candidate found via SDKMAN" >&2
    exit 1
fi

echo "Installing GraalVM candidate: $GRAAL_ID"
printf 'y\n' | sdk install java "$GRAAL_ID"
sdk default java "$GRAAL_ID"

# Source SDKMAN again to update PATH with the newly installed Java
source "$SDKMAN_DIR/bin/sdkman-init.sh"

# Set JAVA_HOME and add to PATH
export JAVA_HOME="$HOME/.sdkman/candidates/java/current"
export PATH="$JAVA_HOME/bin:$PATH"

# Verify Java is available
java -version

# Install native-image if gu is available
if [ -x "$JAVA_HOME/bin/gu" ]; then
    "$JAVA_HOME/bin/gu" install native-image || true
fi

# Set environment variables
export SDKMAN_DIR="$HOME/.sdkman"
echo "export SDKMAN_DIR=\"\$HOME/.sdkman\"" >> "$HOME/.bashrc"
echo "export JAVA_HOME=\"\$HOME/.sdkman/candidates/java/current\"" >> "$HOME/.bashrc"
echo "[[ -s \"\$HOME/.sdkman/bin/sdkman-init.sh\" ]] && source \"\$HOME/.sdkman/bin/sdkman-init.sh\"" >> "$HOME/.bashrc"
echo "export PATH=\"\$HOME/.sdkman/candidates/java/current/bin:\$PATH\"" >> "$HOME/.bashrc"

