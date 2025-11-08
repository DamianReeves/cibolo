import { describe, it, expect } from "bun:test";
import { router } from "./router.js";

describe("Version Command Integration", () => {
  it("should return version information with all expected fields", async () => {
    const caller = router.createCaller({});

    const result = await caller.version();

    expect(result).toHaveProperty("version");
    expect(result.version).toBe("0.1.0");
    expect(result).toHaveProperty("name");
    expect(result.name).toBe("cibolo-cli");
    expect(result).toHaveProperty("description");
    expect(result.description).toBe("CLI for Cibolo document translation tool");
  });

  it("should return a valid version string", async () => {
    const caller = router.createCaller({});

    const result = await caller.version();

    expect(typeof result.version).toBe("string");
    expect(result.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should have the router properly configured", () => {
    expect(router).toBeDefined();
    expect(typeof router.version).toBe("function");
    expect(router.version).toBeDefined();
  });
});
