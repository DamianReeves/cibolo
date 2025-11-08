import type { TrpcCliMeta } from "trpc-cli";
import { t } from "../trpc.js";
import { programName, programVersion, programDescription } from "../package-info.js";

/**
 * Version command handler
 * Returns the CLI version information
 * 
 * Note: Using void input for simplicity. trpc-cli will handle
 * this as a command with no arguments. Future commands can use
 * Zod schemas (required by trpc-cli) or custom input parsers.
 */
export const versionCommand = t.procedure
  .meta({
    description: "Display the CLI version information",
    usage: `${programName} version`,
    examples: [
      `${programName} version`,
    ],
  } satisfies TrpcCliMeta)
  .query(() => {
    return {
      version: programVersion,
      name: programName,
      description: programDescription,
    };
  });

