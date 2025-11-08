import { versionCommand } from "./commands/version.js";
import { t } from "./trpc.js";

export const router = t.router({
  version: versionCommand,
});

export type AppRouter = typeof router;
