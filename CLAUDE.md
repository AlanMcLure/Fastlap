# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The full project guide (commands, architecture, conventions) lives in `AGENTS.md` so that every agent shares one source of truth. Read it before changing anything.

@AGENTS.md

## Notes for Claude Code

- Keep `AGENTS.md` as the place for project facts; add to this file only Claude-specific instructions.
- There is no test runner. Verify changes with `npx tsc --noEmit` and, for UI or route changes, `yarn build` plus a manual check in the browser.
- Reply to the user in Spanish; code, identifiers and commit messages follow the existing repo style (UI strings in Spanish, commit messages in Spanish).
