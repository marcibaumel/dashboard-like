"use client";

import { useState } from "react";
import { SquareCheckIcon } from "lucide-react";
import TaskModal from "@/components/TaskModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createTaskAction, reorderTasksAction } from "@/lib/actions";
import { checklistProgress, plainExcerpt } from "@/lib/markdown";
import {
    LABEL_COLORS,
    STATUSES,
    STATUS_BAR_COLORS,
    STATUS_LABELS,
    type Label,
    type Status,
    type Task,
} from "@/lib/types";

export default function Board({
    projectId,
    initialTasks,
    labels,
}: {
    projectId: number;
    initialTasks: Task[];
    labels: Label[];
}) {
    const [tasks, setTasks] = useState(initialTasks);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [dragOver, setDragOver] = useState<Status | null>(null);
    const [drafts, setDrafts] = useState<Partial<Record<Status, string>>>({});

    const selected = tasks.find((t) => t.id === selectedId) ?? null;
    const labelsById = new Map(labels.map((l) => [l.id, l]));

    async function move(id: number, status: Status) {
        dropTask(id, status);
    }

    async function dropTask(id: number, status: Status, targetId?: number, insertAfter = false) {
        const previous = tasks;
        const dragged = tasks.find((task) => task.id === id);
        if (!dragged) return;

        const targetTasks = tasks.filter((task) => task.status === status && task.id !== id);
        const targetIndex =
            targetId === undefined ? targetTasks.length : targetTasks.findIndex((task) => task.id === targetId);
        if (targetIndex < 0) return;
        targetTasks.splice(targetIndex + (insertAfter && targetId !== undefined ? 1 : 0), 0, {
            ...dragged,
            status,
        });

        const previousOrder = previous.filter((task) => task.status === status).map((task) => task.id);
        const nextOrder = targetTasks.map((task) => task.id);
        if (dragged.status === status && previousOrder.every((taskId, index) => taskId === nextOrder[index])) return;

        const nextTasks = [...tasks.filter((task) => task.status !== status && task.id !== id), ...targetTasks];
        setTasks(nextTasks);
        const saved = await reorderTasksAction(projectId, status, nextOrder);
        if (!saved) setTasks(previous);
    }

    async function addTask(e: React.FormEvent, status: Status) {
        e.preventDefault();
        const title = drafts[status]?.trim();
        if (!title) return;
        setDrafts((d) => ({ ...d, [status]: "" }));
        const task = await createTaskAction(projectId, title, status);
        if (task) setTasks((ts) => [...ts, task]);
    }

    return (
        <>
            <div className={"boardGrid"}>
                {STATUSES.map((status) => {
                    const column = tasks.filter((t) => t.status === status);
                    return (
                        <section
                            key={status}
                            className={["boardColumn", dragOver === status && "boardColumnOver"]
                                .filter(Boolean)
                                .join(" ")}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOver(status);
                            }}
                            onDragLeave={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(null);
                                const id = Number(e.dataTransfer.getData("text/plain"));
                                if (id) move(id, status);
                            }}
                        >
                            <h2 className={"columnTitle"}>
                                <span className={"statusDot"} style={{ backgroundColor: STATUS_BAR_COLORS[status] }} />
                                {STATUS_LABELS[status]}
                                <span className={"taskCount"}>{column.length}</span>
                            </h2>

                            <ul className={"taskList"}>
                                {column.map((task) => {
                                    const progress = checklistProgress(task.description);
                                    const excerpt = plainExcerpt(task.description);
                                    const taskLabels = task.labelIds.flatMap((id) => labelsById.get(id) ?? []);
                                    return (
                                        <li
                                            key={task.id}
                                            className={"taskItem"}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.effectAllowed = "move";
                                                e.dataTransfer.setData("text/plain", String(task.id));
                                            }}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const id = Number(e.dataTransfer.getData("text/plain"));
                                                if (!id || id === task.id) return;
                                                const bounds = e.currentTarget.getBoundingClientRect();
                                                dropTask(
                                                    id,
                                                    status,
                                                    task.id,
                                                    e.clientY >= bounds.top + bounds.height / 2,
                                                );
                                                setDragOver(null);
                                            }}
                                            onClick={() => setSelectedId(task.id)}
                                        >
                                            <Card $size="sm" $hoverable>
                                                <CardContent>
                                                    <div>
                                                        <p className={"taskTitle"}>
                                                            <span className={"taskId"}>#{task.id}</span>
                                                            {task.title}
                                                        </p>
                                                        {excerpt && <p className={"taskExcerpt"}>{excerpt}</p>}
                                                        {progress.total > 0 && (
                                                            <p className={"taskProgress"}>
                                                                <SquareCheckIcon />
                                                                {progress.done}/{progress.total}
                                                            </p>
                                                        )}
                                                        {taskLabels.length > 0 && (
                                                            <div className={"taskChips"}>
                                                                {taskLabels.map((l) => (
                                                                    <Badge
                                                                        key={l.id}
                                                                        variant="outline"
                                                                        color={LABEL_COLORS[l.color]}
                                                                    >
                                                                        {l.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </li>
                                    );
                                })}
                            </ul>

                            <form className={"addTaskForm"} onSubmit={(e) => addTask(e, status)}>
                                <Input
                                    value={drafts[status] ?? ""}
                                    onChange={(e) => setDrafts((d) => ({ ...d, [status]: e.target.value }))}
                                    maxLength={200}
                                    placeholder="+ Add task"
                                />
                            </form>
                        </section>
                    );
                })}
            </div>

            {selected && (
                <TaskModal
                    key={selected.id}
                    task={selected}
                    labels={labels}
                    onClose={() => setSelectedId(null)}
                    onSaved={(updated) =>
                        setTasks((current) => {
                            const previous = current.find((task) => task.id === updated.id);
                            if (previous?.status === updated.status) {
                                return current.map((task) => (task.id === updated.id ? updated : task));
                            }
                            const remaining = current.filter((task) => task.id !== updated.id);
                            return [
                                ...remaining.filter((task) => task.status !== updated.status),
                                ...remaining.filter((task) => task.status === updated.status),
                                updated,
                            ];
                        })
                    }
                    onDeleted={(id) => setTasks((ts) => ts.filter((x) => x.id !== id))}
                />
            )}
        </>
    );
}
