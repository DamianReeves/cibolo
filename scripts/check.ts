#!/usr/bin/env bun

/**
 * Check script - Runs verify and test, ensuring both execute
 * Exits with failure if either verify or test fails
 */

const [verifyScript, testScript] = process.argv.slice(2);

if (!verifyScript || !testScript) {
  console.error("Usage: bun scripts/check.ts <verify-script> <test-script>");
  process.exit(1);
}

async function runScript(script: string): Promise<number> {
  const proc = Bun.spawn(["bun", "run", script], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();

  // Output to console for visibility
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  // If test script failed, check if it's due to "no tests found"
  if (script === "test" && exitCode !== 0) {
    const output = stdout + stderr;
    if (output.includes("No tests found")) {
      // Treat "no tests found" as success
      return 0;
    }
  }

  return exitCode;
}

async function main() {
  const verifyExitCode = await runScript(verifyScript);
  const testExitCode = await runScript(testScript);

  // Exit with failure if either script failed
  const exitCode = verifyExitCode !== 0 || testExitCode !== 0 ? 1 : 0;
  process.exit(exitCode);
}

main().catch((error) => {
  console.error("Error running check script:", error);
  process.exit(1);
});

