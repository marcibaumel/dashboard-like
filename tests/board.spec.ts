import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function createProject(page: Page, title: string, key: string) {
    await page.goto("/");
    await page.getByRole("button", { name: "+ New project" }).click();
    const dialog = page.getByRole("dialog", { name: "New project" });
    await dialog.getByLabel("Title").fill(title);
    await dialog.getByLabel("Project key").fill(key);
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page).toHaveURL(/\/projects\/\d+$/);
}

async function addTask(page: Page, title: string) {
    const input = page.getByPlaceholder("+ Add task").first();
    await input.fill(title);
    await input.press("Enter");
}

test("project keys are unique and descriptions persist", async ({ page }) => {
    await createProject(page, "First project", "SIR");
    await page.getByRole("button", { name: "Project settings" }).click();
    const settings = page.getByRole("dialog", { name: "Project settings" });
    await expect(settings.getByLabel("Project key")).toHaveValue("SIR");
    await expect(settings.getByLabel("Project key")).toHaveAttribute("readonly", "");
    await settings.getByLabel("Description").fill("Updated description");
    await settings.getByLabel("Description").blur();
    await expect(settings.getByLabel("Description")).toHaveValue("Updated description");
    await settings.getByRole("button", { name: "Close" }).click();
    await expect(page.getByText("Updated description")).toBeVisible();
    await page.reload();
    await expect(page.getByText("Updated description")).toBeVisible();

    await page.goto("/");
    await page.getByRole("button", { name: "+ New project" }).click();
    const dialog = page.getByRole("dialog", { name: "New project" });
    await dialog.getByLabel("Title").fill("Second project");
    await dialog.getByLabel("Project key").fill("sir");
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("already in use");
    await expect(dialog.getByLabel("Title")).toHaveValue("Second project");
    await dialog.getByLabel("Project key").fill("NEW");
    await dialog.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page).toHaveURL(/\/projects\/\d+$/);
    await addTask(page, "Independent numbering");
    await expect(page.getByText("NEW-1", { exact: true })).toBeVisible();
});

test("task checklists, numbering and deletion persist", async ({ page }) => {
    await createProject(page, "Checklist project", "CHK");
    await addTask(page, "First task");
    await expect(page.getByText("CHK-1", { exact: true })).toBeVisible();
    await page.getByText("CHK-1", { exact: true }).click();
    const dialog = page.getByRole("dialog", { name: /CHK-1 Task details/ });
    await dialog.getByRole("button", { name: "Add checklist" }).click();
    const item = dialog.getByLabel("Checklist item");
    await item.fill("First item");
    await item.press("Enter");
    await item.fill("Second item");
    await item.press("Enter");
    await dialog.getByRole("listitem").filter({ hasText: "First item" }).getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "bug", exact: true }).click();
    await item.fill("Third item");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("1/3", { exact: true })).toBeVisible();
    await page.reload();
    await page.getByText("CHK-1", { exact: true }).click();
    await expect(dialog.getByRole("listitem")).toHaveCount(3);
    await expect(dialog.getByRole("listitem").filter({ hasText: "First item" }).getByRole("checkbox")).toBeChecked();
    await expect(dialog.getByText("Third item")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "bug", exact: true })).toHaveAttribute("aria-pressed", "true");
    page.once("dialog", (confirmation) => confirmation.accept());
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("CHK-1", { exact: true })).toHaveCount(0);
    await addTask(page, "Next task");
    await expect(page.getByText("CHK-2", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("CHK-2", { exact: true })).toBeVisible();
});

test("dragging a task between columns persists after reload", async ({ page }) => {
    await createProject(page, "Board project", "BOARD");
    await addTask(page, "Move this task");
    const task = page.locator("li.taskItem").filter({ hasText: "BOARD-1" });
    const destination = page
        .locator("section.boardColumn")
        .filter({ has: page.getByRole("heading", { name: /In Progress/ }) });
    await expect(task).toBeVisible();
    await task.dragTo(destination);
    await expect(destination.locator("li.taskItem")).toContainText("BOARD-1");
    await page.reload();
    await expect(destination.locator("li.taskItem")).toContainText("BOARD-1");
});
