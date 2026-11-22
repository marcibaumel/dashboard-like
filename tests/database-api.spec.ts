import Database from "better-sqlite3";
import { readFile } from "node:fs/promises";
import { auth, expect, sqliteHeaders, test } from "./fixtures";

test("backup API enforces authorization and validates uploads", async ({ request }) => {
    expect((await request.get("/api/database")).status()).toBe(401);
    expect((await request.get("/api/database", { headers: { Authorization: "Bearer wrong" } })).status()).toBe(401);
    expect((await request.post("/api/database", { data: "invalid" })).status()).toBe(401);
    expect(
        (
            await request.post("/api/database", { headers: { ...auth, "Content-Type": "text/plain" }, data: "invalid" })
        ).status(),
    ).toBe(415);
    expect((await request.post("/api/database", { headers: sqliteHeaders, data: "" })).status()).toBe(400);
    expect((await request.post("/api/database", { headers: sqliteHeaders, data: "not sqlite" })).status()).toBe(400);

    const backup = await request.get("/api/database", { headers: auth });
    expect(backup.status()).toBe(200);
    expect(backup.headers()["content-type"]).toContain("application/vnd.sqlite3");
    expect((await backup.body()).subarray(0, 16).toString()).toBe("SQLite format 3\u0000");
});

test("exports and restores projects and tasks", async ({ page, request }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "+ New project" }).click();
    const dialog = page.getByRole("dialog", { name: "New project" });
    await dialog.getByLabel("Title").fill("Backup project");
    await dialog.getByLabel("Project key").fill("BAK");
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page).toHaveURL(/\/projects\/\d+$/);
    const input = page.getByPlaceholder("+ Add task").first();
    await input.fill("Backed up task");
    await input.press("Enter");
    await expect(page.getByText("BAK-1", { exact: true })).toBeVisible();
    const backup = await request.get("/api/database", { headers: auth });
    expect(backup.status()).toBe(200);
    const snapshot = await backup.body();

    await input.fill("Created after backup");
    await input.press("Enter");
    await expect(page.getByText("BAK-2", { exact: true })).toBeVisible();
    const restored = await request.post("/api/database", { headers: sqliteHeaders, data: snapshot });
    expect(restored.status()).toBe(200);
    await page.reload();
    await expect(page.getByText("BAK-1", { exact: true })).toBeVisible();
    await expect(page.getByText("BAK-2", { exact: true })).toHaveCount(0);
    await input.fill("Created after restore");
    await input.press("Enter");
    await expect(page.getByText("BAK-2", { exact: true })).toBeVisible();
});

test("legacy backups receive project keys and creation-ordered task numbers", async ({ request, page }, testInfo) => {
    const file = testInfo.outputPath("legacy.sqlite");
    const db = new Database(file);
    try {
        db.exec(`
            CREATE TABLE tags (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
            CREATE TABLE projects (id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, done INTEGER NOT NULL, createdAt TEXT NOT NULL, labelsSeeded INTEGER NOT NULL);
            CREATE TABLE tasks (id INTEGER PRIMARY KEY, projectId INTEGER NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, status TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, sortOrder INTEGER NOT NULL);
            CREATE TABLE labels (id INTEGER PRIMARY KEY, projectId INTEGER NOT NULL, name TEXT NOT NULL, color TEXT NOT NULL);
            CREATE TABLE project_tags (projectsId INTEGER NOT NULL, tagsId INTEGER NOT NULL);
            CREATE TABLE task_labels (tasksId INTEGER NOT NULL, labelsId INTEGER NOT NULL);
            INSERT INTO projects VALUES (1, 'Silver River', '', 0, '2025-01-01', 1), (2, 'Silver Ridge', '', 0, '2025-01-01', 1);
            INSERT INTO tasks VALUES (1, 1, 'Later', '', 'TODO', '2025-01-03', '2025-01-03', 0),
                                     (2, 1, 'Earlier', '', 'TODO', '2025-01-02', '2025-01-02', 1),
                                     (3, 2, 'Other', '', 'TODO', '2025-01-02', '2025-01-02', 0);
        `);
    } finally {
        db.close();
    }
    const imported = await request.post("/api/database", { headers: sqliteHeaders, data: await readFile(file) });
    expect(imported.status(), await imported.text()).toBe(200);
    await page.goto("/projects/1");
    await expect(page.locator("li.taskItem").filter({ hasText: "Earlier" })).toContainText("SIL-1");
    await expect(page.locator("li.taskItem").filter({ hasText: "Later" })).toContainText("SIL-2");
    await page.goto("/projects/2");
    await expect(page.getByText("SIL2-1", { exact: true })).toBeVisible();
});
