"use client";

import { useState } from "react";
import MarkdownView from "@/components/MarkdownView";
import { Textarea } from "@/components/ui/input";

/** Markdown textarea with a preview tab whose task-list checkboxes can be ticked. */
export default function MarkdownField({
    id,
    value,
    onChange,
}: {
    id?: string;
    value: string;
    onChange: (next: string) => void;
}) {
    const [mode, setMode] = useState<"write" | "preview">(value.trim() ? "preview" : "write");

    return (
        <div className={"markdownField"}>
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
            {mode === "write" ? (
                <>
                    <Textarea
                        id={id}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={8}
                        maxLength={5000}
                        placeholder={
                            "Describe the taskâ€¦\n- [ ] checklist item\n**bold**, `code`, [links](https://â€¦)"
                        }
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
        </div>
    );
}
