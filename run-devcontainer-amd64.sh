#!/bin/bash
# Run existing devcontainer image as AMD64 on ARM64

# Find the devcontainer image
IMAGE_NAME=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "vsc-ndoctrinate.*features" | head -1)

if [ -z "$IMAGE_NAME" ]; then
    echo "No devcontainer image found. Building first..."
    export DOCKER_DEFAULT_PLATFORM=linux/amd64
    npx devcontainer build --workspace-folder .
    IMAGE_NAME=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "vsc-ndoctrinate.*features" | head -1)
fi

if [ -z "$IMAGE_NAME" ]; then
    echo "Error: Could not find or build devcontainer image"
    exit 1
fi

echo "Running devcontainer image: $IMAGE_NAME"
echo "Platform: linux/amd64 (emulated on ARM64)"
echo ""

# Run the container with AMD64 platform
docker run --platform linux/amd64 -it --rm \
    -v "$(pwd):/workspace" \
    -w /workspace \
    -u vscode \
    "$IMAGE_NAME" \
    bash
