# Detect the appropriate mill script based on the environment
ifeq ($(OS),Windows_NT)
	MILL := mill.bat
else
	MILL := ./mill
endif

.PHONY: setup fmt build build-cli clean clean-cli docker-build docker-buildx docker-run docker-build-pinned docker-buildx-pinned test itest

setup:
	$(MILL) setup

fmt:
	$(MILL) --meta-level 1 reformat
	@$(MILL) __.reformatAll 2>/dev/null || true

# Build the CLI as a single-file executable
build-cli:
	cd projects/typescript/cli && bun run build

# Build all targets (currently just CLI)
build: build-cli

# Clean the CLI build output
clean-cli:
	cd projects/typescript/cli && bun run clean

# Clean all build outputs (currently just CLI)
clean: clean-cli

# ------------------------------------------------------------
# Devcontainer image build/run helpers
# Override via: make docker-build DEV_IMAGE=myimage BUILD_ARGS='--build-arg FOO=bar'
# Note: Universal base image requires linux/amd64 platform (use DOCKER_PLATFORM=linux/amd64 on ARM)
# ------------------------------------------------------------
DEV_IMAGE ?= ndoctrinate-dev
DEV_DOCKERFILE ?= .devcontainer/Dockerfile
BUILD_ARGS ?=
DOCKER_PLATFORM ?= linux/amd64

# Default pins for reproducible dev images (override as desired)
PIN_WASM_TOOLS_VERSION ?= 1.1.0
PIN_WIT_BINDGEN_VERSION ?= 0.24.0
PIN_WAC_VERSION ?= 0.3.0
PIN_JCO_VERSION ?= 0.11.0
PIN_GRAALVM_PREFERRED ?= oracle

DOCKER_PIN_ARGS := \
	--build-arg WASM_TOOLS_VERSION=$(PIN_WASM_TOOLS_VERSION) \
	--build-arg WIT_BINDGEN_VERSION=$(PIN_WIT_BINDGEN_VERSION) \
	--build-arg WAC_VERSION=$(PIN_WAC_VERSION) \
	--build-arg JCO_VERSION=$(PIN_JCO_VERSION) \
	--build-arg GRAALVM_PREFERRED=$(PIN_GRAALVM_PREFERRED)

docker-build:
	docker build --platform $(DOCKER_PLATFORM) $(BUILD_ARGS) -f $(DEV_DOCKERFILE) -t $(DEV_IMAGE) .

docker-buildx:
	docker buildx build --platform $(DOCKER_PLATFORM) $(BUILD_ARGS) -f $(DEV_DOCKERFILE) -t $(DEV_IMAGE) .

docker-run:
	docker run --platform $(DOCKER_PLATFORM) -it --rm -v "$(PWD):/workspace" -w /workspace $(DEV_IMAGE) bash

docker-build-pinned:
	docker build --platform $(DOCKER_PLATFORM) $(DOCKER_PIN_ARGS) $(BUILD_ARGS) -f $(DEV_DOCKERFILE) -t $(DEV_IMAGE) .

docker-buildx-pinned:
	docker buildx build --platform $(DOCKER_PLATFORM) $(DOCKER_PIN_ARGS) $(BUILD_ARGS) -f $(DEV_DOCKERFILE) -t $(DEV_IMAGE) .

# ------------------------------------------------------------
# Tests
# ------------------------------------------------------------
test:
	bun test

itest:
	bun test projects/typescript/cli/src/build.integration.test.ts

