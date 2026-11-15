import assert from "node:assert/strict";
import fs from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const root = fs.mkdtempSync(join(tmpdir(), "pi-web-session-dir-"));
const agentDir = join(root, "agent");
const flatDir = join(root, "sessions");
fs.mkdirSync(agentDir, { recursive: true });
fs.mkdirSync(flatDir, { recursive: true });
process.env.PI_CODING_AGENT_DIR = agentDir;

const { getSessionsRoot, getNewSessionDir, getSystemPromptOverride } = await jiti.import("./session-dir.ts");
const { listSessionsIncremental, resetSessionScanIndexForTests } = await jiti.import("./session-list-scanner.ts");
const { resolveSessionPath } = await jiti.import("./session-reader.ts");

function writeSession(dir, id) {
  const file = join(dir, `2026-01-01T00-00-00-000Z_${id}.jsonl`);
  fs.writeFileSync(file, `${JSON.stringify({ type: "session", version: 3, id, timestamp: "2026-01-01T00:00:00.000Z", cwd: root })}\n`
    + `${JSON.stringify({ type: "message", id: "a1", parentId: null, timestamp: "2026-01-01T00:00:01.000Z", message: { role: "user", content: "hi", timestamp: 1 } })}\n`);
  return file;
}

test.after(() => fs.rmSync(root, { recursive: true, force: true }));

test("without PI_CODING_AGENT_SESSION_DIR sessions stay under the agent dir, grouped by cwd", () => {
  delete process.env.PI_CODING_AGENT_SESSION_DIR;
  assert.equal(getSessionsRoot(), join(agentDir, "sessions"));
  assert.equal(getNewSessionDir(), undefined);
});

test("PI_CODING_AGENT_SESSION_DIR is a flat session dir that is listed and resolved", async () => {
  process.env.PI_CODING_AGENT_SESSION_DIR = flatDir;
  assert.equal(getSessionsRoot(), resolve(flatDir));
  assert.equal(getNewSessionDir(), resolve(flatDir));
  const file = writeSession(flatDir, "flat-session-1");
  resetSessionScanIndexForTests();
  const sessions = await listSessionsIncremental();
  assert.deepEqual(sessions.map((session) => session.id), ["flat-session-1"]);
  assert.equal(resolve(await resolveSessionPath("flat-session-1")), resolve(file));
});

test("PI_WEB_SYSTEM_PROMPT takes a file path or literal text", () => {
  const promptFile = join(root, "SYSTEM.md");
  fs.writeFileSync(promptFile, "You are Feynman.");
  process.env.PI_WEB_SYSTEM_PROMPT = promptFile;
  assert.equal(getSystemPromptOverride(), resolve(promptFile));
  process.env.PI_WEB_SYSTEM_PROMPT = "Be brief.";
  assert.equal(getSystemPromptOverride(), "Be brief.");
  delete process.env.PI_WEB_SYSTEM_PROMPT;
  assert.equal(getSystemPromptOverride(), undefined);
});
