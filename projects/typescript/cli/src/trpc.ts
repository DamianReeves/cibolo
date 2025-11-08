import { initTRPC } from "@trpc/server";

// Create and export shared tRPC instance
// This is used by both router and command files
export const t = initTRPC.context().create();

