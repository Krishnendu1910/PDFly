#!/usr/bin/env node
import { spawnSync } from "child_process";

const rawArgs = process.argv.slice(2);
// Filter out Jest-only flags like --runInBand for Vitest compatibility
const filteredArgs = rawArgs.filter((arg) => arg !== "--runInBand");

const result = spawnSync("vitest", ["run", ...filteredArgs], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 0);
