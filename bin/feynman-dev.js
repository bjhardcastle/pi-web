"use strict";
// `npm run dev:feynman`: the Next.js dev server with the Feynman environment
// applied to this process and everything it spawns.
/* eslint-disable @typescript-eslint/no-require-imports */
require("./feynman-env").applyFeynmanEnv(process.env);
process.argv = [process.argv[0], require.resolve("next/dist/bin/next"), "dev", "-H", "127.0.0.1", "-p", "30141", ...process.argv.slice(2)];
require("next/dist/bin/next");
