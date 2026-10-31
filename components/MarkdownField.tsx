"use client";

import { useState } from "react";
import styled from "styled-components";
import MarkdownView from "@/components/MarkdownView";
import { Textarea } from "@/components/ui/input";

const Tabs = styled.div`
    display: flex;
    gap: 4px;
`;

const Tab = styled.button<{ $active: boolean }>`
    padding: 2px 10px;
    border: 0;
    border-radius: 6px;
    background: ${(p) => (p.$active ? "var(--muted)" : "transparent")};
    color: ${(p) => (p.$active ? "var(--foreground)" : "var(--muted-foreground)")};
    font-size: 13px;
    font-weight: 500;
`;

const Preview = styled.div`
    min-height: 120px;
    max-height: 320px;
    overflow-y: auto;
    padding: 8px 10px;
    border: 1px solid var(--input);
    border-radius: 8px;
`;

const Empty = styled.p`
    color: var(--muted-foreground);
`;

const Hint = styled.p`
    color: var(--muted-foreground);
    font-size: 12px;
`;

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
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Tabs role="tablist">
                <Tab type="button" role="tab" $active={mode === "write"} onClick={() => setMode("write")}>
                    Write
                </Tab>
                <Tab type="button" role="tab" $active={mode === "preview"} onClick={() => setMode("preview")}>
                    Preview
                </Tab>
            </Tabs>
            {mode === "write" ? (
                <>
                    <Textarea
                        id={id}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={8}
                        maxLength={5000}
                        placeholder={"Describe the task…\n- [ ] checklist item\n**bold**, `code`, [links](https://…)"}
                    />
                    <Hint>Markdown supported, including task lists (- [ ] item).</Hint>
                </>
            ) : (
                <Preview>
                    {value.trim() ? (
                        <MarkdownView source={value} onChange={onChange} />
                    ) : (
                        <Empty>Nothing to preview.</Empty>
                    )}
                </Preview>
            )}
        </div>
    );
}
