"use client";

import { createContext, useContext } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toggleCheckbox } from "@/lib/markdown";

// The list item knows its source line, which is how a checkbox finds what to flip.
const SourceLine = createContext<number | undefined>(undefined);

/** Renders markdown; pass `onChange` to make task-list checkboxes clickable. */
export default function MarkdownView({ source, onChange }: { source: string; onChange?: (next: string) => void }) {
    return (
        <div className={"markdownProse"}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    li: ({ node, ...props }) => (
                        <SourceLine value={node?.position?.start.line}>
                            <li {...props} />
                        </SourceLine>
                    ),
                    input: ({ node: _node, ...props }) => (
                        <TaskCheckbox {...props} source={source} onChange={onChange} />
                    ),
                }}
            >
                {source}
            </ReactMarkdown>
        </div>
    );
}

function TaskCheckbox({
    source,
    onChange,
    checked,
    type,
}: {
    source: string;
    onChange?: (next: string) => void;
    checked?: boolean;
    type?: string;
}) {
    const line = useContext(SourceLine);
    if (type !== "checkbox") return null;
    return (
        <input
            type="checkbox"
            checked={Boolean(checked)}
            disabled={!onChange || line === undefined}
            onChange={() => line !== undefined && onChange?.(toggleCheckbox(source, line))}
        />
    );
}
