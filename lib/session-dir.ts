import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

// Session storage location, as pi resolves it for `--session-dir`:
// `PI_CODING_AGENT_SESSION_DIR` overrides the default `<agentDir>/sessions`.
// pi's default layout groups files by working directory
// (`sessions/<encoded-cwd>/*.jsonl`); an explicit session dir is flat
// (`<dir>/*.jsonl`), which is how pi-based apps such as Feynman store them.

function expandHome(path: string): string {
  if (path === "~") return homedir();
  return /^~[\\/]/.test(path) ? join(homedir(), path.slice(2)) : path;
}

/** The explicit session dir, or undefined when pi's per-cwd default applies. */
export function getCustomSessionDir(): string | undefined {
  const configured = process.env.PI_CODING_AGENT_SESSION_DIR?.trim();
  if (!configured) return undefined;
  const expanded = expandHome(configured);
  return isAbsolute(expanded) ? resolve(expanded) : resolve(process.cwd(), expanded);
}

/** Root directory that holds every session file pi-web lists. */
export function getSessionsRoot(): string {
  return getCustomSessionDir() ?? join(getAgentDir(), "sessions");
}

/** The `sessionDir` argument for `SessionManager.create()`: undefined keeps pi's per-cwd default. */
export function getNewSessionDir(): string | undefined {
  return getCustomSessionDir();
}

/**
 * System prompt override for main sessions, as pi's `--system-prompt`: a file
 * path or literal text. Unset leaves pi's discovery (`SYSTEM.md`) in place.
 */
export function getSystemPromptOverride(): string | undefined {
  const configured = process.env.PI_WEB_SYSTEM_PROMPT?.trim();
  if (!configured) return undefined;
  const expanded = expandHome(configured);
  return existsSync(expanded) ? resolve(expanded) : configured;
}
