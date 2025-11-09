import { spawn } from "bun";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import { resolve } from "path";

/**
 * Build configuration for creating a single-file executable of the CLI
 * This script uses Bun's CLI to bundle and compile the TypeScript code
 * into a standalone executable
 */
const distDir = resolve(import.meta.dir, "dist");
const executableFile = resolve(distDir, "ndoctrinate");
const entryPoint = resolve(import.meta.dir, "src/index.ts");

// Ensure dist directory exists
if (!existsSync(distDir)) {
  await mkdir(distDir, { recursive: true });
}

console.log("Building executable...");

// Build and compile in one step using Bun's CLI
const buildResult = await spawn(
  [
    "bun",
    "build",
    entryPoint,
    "--outfile",
    executableFile,
    "--target",
    "bun",
    "--compile",
    "--minify",
  ],
  {
    stdout: "inherit",
    stderr: "inherit",
    cwd: import.meta.dir,
  }
);

const exitCode = await buildResult.exited;
if (exitCode !== 0) {
  console.error("Build failed");
  process.exit(exitCode);
}

if (!existsSync(executableFile)) {
  console.error(`Executable not found: ${executableFile}`);
  process.exit(1);
}

console.log(`Build completed successfully: ${executableFile}`);
