"use client";

import { useState } from "react";
import styled from "styled-components";
import TagInput from "@/components/TagInput";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import { createProjectAction } from "@/lib/actions";

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export default function NewProjectForm({ allTags }: { allTags: string[] }) {
    const [open, setOpen] = useState(false);
    const [tags, setTags] = useState<string[]>([]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>+ New project</DialogTrigger>
            <DialogContent>
                <Form action={createProjectAction}>
                    <DialogHeader>
                        <DialogTitle>New project</DialogTitle>
                    </DialogHeader>
                    <Field>
                        <Label htmlFor="project-title">Title</Label>
                        <Input id="project-title" name="title" required maxLength={120} autoFocus />
                    </Field>
                    <Field>
                        <Label htmlFor="project-description">Description</Label>
                        <Textarea id="project-description" name="description" maxLength={1000} rows={3} />
                    </Field>
                    <Field>
                        <Label htmlFor="project-tags">Tags</Label>
                        <TagInput id="project-tags" name="tags" value={tags} onChange={setTags} suggestions={allTags} />
                    </Field>
                    <DialogFooter>
                        <Button type="submit">Create</Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
