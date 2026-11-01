# dashboard-like

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
