"use client";

import { useActionState, useState } from "react";
import TagInput from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import { createProjectAction } from "@/lib/actions";
import { MAX_PROJECT_KEY_LENGTH } from "@/lib/types";

export default function NewProjectForm({ allTags }: { allTags: string[] }) {
    const [open, setOpen] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [state, formAction, pending] = useActionState(createProjectAction, { error: "" });
    const [projectKey, setProjectKey] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>+ New project</DialogTrigger>
            <DialogContent>
                <form className={"newProjectForm"} action={formAction}>
                    <DialogHeader>
                        <DialogTitle>New project</DialogTitle>
                    </DialogHeader>
                    <Field>
                        <Label htmlFor="project-title">Title</Label>
                        <Input
                            id="project-title"
                            name="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            maxLength={120}
                            autoFocus
                        />
                    </Field>
                    <Field>
                        <Label htmlFor="project-key">Project key</Label>
                        <Input
                            id="project-key"
                            name="key"
                            value={projectKey}
                            onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                            required
                            maxLength={MAX_PROJECT_KEY_LENGTH}
                            pattern="[A-Z][A-Z0-9]*"
                            title="Start with a letter; use only letters and numbers."
                            placeholder="e.g. SIR"
                            aria-describedby="project-key-hint"
                        />
                        <p id="project-key-hint" className={"markdownHint"}>
                            Unique identifier for task numbers. Cannot be changed later.
                        </p>
                    </Field>
                    <Field>
                        <Label htmlFor="project-description">Description</Label>
                        <Textarea
                            id="project-description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={1000}
                            rows={3}
                        />
                    </Field>
                    <Field>
                        <Label htmlFor="project-tags">Tags</Label>
                        <TagInput id="project-tags" name="tags" value={tags} onChange={setTags} suggestions={allTags} />
                    </Field>
                    <DialogFooter>
                        {state.error && (
                            <p role="alert" className={"checklistError"}>
                                {state.error}
                            </p>
                        )}
                        <Button type="submit" disabled={pending}>
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
