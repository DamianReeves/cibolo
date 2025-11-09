import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get the package.json path relative to this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

// Export package information
export const programName = packageJson.name;
export const programVersion = packageJson.version;
export const programDescription =
  packageJson.description || "Ndoctrinate document translation tool";
export { packageJson };
