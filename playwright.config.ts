import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3199);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
    testDir: "./tests",
    fullyParallel: false,
    workers: 1,
    timeout: 60_000,
    expect: { timeout: 20_000 },
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
    use: {
        baseURL,
        trace: "retain-on-failure",
        ...devices["Desktop Chrome"],
    },
    webServer: {
        command: "node tests/test-server.mjs",
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: false,
        gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
    },
});
