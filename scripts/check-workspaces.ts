#!/usr/bin/env bun

/**
 * Check script for workspace root - Runs verify and test across all workspaces
 * Exits with failure if either verify or test fails in any workspace
 */

async function runWorkspaceScript(script: string): Promise<number> {
  const proc = Bun.spawn(["bun", "run", "--workspaces", script], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();

  // Output to console for visibility
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  // If test script failed, check if any workspace failed due to "no tests found"
  if (script === "test" && exitCode !== 0) {
    const output = stdout + stderr;
    // Check if all failures are due to "no tests found"
    // If there are any other test failures, we should still fail
    const hasNoTestsFound = output.includes("No tests found");
    
    // Check for actual test failures (non-zero fail count)
    const failMatches = output.match(/(\d+) fail/g);
    const hasActualFailures = failMatches?.some((match) => {
      const failCount = parseInt(match.match(/\d+/)?.[0] || "0");
      return failCount > 0;
    });
    
    // If we have "no tests found" and no actual test failures, treat as success
    if (hasNoTestsFound && !hasActualFailures) {
      // All failures are due to "no tests found", treat as success
      return 0;
    }
  }

  return exitCode;
}

async function main() {
  const verifyExitCode = await runWorkspaceScript("verify");
  const testExitCode = await runWorkspaceScript("test");

  // Exit with failure if either script failed
  const exitCode = verifyExitCode !== 0 || testExitCode !== 0 ? 1 : 0;
  process.exit(exitCode);
}

main().catch((error) => {
  console.error("Error running workspace check script:", error);
  process.exit(1);
});

