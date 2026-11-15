"use strict";

// Environment for running Pi Web as a Feynman front end. Mirrors Feynman's
// own launch (src/config/paths.ts, src/pi/runtime.ts buildPiEnv):
//   FEYNMAN_HOME (default ~)/.feynman/agent     -> PI_CODING_AGENT_DIR
//   FEYNMAN_HOME/.feynman/sessions (flat)       -> PI_CODING_AGENT_SESSION_DIR
//   <app>/.feynman/SYSTEM.md (--system-prompt)  -> PI_WEB_SYSTEM_PROMPT
//   ~/.feynman/bin shim + <app>/node_modules/.bin on PATH, FEYNMAN_BIN_PATH, ...
// Variables already set are left alone.

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

function expandHome(p, home = os.homedir()) {
  if (p === "~") return home;
  return /^~[\\/]/.test(p) ? path.join(home, p.slice(2)) : p;
}

function getFeynmanHome(env) {
  return path.resolve(expandHome(env.FEYNMAN_HOME || os.homedir()), ".feynman");
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return undefined;
  }
}

function isFeynmanAppRoot(dir) {
  if (!dir) return false;
  const pkg = readJson(path.join(dir, "package.json"));
  return pkg?.name === "@companion-ai/feynman";
}

// Feynman rewrites settings.json `packages` with its install path on every launch.
function appRootFromSettings(agentDir) {
  const settings = readJson(path.join(agentDir, "settings.json"));
  const packages = Array.isArray(settings?.packages) ? settings.packages : [];
  for (const entry of packages) {
    const source = typeof entry === "string" ? entry : entry?.source;
    if (typeof source === "string" && isFeynmanAppRoot(source)) return path.resolve(source);
  }
  return undefined;
}

function appRootFromGlobalNpm() {
  try {
    const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["root", "-g"], {
      encoding: "utf8",
      shell: process.platform === "win32",
      timeout: 10_000,
    });
    const root = result.stdout?.trim();
    const candidate = root && path.join(root, "@companion-ai", "feynman");
    return isFeynmanAppRoot(candidate) ? candidate : undefined;
  } catch {
    return undefined;
  }
}

function findAppRoot(env, agentDir) {
  if (env.FEYNMAN_APP_ROOT) {
    const root = path.resolve(expandHome(env.FEYNMAN_APP_ROOT));
    if (!isFeynmanAppRoot(root)) throw new Error(`FEYNMAN_APP_ROOT is not a Feynman install: ${root}`);
    return root;
  }
  return appRootFromSettings(agentDir) ?? appRootFromGlobalNpm();
}

// Pi on Windows finds Git Bash only in Program Files or on PATH; Feynman adds a
// per-user Git for Windows install's bin dir (src/pi/runtime.ts findWindowsBash).
function windowsBashDir(env) {
  const pathDirs = (env.PATH ?? env.Path ?? "").split(";").filter(Boolean);
  const known = [env.ProgramFiles, env["ProgramFiles(x86)"]]
    .filter(Boolean)
    .map((dir) => path.win32.join(dir, "Git", "bin", "bash.exe"));
  if ([...known, ...pathDirs.map((dir) => path.win32.join(dir, "bash.exe"))].some((p) => fs.existsSync(p))) return undefined;
  if (env.LOCALAPPDATA) {
    const bin = path.win32.join(env.LOCALAPPDATA, "Programs", "Git", "bin");
    if (fs.existsSync(path.win32.join(bin, "bash.exe"))) return bin;
  }
  return undefined;
}

function setDefault(env, key, value) {
  if (value !== undefined && (env[key] === undefined || env[key] === "")) env[key] = value;
}

function applyFeynmanEnv(env = process.env) {
  const feynmanHome = getFeynmanHome(env);
  const agentDir = env.PI_CODING_AGENT_DIR ? path.resolve(expandHome(env.PI_CODING_AGENT_DIR)) : path.join(feynmanHome, "agent");
  if (!fs.existsSync(path.join(agentDir, "settings.json"))) {
    throw new Error(`No Feynman settings in ${agentDir}. Run \`feynman setup\` (or \`feynman\` once) first.`);
  }
  const appRoot = findAppRoot(env, agentDir);

  env.PI_CODING_AGENT_DIR = agentDir;
  // Feynman's order: PI_CODING_AGENT_SESSION_DIR, the sessionDir setting, then its default.
  const settings = readJson(path.join(agentDir, "settings.json"));
  const settingsSessionDir = typeof settings?.sessionDir === "string" && path.isAbsolute(expandHome(settings.sessionDir))
    ? expandHome(settings.sessionDir)
    : undefined;
  setDefault(env, "PI_CODING_AGENT_SESSION_DIR", settingsSessionDir ?? path.join(feynmanHome, "sessions"));
  fs.mkdirSync(env.PI_CODING_AGENT_SESSION_DIR, { recursive: true });

  setDefault(env, "PI_WEB_APP_NAME", "Feynman");
  setDefault(env, "PI_SKIP_VERSION_CHECK", "1");
  if (env.FEYNMAN_TELEMETRY === "off") setDefault(env, "PI_TELEMETRY", "0");

  const pathKey = Object.keys(env).find((key) => key.toUpperCase() === "PATH") ?? "PATH";
  const extraPath = [path.join(feynmanHome, "bin")];
  if (appRoot) {
    const systemPrompt = path.join(appRoot, ".feynman", "SYSTEM.md");
    if (fs.existsSync(systemPrompt)) setDefault(env, "PI_WEB_SYSTEM_PROMPT", systemPrompt);
    const pkg = readJson(path.join(appRoot, "package.json"));
    setDefault(env, "FEYNMAN_VERSION", pkg?.version);
    setDefault(env, "FEYNMAN_BIN_PATH", path.join(appRoot, "bin", "feynman.js"));
    // The standalone install bundles node next to app/.
    const bundledNode = path.join(appRoot, "..", "node", process.platform === "win32" ? "node.exe" : path.join("bin", "node"));
    setDefault(env, "FEYNMAN_NODE_EXECUTABLE", fs.existsSync(bundledNode) ? bundledNode : process.execPath);
    extraPath.push(path.join(appRoot, "node_modules", ".bin"));
  }
  const bashDir = process.platform === "win32" ? windowsBashDir(env) : undefined;
  env[pathKey] = [...extraPath, env[pathKey] ?? "", bashDir].filter(Boolean).join(path.delimiter);

  return { appRoot, agentDir, feynmanHome };
}

module.exports = { applyFeynmanEnv, findAppRoot, getFeynmanHome };
