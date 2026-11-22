import { test as base, expect } from "@playwright/test";
import Database from "better-sqlite3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const token = "playwright-test-token";
export const auth = { Authorization: `Bearer ${token}` };
export const sqliteHeaders = { ...auth, "Content-Type": "application/vnd.sqlite3" };

export const test = base.extend<{ cleanDatabase: void }>({
    cleanDatabase: [
        async ({ request }, use, testInfo) => {
            const response = await request.get("/api/database", { headers: auth });
            expect(response.ok()).toBeTruthy();
            const file = testInfo.outputPath("empty.sqlite");
            await mkdir(path.dirname(file), { recursive: true });
            await writeFile(file, await response.body());
            const db = new Database(file);
            try {
                db.pragma("foreign_keys = ON");
                db.exec(
                    "DELETE FROM task_labels; DELETE FROM project_tags; DELETE FROM tasks; DELETE FROM labels; DELETE FROM projects; DELETE FROM tags;",
                );
            } finally {
                db.close();
            }
            const reset = await request.post("/api/database", { headers: sqliteHeaders, data: await readFile(file) });
            expect(reset.ok(), await reset.text()).toBeTruthy();
            await use();
        },
        { auto: true },
    ],
});

export { expect } from "@playwright/test";
