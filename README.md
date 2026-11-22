# dashboard-like

## Project keys and task numbers

Each project has a unique, permanent key, chosen when the project is created. Keys start with a
letter and contain up to 10 letters or digits. Task identifiers combine this key with a
project-local number, such as `SIR-1`. Numbers are assigned in creation order and are not reused
when tasks are deleted. Existing projects receive generated keys and their tasks are numbered in
creation order on upgrade. Older database backups are upgraded on import in the same way.

## Task checklists

In a task's description, select **Add checklist**, type an item, and press Enter to add it. Keep typing
and pressing Enter to add more items. Check items in the preview, then save the task to keep your
changes. Checklists are stored as Markdown, so they can also be edited in the Write tab.

## Rebuild and restart

On Linux with the `dashboard-like.service` user systemd service installed, run this from the project directory:

```sh
npm run restart
```

This builds the current code and restarts the service only if the build succeeds. The existing
`npm run rebuild:restart` command does the same thing. To restart without rebuilding, run
`systemctl --user restart dashboard-like.service`.

If you're running `npm run dev` in a terminal instead, stop it with Ctrl+C and run `npm run dev` again.

## Tests

Install dependencies and the Playwright Chromium browser, then run the test suite:

```sh
npm ci
npx playwright install chromium
npm test
```

For Linux CI, use `npx playwright install --with-deps chromium` to install browser system
dependencies. `npm run test:ui` opens Playwright's interactive runner. Tests launch their own
Next.js development server on port 3199 and use a temporary SQLite database, not `kanban.db`.
Set `PLAYWRIGHT_PORT` to use another port if needed. The tests run serially because the backup
API replaces the database; each test starts from an empty database. Failure traces are saved in
`test-results`, and CI also produces an HTML report in `playwright-report`.

GitHub Actions runs lint for pushes and pull requests, and runs the Playwright suite on every push
to `main`. If tests fail, the workflow uploads the report and traces as an artifact.

The server accepts `KANBAN_DATABASE_FILE` as an optional SQLite file path; without it, the
database remains `kanban.db` in the project directory.

## SQLite backups

The API at `/api/database` exports the current SQLite database with `GET` and imports a database file with `POST`. Set `DATABASE_API_TOKEN` on the server before using either method; requests must include it as a bearer token. Imports replace the app's projects, tasks, tags, and labels inside a transaction. Uploads are limited to 128 MiB and must pass SQLite integrity, schema, and foreign-key checks.

In PowerShell, set the token before starting the app:

```powershell
$env:DATABASE_API_TOKEN = "your-long-random-token"
npm.cmd run dev
```

Download a backup:

```powershell
curl.exe --fail -H "Authorization: Bearer $env:DATABASE_API_TOKEN" http://localhost:3000/api/database --output kanban-backup.sqlite
```

Restore a backup:

```powershell
curl.exe --fail -X POST -H "Authorization: Bearer $env:DATABASE_API_TOKEN" -H "Content-Type: application/vnd.sqlite3" --data-binary "@kanban-backup.sqlite" http://localhost:3000/api/database
```
