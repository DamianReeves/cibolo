#!/usr/bin/env bun

import { trpcCli } from "trpc-cli";
import { router } from "./router.js";

const cli = trpcCli({
  router,
});

cli.run().catch((error) => {
  console.error(error);
  process.exit(1);
});
