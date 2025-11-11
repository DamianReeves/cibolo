import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "bun";
import { existsSync } from "fs";
import { resolve } from "path";

const cliDir = resolve(import.meta.dir, "..");
const distDir = resolve(cliDir, "dist");
const executablePath = resolve(distDir, "ndoctrinate");
const packageJsonPath = resolve(cliDir, "package.json");

describe("Build Integration", () => {
  beforeAll(async () => {
    // Build the CLI executable
    const buildProcess = await spawn(["bun", "run", "build"], {
      cwd: cliDir,
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await buildProcess.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(buildProcess.stderr).text();
      throw new Error(`Build failed with exit code ${exitCode}: ${stderr}`);
    }
  });

  afterAll(async () => {
    // Clean up the built executable (optional - comment out if you want to keep it)
    // try {
    //   if (existsSync(executablePath)) {
    //     await rm(executablePath);
    //   }
    // } catch {
    //   // Ignore cleanup errors
    // }
  });

  it("should create the executable file", () => {
    expect(existsSync(executablePath)).toBe(true);
  });

  it("should be able to run the version command and get expected output", async () => {
    // Read expected values from package.json
    const packageJson = await import(packageJsonPath + "?raw").then((m) =>
      JSON.parse(m.default)
    );

    // Run the executable
    const process = await spawn([executablePath, "version"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await process.exited;
    expect(exitCode).toBe(0);

    const stdout = await new Response(process.stdout).text();
    const stderr = await new Response(process.stderr).text();

    // The output is JavaScript object notation, not JSON
    // We need to parse it differently - trpc-cli outputs as JS object
    let versionOutput;
    try {
      // Try to parse as JSON first
      versionOutput = JSON.parse(stdout.trim());
    } catch {
      // If that fails, try to evaluate as JavaScript (safe in test environment)
      // The output format is: { key: "value", ... }
      // We'll use a regex to extract the values
      const versionMatch = stdout.match(/version:\s*"([^"]+)"/);
      const nameMatch = stdout.match(/name:\s*"([^"]+)"/);
      const descriptionMatch = stdout.match(/description:\s*"([^"]+)"/);

      if (!versionMatch || !nameMatch || !descriptionMatch) {
        throw new Error(
          `Failed to parse version output: ${stdout}\nStderr: ${stderr}`
        );
      }

      versionOutput = {
        version: versionMatch[1],
        name: nameMatch[1],
        description: descriptionMatch[1],
      };
    }

    // Verify expected fields
    expect(versionOutput).toHaveProperty("version");
    expect(versionOutput).toHaveProperty("name");
    expect(versionOutput).toHaveProperty("description");

    // Verify values match package.json
    expect(versionOutput.version).toBe(packageJson.version);
    expect(versionOutput.name).toBe(packageJson.name);
    expect(versionOutput.description).toBe(packageJson.description);

    // Verify version format (semver)
    expect(versionOutput.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should have the executable be a valid binary", async () => {
    // Check that the file exists and is executable
    expect(existsSync(executablePath)).toBe(true);

    // Try to get file stats to verify it's a file (not a directory)
    const stats = await Bun.file(executablePath).stat();
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  });
});
