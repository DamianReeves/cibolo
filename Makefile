# Detect the appropriate mill script based on the environment
ifeq ($(OS),Windows_NT)
	MILL := mill.bat
else
	MILL := ./mill
endif

.PHONY: setup fmt

setup:
	$(MILL) setup

fmt:
	$(MILL) --meta-level 1 reformat
	@$(MILL) __.reformatAll 2>/dev/null || true

