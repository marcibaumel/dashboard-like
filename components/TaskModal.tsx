"use client";

import { useState } from "react";
import MarkdownField from "@/components/MarkdownField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteTaskAction, updateTaskAction } from "@/lib/actions";
import { LABEL_COLORS, STATUSES, STATUS_LABELS, type Label as TaskLabel, type Status, type Task } from "@/lib/types";

interface Props {
    task: Task;
    labels: TaskLabel[];
    onSaved: (task: Task) => void;
    onDeleted: (id: number) => void;
    onClose: () => void;
}

export default function TaskModal({ task, labels, onSaved, onDeleted, onClose }: Props) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [status, setStatus] = useState<Status>(task.status);
    const [labelIds, setLabelIds] = useState<number[]>(task.labelIds);
    const [busy, setBusy] = useState(false);

    async function save(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;
        setBusy(true);
        const updated = await updateTaskAction(task.id, { title, description, status, labelIds });
        setBusy(false);
        if (updated) {
            onSaved(updated);
            onClose();
        }
    }

    async function remove() {
        if (!confirm("Delete this task?")) return;
        setBusy(true);
        await deleteTaskAction(task.id);
        onDeleted(task.id);
        onClose();
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent wide>
                <form className={"taskForm"} onSubmit={save}>
                    <DialogHeader>
                        <DialogTitle>
                            <span className={"taskMuted"}>#{task.id}</span> Task details
                        </DialogTitle>
                    </DialogHeader>
                    <Field>
                        <Label htmlFor="task-title">Title</Label>
                        <Input
                            id="task-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={200}
                            required
                        />
                    </Field>
                    <Field>
                        <Label htmlFor="task-description">Description</Label>
                        <MarkdownField id="task-description" value={description} onChange={setDescription} />
                    </Field>
                    <Field>
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(v) => v && setStatus(v as Status)} items={STATUS_LABELS}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {STATUS_LABELS[s]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field>
                        <Label>Labels</Label>
                        <div className={"taskLabelChips"}>
                            {labels.map((l) => {
                                const on = labelIds.includes(l.id);
                                return (
                                    <button
                                        className={["taskLabelChip", on && "taskLabelChipOn"].filter(Boolean).join(" ")}
                                        key={l.id}
                                        type="button"
                                        aria-pressed={on}
                                        onClick={() =>
                                            setLabelIds((cur) =>
                                                on ? cur.filter((id) => id !== l.id) : [...cur, l.id],
                                            )
                                        }
                                    >
                                        <Badge variant="outline" color={on ? LABEL_COLORS[l.color] : undefined}>
                                            {l.name}
                                        </Badge>
                                    </button>
                                );
                            })}
                            {labels.length === 0 && (
                                <span className={"taskMuted"}>No labels yet. Add some in the project settings.</span>
                            )}
                        </div>
                    </Field>
                    <DialogFooter className={"taskFooter"}>
                        <Button type="button" variant="destructive" onClick={remove} disabled={busy}>
                            Delete
                        </Button>
                        <div className={"taskActions"}>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={busy}>
                                Save
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
