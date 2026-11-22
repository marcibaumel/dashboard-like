# dashboard-like

## Task checklists

In a task's description, select **Add checklist**, type an item, and press Enter to add it. Keep typing
and pressing Enter to add more items. Check items in the preview, then save the task to keep your
changes. Checklists are stored as Markdown, so they can also be edited in the Write tab.

## Rebuild and restart

On Linux with the `dashboard-like.service` user systemd service installed, run:

```sh
npm run rebuild:restart
```

The service is restarted only if the production build succeeds.

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
