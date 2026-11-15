# Pi Web for Feynman

[Feynman](https://github.com/Companion-Inc/feynman) is a research agent that runs on stock pi. This fork's `feynman-web` command starts Pi Web against your Feynman install, so the browser UI uses Feynman's sessions, settings, credentials, system prompt, research tools, subagents and slash workflows (`/deepresearch`, `/lit`, `/review`, …).

## Run

Run `feynman` once first so `~/.feynman/agent/settings.json` exists. Then:

```bash
git clone -b feynman https://github.com/bjhardcastle/pi-web
cd pi-web
npm install
npm run build          # once, and again after pulling changes
node bin/feynman-web.js
```

Or `npm install -g .` and run `feynman-web`. It takes every `pi-web` option (`--port`, `--no-open`, …) and subcommand (`status`, `stop`, `open`).

For development, `npm run dev:feynman` runs the Next.js dev server with the same environment.

## What it sets

Feynman launches pi with its own directories, a system prompt file and some environment variables (`src/pi/runtime.ts`). `feynman-web` sets the same before it starts Pi Web. Variables you have already set stay as they are.

| Variable | Value |
| --- | --- |
| `PI_CODING_AGENT_DIR` | `~/.feynman/agent` (follows `FEYNMAN_HOME`) |
| `PI_CODING_AGENT_SESSION_DIR` | the `sessionDir` setting if it is absolute, otherwise `~/.feynman/sessions` |
| `PI_WEB_SYSTEM_PROMPT` | `<feynman app>/.feynman/SYSTEM.md` |
| `PATH` | adds `~/.feynman/bin` (the `feynman` shell shim) and `<feynman app>/node_modules/.bin` |
| `FEYNMAN_BIN_PATH`, `FEYNMAN_NODE_EXECUTABLE`, `FEYNMAN_VERSION` | the values Feynman's shell shim uses |
| `PI_WEB_APP_NAME` | `Feynman` |

The Feynman app directory is read from the `packages` list in Feynman's `settings.json`, which Feynman rewrites on every launch, or from a global npm install. Set `FEYNMAN_APP_ROOT` to override it.

## Changes to Pi Web

Two general options, usable without Feynman:

- **`PI_CODING_AGENT_SESSION_DIR`**: pi's own session-dir variable. When it is set, Pi Web lists, resolves and creates sessions in that directory. Files sit directly in it, as with `pi --session-dir`, instead of under `sessions/<encoded-cwd>/`.
- **`PI_WEB_SYSTEM_PROMPT`**: a file path or literal text that replaces the system prompt of main sessions, like `pi --system-prompt`.

## Notes

- Sessions are shared with the Feynman CLI. A session started in the browser can be resumed with `feynman --resume`, and the other way round.
- Pi Web uses its own pi SDK version (1.5.x), which may be newer than the one Feynman bundles. Feynman's packages load with it.
- Credentials are Feynman's (`~/.feynman/agent/auth.json`), then environment variables such as `ANTHROPIC_API_KEY`. Sign in from the Models panel or with `feynman setup`.
