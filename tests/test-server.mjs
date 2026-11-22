import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const directory = mkdtempSync(path.join(tmpdir(), "kanban-playwright-"));
const server = spawn(
    process.execPath,
    [
        path.join(process.cwd(), "node_modules/next/dist/bin/next"),
        "dev",
        "--webpack",
        "-p",
        process.env.PLAYWRIGHT_PORT || "3199",
    ],
    {
        stdio: "inherit",
        env: {
            ...process.env,
            KANBAN_DATABASE_FILE: path.join(directory, "test.db"),
            KANBAN_NEXT_DIST_DIR: ".next-playwright",
            KANBAN_NEXT_TSCONFIG: "tsconfig.playwright.json",
            DATABASE_API_TOKEN: "playwright-test-token",
        },
    },
);

function stop() {
    if (server.exitCode === null && server.signalCode === null) server.kill("SIGTERM");
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.on("error", (error) => {
    console.error("Could not start the test server:", error);
    rmSync(directory, { recursive: true, force: true });
    process.exitCode = 1;
});
server.on("exit", (code, signal) => {
    rmSync(directory, { recursive: true, force: true });
    process.exitCode = signal && signal !== "SIGTERM" ? 1 : (code ?? 0);
});
