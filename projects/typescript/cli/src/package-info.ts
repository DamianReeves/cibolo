// Import package.json directly - this will be bundled into the executable at build time
// Using a relative path that works both in development and in the compiled executable
import packageJson from "../package.json" with { type: "json" };

// Export package information
export const programName = packageJson.name;
export const programVersion = packageJson.version;
export const programDescription =
  packageJson.description || "Ndoctrinate document translation tool";
export { packageJson };
