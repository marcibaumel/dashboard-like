<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: Kanban board

Trello-like board. Next.js (App Router) + TypeScript, styled-components, shadcn-style UI on Base UI, TypeORM over SQLite (`better-sqlite3`), Markdown task descriptions (`react-markdown` + `remark-gfm`).

### Commands

- `npm run dev` / `build` / `start` / `lint`
- `npm run format` runs Prettier; `npm run format:check` verifies. Run `format` before finishing a change.
- Windows PowerShell blocks the `npm`/`npx` shims; use `npm.cmd` / `npx.cmd`.

### Conventions

- Formatting: Prettier, 4-space indentation (no tabs), print width 100 (see `.prettierrc`).
- Styling: styled-components only, no Tailwind. Theme colors are CSS variables in `app/globals.css`. Use transient props (`$prop`) for style-only props.
- styled-components need a client boundary: put `"use client"` on any file that defines them. Server components (pages) import styled pieces from `components/layout.tsx`.
- Data: `lib/db.ts` is the only place that touches the database (`server-only`). Entities use TypeORM `EntitySchema` (no decorators); the schema is created via `synchronize: true`, so there are no migrations.
- Mutations are Server Actions in `lib/actions.ts`; they validate input and call `revalidatePath`.
- Shared types and constants (statuses, label colors, tag normalization) live in `lib/types.ts`; Markdown helpers in `lib/markdown.ts`.
- Pin `better-sqlite3` to v12; v13 crashes natively on this machine.

### Data model

- Project: title, description, done, tags (global `Tag`, many-to-many), labels (per-project `Label`, with a color).
- Task: belongs to a project; status `TODO | IN_PROGRESS | BLOCKED | DONE`; Markdown description; labels from its project only.
- Tags are created on first use; labels are edited in the project settings dialog.
