"use client";

import { useState, useTransition } from "react";
import { SettingsIcon } from "lucide-react";
import styled from "styled-components";
import LabelEditor from "@/components/LabelEditor";
import TagInput from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Field, Input, Label } from "@/components/ui/input";
import { deleteProjectAction, renameProjectAction, setProjectDoneAction, setProjectTagsAction } from "@/lib/actions";
import type { Label as ProjectLabel } from "@/lib/types";

const Footer = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
`;

// Sits above a card's stretched link so the button stays clickable.
const Trigger = styled.span`
    position: relative;
    z-index: 1;
`;

interface Props {
    project: { id: number; title: string; done: boolean; tags: string[]; labels: ProjectLabel[] };
    allTags: string[];
}

export default function ProjectSettings({ project, allTags }: Props) {
    const [title, setTitle] = useState(project.title);
    const [draft, setDraft] = useState(project.title);
    const [done, setDone] = useState(project.done);
    const [tags, setTags] = useState(project.tags);
    const [pending, startTransition] = useTransition();

    function commitTitle() {
        const next = draft.trim();
        if (!next || next === title) return setDraft(title);
        startTransition(async () => {
            const saved = await renameProjectAction(project.id, next);
            setTitle(saved ?? title);
            setDraft(saved ?? title);
        });
    }

    function changeTags(next: string[]) {
        setTags(next);
        startTransition(async () => setTags(await setProjectTagsAction(project.id, next)));
    }

    function toggleDone() {
        startTransition(async () => setDone(await setProjectDoneAction(project.id, !done)));
    }

    function remove() {
        if (!confirm(`Delete "${title}" and all its tasks?`)) return;
        startTransition(() => deleteProjectAction(project.id));
    }

    return (
        <Dialog>
            <Trigger>
                <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Project settings" />}>
                    <SettingsIcon />
                </DialogTrigger>
            </Trigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Project settings</DialogTitle>
                    <DialogDescription>{title}</DialogDescription>
                </DialogHeader>

                <Field>
                    <Label htmlFor={`project-title-${project.id}`}>Name</Label>
                    <Input
                        id={`project-title-${project.id}`}
                        value={draft}
                        maxLength={120}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={commitTitle}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
                    />
                </Field>

                <Field>
                    <Label htmlFor={`project-tags-${project.id}`}>Tags</Label>
                    <TagInput
                        id={`project-tags-${project.id}`}
                        value={tags}
                        onChange={changeTags}
                        suggestions={allTags}
                    />
                </Field>

                <Field>
                    <Label>Task labels</Label>
                    <LabelEditor projectId={project.id} labels={project.labels} />
                </Field>

                <Footer>
                    <Button variant="destructive" onClick={remove} disabled={pending}>
                        Delete project
                    </Button>
                    <Button variant={done ? "outline" : "default"} onClick={toggleDone} disabled={pending}>
                        {done ? "Reopen project" : "Mark as done"}
                    </Button>
                </Footer>
            </DialogContent>
        </Dialog>
    );
}
