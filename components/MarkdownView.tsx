"use client";

import { createContext, useContext } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styled from "styled-components";
import { toggleCheckbox } from "@/lib/markdown";

const Prose = styled.div`
    overflow-wrap: anywhere;
    line-height: 1.55;

    > :first-child {
        margin-top: 0;
    }
    > :last-child {
        margin-bottom: 0;
    }
    h1,
    h2,
    h3,
    h4 {
        margin: 16px 0 8px;
        line-height: 1.3;
    }
    h1 {
        font-size: 1.4em;
    }
    h2 {
        font-size: 1.2em;
    }
    h3,
    h4 {
        font-size: 1.05em;
    }
    p,
    ul,
    ol,
    pre,
    blockquote,
    table {
        margin: 0 0 8px;
    }
    ul,
    ol {
        padding-left: 22px;
    }
    ul {
        list-style: disc;
    }
    ul.contains-task-list {
        padding-left: 0;
        list-style: none;
    }
    li.task-list-item {
        display: flex;
        align-items: baseline;
        gap: 8px;
        list-style: none;
    }
    li.task-list-item > p {
        margin: 0;
    }
    li.task-list-item ul.contains-task-list {
        margin: 0;
        padding-left: 22px;
    }
    input[type="checkbox"] {
        margin: 0;
        accent-color: var(--primary);
        cursor: pointer;
        &:disabled {
            cursor: default;
        }
    }
    li.task-list-item:has(input:checked) {
        color: var(--muted-foreground);
        text-decoration: line-through;
    }
    a {
        color: var(--link);
        text-decoration: underline;
    }
    code {
        padding: 1px 5px;
        border-radius: 4px;
        background: var(--muted);
        font-family: var(--font-geist-mono), monospace;
        font-size: 0.9em;
    }
    pre {
        overflow-x: auto;
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--muted);
    }
    pre code {
        padding: 0;
        background: none;
    }
    blockquote {
        padding-left: 12px;
        border-left: 3px solid var(--border);
        color: var(--muted-foreground);
    }
    hr {
        border: 0;
        border-top: 1px solid var(--border);
    }
    table {
        border-collapse: collapse;
    }
    th,
    td {
        padding: 4px 8px;
        border: 1px solid var(--border);
    }
    img {
        max-width: 100%;
    }
`;

// The list item knows its source line, which is how a checkbox finds what to flip.
const SourceLine = createContext<number | undefined>(undefined);

/** Renders markdown; pass `onChange` to make task-list checkboxes clickable. */
export default function MarkdownView({ source, onChange }: { source: string; onChange?: (next: string) => void }) {
    return (
        <Prose>
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
        </Prose>
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
