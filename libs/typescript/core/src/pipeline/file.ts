/**
 * VFile integration utilities for the pipeline
 */

import { Effect } from "effect";
import { VFile } from "vfile";
import type { Input, ParseError, CompileError } from "./types.js";
import { createParseError, createCompileError } from "./errors.js";
import * as fs from "node:fs/promises";

/**
 * Create a VFile from input
 */
export function createVFile(
  input: Input,
  options?: { path?: string; [key: string]: unknown }
): VFile {
  if (input instanceof VFile) {
    return input;
  }

  if (typeof input === "string") {
    return new VFile({
      value: input,
      ...options,
    });
  }

  if (input instanceof Uint8Array) {
    return new VFile({
      value: input,
      ...options,
    });
  }

  return new VFile(options);
}

/**
 * Get content from VFile as string
 */
export function getVFileContent(file: VFile): string {
  return String(file.value ?? "");
}

/**
 * Set content in VFile
 */
export function setVFileContent(file: VFile, content: string): VFile {
  const newFile = new VFile(file);
  newFile.value = content;
  return newFile;
}

/**
 * Get messages from VFile
 */
export function getVFileMessages(file: VFile): VFile["messages"] {
  return file.messages;
}

/**
 * Add a message to VFile
 */
export function addVFileMessage(
  file: VFile,
  message: VFile["messages"][number]
): VFile {
  const newFile = new VFile(file);
  newFile.message(message);
  return newFile;
}

/**
 * Read a file from the filesystem as a VFile
 */
export function readVFile(
  path: string
): Effect.Effect<VFile, ParseError, never> {
  return Effect.tryPromise({
    try: async () => {
      const content = await fs.readFile(path, "utf-8");
      return new VFile({
        path,
        value: content,
      });
    },
    catch: (error: unknown) =>
      createParseError(
        `Failed to read file: ${path}`,
        error instanceof Error ? error : new Error(String(error))
      ),
  });
}

/**
 * Write a VFile to the filesystem
 */
export function writeVFile(
  file: VFile,
  path: string
): Effect.Effect<void, CompileError, never> {
  return Effect.tryPromise({
    try: async () => {
      const content = String(file.value ?? "");
      await fs.writeFile(path, content, "utf-8");
    },
    catch: (error: unknown) =>
      createCompileError(
        `Failed to write file: ${path}`,
        error instanceof Error ? error : new Error(String(error))
      ),
  });
}
