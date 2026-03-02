# Contributing to React Docs UI

Thanks for helping improve React Docs UI! This guide explains how to set up, code, and propose changes.

## Ways to contribute
- Report bugs and request features via Issues
- Improve docs and examples
- Submit code improvements, fixes, and new components

## Development setup
Requirements:
- Node.js ≥ 18
- npm (or pnpm/yarn)

Install and run:
```bash
npm install
npm run dev
```

Build the library bundle:
```bash
npm run build:lib
```

Other scripts:
- npm run build — type-check + app build
- npm run lint — lint the codebase
- npm run preview — preview the built site

## Code style
- TypeScript + React 18+
- Prefer shadcn/ui-style primitives + Tailwind utilities
- Keep components accessible; avoid deep nesting; use early returns
- Type exported/public APIs explicitly; avoid any

## Branching & commits
- Branch from master: feat/..., fix/..., docs/..., chore/...
- Use Conventional Commits, e.g. feat: add Footer component

## PR checklist
- Clear title (Conventional Commits)
- Brief description + screenshot/gif for UI
- No linter/type errors; builds succeed
- Minimal, focused edits; update docs/examples if needed

## Release (maintainers)
- npm run build:lib succeeds (prepublish runs automatically)
- Bump version (semver) and publish to npm

If you’re unsure about anything, open an Issue or draft PR — happy to help!
