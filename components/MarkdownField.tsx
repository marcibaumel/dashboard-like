"use client";

import { useState } from "react";
import MarkdownView from "@/components/MarkdownView";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { appendChecklistItem } from "@/lib/markdown";
import { MAX_TASK_DESCRIPTION_LENGTH } from "@/lib/types";

/** Markdown textarea with a preview tab whose task-list checkboxes can be ticked. */
export default function MarkdownField({
    id,
    value,
    onChange,
    checklistDraft,
    onChecklistDraftChange,
}: {
    id?: string;
    value: string;
    onChange: (next: string) => void;
    checklistDraft: string;
    onChecklistDraftChange: (next: string) => void;
}) {
    const [mode, setMode] = useState<"write" | "preview">(value.trim() ? "preview" : "write");
    const [addingChecklist, setAddingChecklist] = useState(false);
    const nextDescription = appendChecklistItem(value, checklistDraft);
    const tooLong = nextDescription.length > MAX_TASK_DESCRIPTION_LENGTH;

    function addChecklistItem() {
        if (!checklistDraft.trim() || tooLong) return;
        onChange(nextDescription);
        onChecklistDraftChange("");
    }

    return (
        <div className={"markdownField"}>
            <div className={"markdownToolbar"}>
                <div className={"markdownTabs"} role="tablist">
                    <button
                        className={["markdownTab", mode === "write" && "markdownTabActive"].filter(Boolean).join(" ")}
                        type="button"
                        role="tab"
                        onClick={() => setMode("write")}
                    >
                        Write
                    </button>
                    <button
                        className={["markdownTab", mode === "preview" && "markdownTabActive"].filter(Boolean).join(" ")}
                        type="button"
                        role="tab"
                        onClick={() => setMode("preview")}
                    >
                        Preview
                    </button>
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        setMode("preview");
                        setAddingChecklist(true);
                    }}
                >
                    Add checklist
                </Button>
            </div>
            {mode === "write" ? (
                <>
                    <Textarea
                        id={id}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={8}
                        maxLength={MAX_TASK_DESCRIPTION_LENGTH}
                        placeholder="Describe the task"
                    />
                    <p className={"markdownHint"}>Markdown supported, including task lists (- [ ] item).</p>
                </>
            ) : (
                <div className={"markdownPreview"}>
                    {value.trim() ? (
                        <MarkdownView source={value} onChange={onChange} />
                    ) : (
                        <p className={"markdownEmpty"}>Nothing to preview.</p>
                    )}
                </div>
            )}
            {addingChecklist && (
                <div className={"checklistComposer"}>
                    <label className={"fieldLabel"} htmlFor={`${id}-checklist-item`}>
                        Checklist item
                    </label>
                    <div className={"checklistComposerControls"}>
                        <Input
                            id={`${id}-checklist-item`}
                            value={checklistDraft}
                            onChange={(e) => onChecklistDraftChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                                    e.preventDefault();
                                    addChecklistItem();
                                }
                            }}
                            maxLength={MAX_TASK_DESCRIPTION_LENGTH}
                            placeholder="Type an item and press Enter"
                            aria-describedby={tooLong ? `${id}-checklist-error` : `${id}-checklist-hint`}
                            autoFocus
                        />
                        <Button
                            type="button"
                            size="sm"
                            onClick={addChecklistItem}
                            disabled={tooLong || !checklistDraft.trim()}
                        >
                            Add
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={tooLong}
                            onClick={() => {
                                addChecklistItem();
                                setAddingChecklist(false);
                            }}
                        >
                            Done
                        </Button>
                    </div>
                    <p className={"markdownHint"} id={`${id}-checklist-hint`}>
                        Press Enter to add an item and continue. Save the task to keep your changes.
                    </p>
                    {tooLong && (
                        <p className={"checklistError"} id={`${id}-checklist-error`} role="alert">
                            The description cannot exceed {MAX_TASK_DESCRIPTION_LENGTH} characters. Shorten this item or
                            the description.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
