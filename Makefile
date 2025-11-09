# Detect the appropriate mill script based on the environment
ifeq ($(OS),Windows_NT)
	MILL := mill.bat
else
	MILL := ./mill
endif

.PHONY: setup fmt build build-cli clean clean-cli

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

