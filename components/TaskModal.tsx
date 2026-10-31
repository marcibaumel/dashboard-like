"use client";

import { useState } from "react";
import styled from "styled-components";
import MarkdownField from "@/components/MarkdownField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteTaskAction, updateTaskAction } from "@/lib/actions";
import { LABEL_COLORS, STATUSES, STATUS_LABELS, type Label as TaskLabel, type Status, type Task } from "@/lib/types";

const WideContent = styled(DialogContent)`
    && {
        max-width: 600px;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const Muted = styled.span`
    color: var(--muted-foreground);
`;

const Chips = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
`;

const Chip = styled.button<{ $on: boolean }>`
    padding: 0;
    border: 0;
    background: none;
    opacity: ${(p) => (p.$on ? 1 : 0.5)};

    &:hover {
        opacity: 1;
    }
`;

const Footer = styled(DialogFooter)`
    justify-content: space-between;
`;

const Actions = styled.div`
    display: flex;
    gap: 8px;
`;

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
            <WideContent>
                <Form onSubmit={save}>
                    <DialogHeader>
                        <DialogTitle>
                            <Muted>#{task.id}</Muted> Task details
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
                        <Chips>
                            {labels.map((l) => {
                                const on = labelIds.includes(l.id);
                                return (
                                    <Chip
                                        key={l.id}
                                        type="button"
                                        $on={on}
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
                                    </Chip>
                                );
                            })}
                            {labels.length === 0 && <Muted>No labels yet. Add some in the project settings.</Muted>}
                        </Chips>
                    </Field>
                    <Footer>
                        <Button type="button" variant="destructive" onClick={remove} disabled={busy}>
                            Delete
                        </Button>
                        <Actions>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={busy}>
                                Save
                            </Button>
                        </Actions>
                    </Footer>
                </Form>
            </WideContent>
        </Dialog>
    );
}
