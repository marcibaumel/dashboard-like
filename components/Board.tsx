"use client";

import { useState } from "react";
import { SquareCheckIcon } from "lucide-react";
import styled from "styled-components";
import TaskModal from "@/components/TaskModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createTaskAction, updateTaskAction } from "@/lib/actions";
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

const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;

    @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
    }
    @media (min-width: 1280px) {
        grid-template-columns: repeat(4, 1fr);
    }
`;

const Column = styled.section<{ $over: boolean }>`
    display: flex;
    flex-direction: column;
    min-height: 256px;
    padding: 12px;
    border: 1px solid ${(p) => (p.$over ? "var(--primary)" : "var(--border)")};
    border-radius: 10px;
    background: ${(p) => (p.$over ? "var(--muted)" : "color-mix(in srgb, var(--muted) 40%, transparent)")};
`;

const ColumnTitle = styled.h2`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
`;

const Dot = styled.span<{ $color: string }>`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${(p) => p.$color};
`;

const Count = styled.span`
    margin-left: auto;
    color: var(--muted-foreground);
    font-size: 12px;
    font-weight: 400;
`;

const TaskList = styled.ul`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
`;

const TaskItem = styled.li`
    cursor: pointer;
`;

const TaskTitle = styled.p`
    font-size: 14px;
    font-weight: 500;
`;

const TaskId = styled.span`
    margin-right: 6px;
    color: var(--muted-foreground);
    font-weight: 400;
`;

const Excerpt = styled.p`
    display: -webkit-box;
    margin-top: 4px;
    overflow: hidden;
    color: var(--muted-foreground);
    font-size: 12px;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
`;

const Progress = styled.p`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    color: var(--muted-foreground);
    font-size: 12px;

    svg {
        width: 14px;
        height: 14px;
    }
`;

const Chips = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
`;

const AddForm = styled.form`
    margin-top: 12px;
`;

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
        const prev = tasks;
        if (prev.find((t) => t.id === id)?.status === status) return;
        setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
        const updated = await updateTaskAction(id, { status });
        if (!updated) setTasks(prev);
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
            <Grid>
                {STATUSES.map((status) => {
                    const column = tasks.filter((t) => t.status === status);
                    return (
                        <Column
                            key={status}
                            $over={dragOver === status}
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
                            <ColumnTitle>
                                <Dot $color={STATUS_BAR_COLORS[status]} />
                                {STATUS_LABELS[status]}
                                <Count>{column.length}</Count>
                            </ColumnTitle>

                            <TaskList>
                                {column.map((task) => {
                                    const progress = checklistProgress(task.description);
                                    const excerpt = plainExcerpt(task.description);
                                    const taskLabels = task.labelIds.flatMap((id) => labelsById.get(id) ?? []);
                                    return (
                                        <TaskItem
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => e.dataTransfer.setData("text/plain", String(task.id))}
                                            onClick={() => setSelectedId(task.id)}
                                        >
                                            <Card $size="sm" $hoverable>
                                                <CardContent>
                                                    <div>
                                                        <TaskTitle>
                                                            <TaskId>#{task.id}</TaskId>
                                                            {task.title}
                                                        </TaskTitle>
                                                        {excerpt && <Excerpt>{excerpt}</Excerpt>}
                                                        {progress.total > 0 && (
                                                            <Progress>
                                                                <SquareCheckIcon />
                                                                {progress.done}/{progress.total}
                                                            </Progress>
                                                        )}
                                                        {taskLabels.length > 0 && (
                                                            <Chips>
                                                                {taskLabels.map((l) => (
                                                                    <Badge
                                                                        key={l.id}
                                                                        variant="outline"
                                                                        color={LABEL_COLORS[l.color]}
                                                                    >
                                                                        {l.name}
                                                                    </Badge>
                                                                ))}
                                                            </Chips>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TaskItem>
                                    );
                                })}
                            </TaskList>

                            <AddForm onSubmit={(e) => addTask(e, status)}>
                                <Input
                                    value={drafts[status] ?? ""}
                                    onChange={(e) => setDrafts((d) => ({ ...d, [status]: e.target.value }))}
                                    maxLength={200}
                                    placeholder="+ Add task"
                                />
                            </AddForm>
                        </Column>
                    );
                })}
            </Grid>

            {selected && (
                <TaskModal
                    key={selected.id}
                    task={selected}
                    labels={labels}
                    onClose={() => setSelectedId(null)}
                    onSaved={(t) => setTasks((ts) => ts.map((x) => (x.id === t.id ? t : x)))}
                    onDeleted={(id) => setTasks((ts) => ts.filter((x) => x.id !== id))}
                />
            )}
        </>
    );
}
