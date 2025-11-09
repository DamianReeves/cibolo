## Rust Devcontainer Image: includes Rust toolchain, then we add Node, Bun, MoonBit, Java, WASM tools
# syntax=docker/dockerfile:1.7
FROM mcr.microsoft.com/devcontainers/rust:latest

ARG DEV_USER=vscode
ARG DEV_HOME=/home/${DEV_USER}

USER ${DEV_USER}
WORKDIR ${DEV_HOME}
ENV HOME=${DEV_HOME}
SHELL ["/bin/bash", "-lc"]

# Version pins (override with --build-arg). Empty means latest.
ARG PROTO_VERSION=""
ARG WASM_TOOLS_VERSION=""
ARG WIT_BINDGEN_VERSION=""
ARG WAC_VERSION=""
ARG JCO_VERSION=""
ARG GRAALVM_PREFERRED="oracle"

## Verify Rust is installed (should be pre-installed in base image)
RUN rustc --version && cargo --version

## Install nvm, SDKMAN, and proto in a single layer
# hadolint ignore=DL3059
RUN set -eo pipefail; \
        # Install nvm if Node.js is not available
        if ! command -v node >/dev/null 2>&1; then \
            export NVM_DIR="$HOME/.nvm"; \
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash; \
            [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; \
            nvm install --lts && nvm use --lts; \
        fi; \
        # Install SDKMAN
        curl -s "https://get.sdkman.io" | bash; \
        # Install proto (moonrepo) - needs cargo
        export PATH="$HOME/.cargo/bin:$PATH"; \
        if [ -n "${PROTO_VERSION}" ]; then \
            cargo install proto-cli@"${PROTO_VERSION}" --locked || true; \
        else \
            cargo install proto-cli --locked || true; \
        fi

## Copy installation scripts
COPY --chown=${DEV_USER}:${DEV_USER} .devcontainer/install-moonbit.sh .devcontainer/install-graalvm.sh /tmp/

## Install Bun
RUN curl -fsSL https://bun.sh/install | bash

## Install MoonBit using script
RUN bash /tmp/install-moonbit.sh

## Install GraalVM using script
RUN set -eo pipefail; \
        export SDKMAN_DIR="$HOME/.sdkman"; \
        export GRAALVM_PREFERRED="${GRAALVM_PREFERRED}"; \
        [ -s "$SDKMAN_DIR/bin/sdkman-init.sh" ] && source "$SDKMAN_DIR/bin/sdkman-init.sh"; \
        bash /tmp/install-graalvm.sh

## Install wasm-opt (Binaryen) using apt as root, then return to user
USER root
RUN apt-get update && apt-get install -y binaryen && rm -rf /var/lib/apt/lists/*
USER ${DEV_USER}

## Heavy installs (cargo tools + jco) in a separate cached layer; print version summary
RUN --mount=type=cache,target=/home/${DEV_USER}/.cargo/registry \
    --mount=type=cache,target=/home/${DEV_USER}/.cargo/git \
        set -euo pipefail; \
        export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; \
        [ -s "$HOME/.cargo/env" ] && . "$HOME/.cargo/env" || true; \
        export PATH="$HOME/.bun/bin:$HOME/.cargo/bin:$PATH"; \
        # wasm-tools
        if [ -n "${WASM_TOOLS_VERSION}" ]; then \
            cargo install wasm-tools@"${WASM_TOOLS_VERSION}" --locked || true; \
        else \
            cargo install wasm-tools --locked || true; \
        fi; \
        # wit-bindgen-cli
        if [ -n "${WIT_BINDGEN_VERSION}" ]; then \
            cargo install wit-bindgen-cli@"${WIT_BINDGEN_VERSION}" --locked || true; \
        else \
            cargo install wit-bindgen-cli --locked || true; \
        fi; \
        # wac (try alternative crate name)
        if [ -n "${WAC_VERSION}" ]; then \
            cargo install wac@"${WAC_VERSION}" --locked || cargo install wac-cli@"${WAC_VERSION}" --locked || true; \
        else \
            cargo install wac --locked || cargo install wac-cli --locked || true; \
        fi; \
        # jco via bun
        if [ -n "${JCO_VERSION}" ]; then \
            bun add -g @bytecodealliance/jco@"${JCO_VERSION}"; \
        else \
            bun add -g @bytecodealliance/jco; \
        fi; \
        echo "--- Tool Versions ---"; \
        echo -n "Node: "; node --version; \
        echo -n "Bun: "; bun --version; \
        echo -n "Rust: "; rustc --version; \
        echo -n "Cargo: "; cargo --version; \
        echo -n "Java: "; java -version || true; \
        if command -v proto >/dev/null 2>&1; then echo -n "proto-cli: "; proto --version || true; fi; \
        if command -v wasm-opt >/dev/null 2>&1; then echo -n "wasm-opt: "; wasm-opt --version || true; fi; \
        if command -v wasm-tools >/dev/null 2>&1; then echo -n "wasm-tools: "; wasm-tools --version || true; fi; \
        if command -v wit-bindgen >/dev/null 2>&1; then echo -n "wit-bindgen-cli: "; wit-bindgen --version || true; fi; \
        if command -v wac >/dev/null 2>&1; then echo -n "wac: "; wac --version || true; fi; \
        if command -v jco >/dev/null 2>&1; then echo -n "jco: "; jco --version || true; fi

## Environment adjustments: add bun + graalvm + cargo bins
ENV SDKMAN_DIR="${HOME}/.sdkman"
ENV MOON_HOME="${HOME}/.moon"
ENV JAVA_HOME="${HOME}/.sdkman/candidates/java/current"
ENV PATH="${HOME}/.bun/bin:${HOME}/.sdkman/candidates/java/current/bin:${HOME}/.cargo/bin:${PATH}"

## Shell conveniences
RUN echo 'export MOON_HOME="$HOME/.moon"' >> ~/.bashrc && \
    echo 'export SDKMAN_DIR="$HOME/.sdkman"' >> ~/.bashrc && \
    echo 'export JAVA_HOME="$HOME/.sdkman/candidates/java/current"' >> ~/.bashrc && \
    echo '[[ -s "$HOME/.sdkman/bin/sdkman-init.sh" ]] && source "$HOME/.sdkman/bin/sdkman-init.sh"' >> ~/.bashrc && \
    echo 'export PATH="$HOME/.bun/bin:$HOME/.sdkman/candidates/java/current/bin:$HOME/.cargo/bin:$PATH"' >> ~/.bashrc

## Final user remains vscode
USER ${DEV_USER}
