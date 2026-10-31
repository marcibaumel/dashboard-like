"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import styled from "styled-components";
import { Badge } from "@/components/ui/badge";
import { MAX_TAG_LENGTH, normalizeTag } from "@/lib/types";

interface Props {
    value: string[];
    onChange: (tags: string[]) => void;
    suggestions: string[];
    /** When set, each tag is also emitted as a hidden form field. */
    name?: string;
    id?: string;
}

const MAX_SUGGESTIONS = 6;

const Root = styled.div`
    position: relative;
`;

const Box = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 4px 8px;
    border: 1px solid var(--input);
    border-radius: 8px;

    &:focus-within {
        border-color: var(--ring);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent);
    }
`;

const Remove = styled.button`
    display: inline-flex;
    padding: 0;
    border: 0;
    background: none;
    border-radius: 999px;

    &:hover {
        color: var(--destructive);
    }
`;

const TextInput = styled.input`
    flex: 1;
    min-width: 96px;
    border: 0;
    background: transparent;
    outline: none;

    &::placeholder {
        color: var(--muted-foreground);
    }
`;

// Floats over the dialog so opening it never changes the dialog's height.
const Dropdown = styled.ul`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 70;
    margin-top: 4px;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--popover);
    box-shadow: 0 6px 20px rgb(0 0 0 / 0.15);
`;

const Option = styled.li<{ $active: boolean }>`
    padding: 6px 8px;
    border-radius: 6px;
    background: ${(p) => (p.$active ? "var(--accent)" : "transparent")};
    cursor: pointer;
`;

export default function TagInput({ value, onChange, suggestions, name, id }: Props) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);

    const q = normalizeTag(query);
    const matches = suggestions
        .filter((t) => !value.includes(t) && t.includes(q))
        .sort((a, b) => Number(b.startsWith(q)) - Number(a.startsWith(q)))
        .slice(0, MAX_SUGGESTIONS);
    const canCreate = q !== "" && !value.includes(q) && !suggestions.includes(q);
    const options = [
        ...matches.map((t) => ({ tag: t, isNew: false })),
        ...(canCreate ? [{ tag: q, isNew: true }] : []),
    ];
    const highlighted = Math.min(active, options.length - 1);

    function add(tag: string) {
        const t = normalizeTag(tag);
        if (t && !value.includes(t)) onChange([...value, t]);
        setQuery("");
        setActive(0);
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            if (e.key === "Enter" && options[highlighted]) add(options[highlighted].tag);
            else if (q) add(q);
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (options.length) {
                setOpen(true);
                setActive((highlighted + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
            }
        } else if (e.key === "Backspace" && query === "" && value.length) {
            onChange(value.slice(0, -1));
        } else if (e.key === "Escape" && open) {
            e.stopPropagation();
            setOpen(false);
        }
    }

    return (
        <Root>
            <Box>
                {value.map((t) => (
                    <Badge key={t} variant="secondary">
                        #{t}
                        <Remove
                            type="button"
                            aria-label={`Remove tag ${t}`}
                            onClick={() => onChange(value.filter((x) => x !== t))}
                        >
                            <XIcon />
                        </Remove>
                    </Badge>
                ))}
                <TextInput
                    id={id}
                    value={query}
                    maxLength={MAX_TAG_LENGTH}
                    placeholder={value.length ? "" : "Add tags…"}
                    autoComplete="off"
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setActive(0);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => {
                        setOpen(false);
                        if (q) add(q);
                    }}
                    onKeyDown={onKeyDown}
                />
            </Box>

            {open && options.length > 0 && (
                <Dropdown role="listbox">
                    {options.map((o, i) => (
                        <Option
                            key={o.tag + o.isNew}
                            role="option"
                            aria-selected={i === highlighted}
                            $active={i === highlighted}
                            // Keeps input focus so blur doesn't commit the half-typed query first.
                            onMouseDown={(e) => {
                                e.preventDefault();
                                add(o.tag);
                            }}
                            onMouseEnter={() => setActive(i)}
                        >
                            {o.isNew ? (
                                <>
                                    Create <strong>#{o.tag}</strong>
                                </>
                            ) : (
                                <>#{o.tag}</>
                            )}
                        </Option>
                    ))}
                </Dropdown>
            )}

            {name && value.map((t) => <input key={t} type="hidden" name={name} value={t} />)}
        </Root>
    );
}
