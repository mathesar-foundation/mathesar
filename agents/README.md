# agents/

Material for AI coding agents that work on Mathesar: a map of the codebase, and scripts to install, run and check the app in a sandbox. The entry point is `AGENTS.md` at the repo root. Nothing in this folder is shipped in a release or imported by the app.

## Layout

| Path | Content |
|---|---|
| `agents/docs/00-general/` | Product context, architecture, repo map, history, contribution workflow |
| `agents/docs/01-setup/` | Install in a sandbox, drive the running app, troubleshooting |
| `agents/docs/02-backend/` | Django service, RPC layer, SQL functions, wrappers, models, auth, tests |
| `agents/docs/03-frontend/` | Svelte app: routing, stores, API client, components, i18n, checks |
| `agents/docs/04-features/` | Feature to code locations, across all layers |
| `agents/docs/05-ops/` | Docker, packaging, release, docs site |
| `agents/bin/` | Executable scripts. Each starts with a usage comment |
| `agents/playwright/` | Playwright helper used by `agents/bin/screenshot` and by your own browser scripts |

## Scripts

| Script | Purpose |
|---|---|
| `agents/bin/setup` | Install from source without Docker |
| `agents/bin/start`, `agents/bin/stop` | Run and stop the dev servers |
| `agents/bin/prod` | Run the production Docker Compose setup with images built from the working tree |
| `agents/bin/seed` | Create a database with sample data |
| `agents/bin/rpc` | Call a JSON-RPC method |
| `agents/bin/screenshot` | Capture a page as a logged-in user (needs Playwright) |
| `agents/bin/check` | Run the test and lint suites CI would run for the current changes |
| `agents/bin/check-docs` | Verify that paths and links in these docs exist |
| `agents/bin/check-git` | Verify the branch name, and that no commit or PR text names a coding agent |
| `agents/bin/dev-env` | Environment variables of the native dev setup. Sourced by the dev scripts. Source it for manual commands |
| `agents/playwright/session.cjs` | Playwright helper that returns a logged-in page |

Conventions for scripts:

- Safe to re-run. No prompts.
- Scripts have no file extension. CI runs the full backend test matrix for any change to a `.sh` or `.yml` file, and these scripts do not affect the product.
- Defaults come from `agents/bin/dev-env` and can be overridden from the environment.

## Rules for the docs

1. Write what is costly to find in the code: how parts connect, conventions, reasons, gotchas, verified commands. Leave out what one `ls` or one config file shows.
1. State only what you checked in the code or by running it.
1. Link to the human docs (`DEVELOPER_GUIDE.md`, `mathesar_ui/STANDARDS.md`, `db/sql/STANDARDS.md`, `docs/`). Do not copy them.
1. Put repo paths in backticks, relative to the repo root. `agents/bin/check-docs` verifies that each one exists.
1. Refer to code by path and symbol name, not by line number.
1. Start each file with what it covers and when to read it. Keep a file under about 250 lines.
1. One fact lives in one file. Other files point to it.

## Keeping it current

- When a PR moves, renames or restructures code, update the doc that describes it in the same PR.
- When you learn something that would have saved you time, add it to the doc for that area.
- When a doc and the code disagree, the code is right. Fix the doc.
- Run `agents/bin/check agents-docs` after editing. It fails on a path or link that no longer exists.
- A new doc needs a row in the "Docs index" table of `AGENTS.md`.
