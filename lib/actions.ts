"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as db from "./db";
import {
    isLabelColor,
    isStatus,
    normalizeTags,
    MAX_LABEL_LENGTH,
    type Label,
    type LabelColor,
    type Status,
    type Task,
} from "./types";

function clean(value: unknown, max: number): string {
    return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function refresh() {
    revalidatePath("/", "layout");
}

export async function createProjectAction(formData: FormData): Promise<void> {
    const title = clean(formData.get("title"), 120);
    if (!title) return;
    const project = await db.createProject(
        title,
        clean(formData.get("description"), 1000),
        normalizeTags(formData.getAll("tags")),
    );
    refresh();
    redirect(`/projects/${project.id}`);
}

export async function renameProjectAction(projectId: number, title: string): Promise<string | null> {
    const t = clean(title, 120);
    if (!t) return null;
    const project = await db.updateProject(Number(projectId), { title: t });
    refresh();
    return project?.title ?? null;
}

export async function setProjectDoneAction(projectId: number, done: boolean): Promise<boolean> {
    const project = await db.updateProject(Number(projectId), { done: Boolean(done) });
    refresh();
    return project?.done ?? false;
}

export async function setProjectTagsAction(projectId: number, tags: string[]): Promise<string[]> {
    const project = await db.updateProject(Number(projectId), { tags: normalizeTags(tags) });
    refresh();
    return project?.tags ?? [];
}

export async function deleteProjectAction(projectId: number): Promise<void> {
    await db.deleteProject(Number(projectId));
    refresh();
    redirect("/");
}

export async function createLabelAction(projectId: number, name: string, color: LabelColor): Promise<Label | null> {
    const n = clean(name, MAX_LABEL_LENGTH);
    if (!n || !isLabelColor(color) || !(await db.getProject(Number(projectId)))) return null;
    const label = (await db.createLabel(Number(projectId), n, color)) ?? null;
    refresh();
    return label;
}

export async function updateLabelAction(
    labelId: number,
    fields: { name?: string; color?: LabelColor },
): Promise<Label | null> {
    const patch: { name?: string; color?: LabelColor } = {};
    if (fields.name !== undefined) {
        patch.name = clean(fields.name, MAX_LABEL_LENGTH);
        if (!patch.name) return null;
    }
    if (fields.color !== undefined) {
        if (!isLabelColor(fields.color)) return null;
        patch.color = fields.color;
    }
    const label = (await db.updateLabel(Number(labelId), patch)) ?? null;
    refresh();
    return label;
}

export async function deleteLabelAction(labelId: number): Promise<void> {
    await db.deleteLabel(Number(labelId));
    refresh();
}

export async function createTaskAction(projectId: number, title: string, status: Status): Promise<Task | null> {
    const t = clean(title, 200);
    if (!t || !isStatus(status) || !(await db.getProject(Number(projectId)))) return null;
    const task = await db.createTask(Number(projectId), t, "", status);
    refresh();
    return task;
}

export async function reorderTasksAction(projectId: number, status: Status, taskIds: number[]): Promise<boolean> {
    const id = Number(projectId);
    if (
        !Number.isInteger(id) ||
        !isStatus(status) ||
        !Array.isArray(taskIds) ||
        taskIds.some((taskId) => !Number.isInteger(taskId)) ||
        new Set(taskIds).size !== taskIds.length ||
        !(await db.getProject(id))
    ) {
        return false;
    }
    const reordered = await db.reorderTasks(id, status, taskIds);
    if (reordered) refresh();
    return reordered;
}

export async function updateTaskAction(
    taskId: number,
    fields: { title?: string; description?: string; status?: Status; labelIds?: number[] },
): Promise<Task | null> {
    const patch: { title?: string; description?: string; status?: Status; labelIds?: number[] } = {};
    if (fields.title !== undefined) {
        patch.title = clean(fields.title, 200);
        if (!patch.title) return null;
    }
    if (fields.description !== undefined) patch.description = clean(fields.description, 5000);
    if (fields.status !== undefined) {
        if (!isStatus(fields.status)) return null;
        patch.status = fields.status;
    }
    if (fields.labelIds !== undefined) {
        patch.labelIds = fields.labelIds.filter((id) => Number.isInteger(id));
    }
    const task = (await db.updateTask(Number(taskId), patch)) ?? null;
    refresh();
    return task;
}

export async function deleteTaskAction(taskId: number): Promise<void> {
    await db.deleteTask(Number(taskId));
    refresh();
}
