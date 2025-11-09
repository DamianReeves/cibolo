#!/bin/bash
# Install GraalVM using SDKMAN
set -eo pipefail

# Source SDKMAN if available (should be set by caller, but check anyway)
if [ -z "${SDKMAN_DIR:-}" ]; then
    if [ -d "$HOME/.sdkman" ]; then
        export SDKMAN_DIR="$HOME/.sdkman"
    elif [ -d "/usr/local/sdkman" ]; then
        export SDKMAN_DIR="/usr/local/sdkman"
    else
        echo "SDKMAN not found. Please install SDKMAN first." >&2
        exit 1
    fi
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
GRAALVM_PREFERRED="${GRAALVM_PREFERRED:-oracle}"
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
java -version

export JAVA_HOME="$HOME/.sdkman/candidates/java/current"
if [ -x "$JAVA_HOME/bin/gu" ]; then
    "$JAVA_HOME/bin/gu" install native-image || true
fi

