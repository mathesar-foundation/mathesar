# .agents/

Material for AI coding agents that work on Mathesar: a map of the codebase, and scripts to install, run and check the app in a sandbox. The entry point is `AGENTS.md` at the repo root. Nothing in this folder is shipped in a release or imported by the app.

## Layout

- `.agents/docs/` is the map of the codebase. The "Docs index" table in `AGENTS.md` lists every file and when to read it.
- `.agents/bin/` holds executable scripts. Each starts with a usage comment. The "Commands" table in `AGENTS.md` lists the ones an agent runs during a task.
- `.agents/playwright/session.cjs` is a Playwright helper that returns a logged-in page. `.agents/bin/screenshot` uses it, and so can your own browser scripts.

## Scripts

The "Commands" table leaves these out, because other scripts call them:

| Script | Purpose |
|---|---|
| `.agents/bin/check-docs` | Verify that paths and links in these docs exist. Run by `.agents/bin/check agents-docs` |
| `.agents/bin/check-git` | Verify the branch name, and that no commit or PR text names a coding agent. Run by `.agents/bin/check git` |
| `.agents/bin/dev-env` | Environment variables of the native dev setup. Sourced by the dev scripts. Source it for manual commands |

Conventions for scripts:

- Safe to re-run. No prompts.
- Scripts have no file extension. CI runs the full backend test matrix for any change to a `.sh` or `.yml` file, and these scripts do not affect the product.
- Defaults come from `.agents/bin/dev-env` and can be overridden from the environment.

## Rules for the docs

1. Write what is costly to find in the code: how parts connect, conventions, reasons, gotchas, verified commands. Leave out what one `ls` or one config file shows.
1. State only what you checked in the code or by running it.
1. Link to the human docs (`DEVELOPER_GUIDE.md`, `mathesar_ui/STANDARDS.md`, `db/sql/STANDARDS.md`, `docs/`). Do not copy them.
1. Put repo paths in backticks, relative to the repo root. `.agents/bin/check-docs` verifies that each one exists.
1. Refer to code by path and symbol name, not by line number.
1. Start each file with what it covers and when to read it. Keep a file under about 250 lines.
1. One fact lives in one file. Other files point to it. A rule that an agent's harness works against by default (commit identity, branch name, PR attribution, comments, drafts) lives in `AGENTS.md`, because that file is in context from the start. `.agents/docs/00-general/workflow.md` adds detail and does not restate the rule. The policy for people lives in `CONTRIBUTING.md`.
1. Where a rule can be checked by a script, check it, and make the script's output say how to fix the problem. The doc then only needs to name the script.

## Keeping it current

- When a PR moves, renames or restructures code, update the doc that describes it in the same PR.
- When you learn something that would have saved you time, add it to the doc for that area.
- When a doc and the code disagree, the code is right. Fix the doc.
- Run `.agents/bin/check agents-docs` after editing. It fails on a path or link that no longer exists.
- A new doc needs a row in the "Docs index" table of `AGENTS.md`.
