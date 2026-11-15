#!/usr/bin/env node
"use strict";

// Starts Pi Web against a Feynman install (https://github.com/Companion-Inc/feynman).
// Feynman runs stock pi with its own agent dir, a flat session dir, a system
// prompt file and a few environment variables (feynman src/pi/runtime.ts).
// This sets the same up, then hands over to the regular pi-web CLI, so every
// pi-web option and subcommand (status, stop, open, ...) works unchanged.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { applyFeynmanEnv } = require("./feynman-env");

try {
  const info = applyFeynmanEnv(process.env);
  const command = process.argv[2];
  if (command === undefined || command.startsWith("-")) {
    console.log(`Feynman app:   ${info.appRoot ?? "not found (set FEYNMAN_APP_ROOT)"}`);
    console.log(`Agent dir:     ${process.env.PI_CODING_AGENT_DIR}`);
    console.log(`Sessions:      ${process.env.PI_CODING_AGENT_SESSION_DIR}`);
    if (process.env.PI_WEB_SYSTEM_PROMPT) console.log(`System prompt: ${process.env.PI_WEB_SYSTEM_PROMPT}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
require("./pi-web.js");
