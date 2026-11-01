"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
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
        <div className={"tagRoot"}>
            <div className={"tagBox"}>
                {value.map((t) => (
                    <Badge key={t} variant="secondary">
                        #{t}
                        <button
                            className={"tagRemove"}
                            type="button"
                            aria-label={`Remove tag ${t}`}
                            onClick={() => onChange(value.filter((x) => x !== t))}
                        >
                            <XIcon />
                        </button>
                    </Badge>
                ))}
                <input
                    className={"tagTextInput"}
                    id={id}
                    value={query}
                    maxLength={MAX_TAG_LENGTH}
                    placeholder={value.length ? "" : "Add tagsâ€¦"}
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
            </div>

            {open && options.length > 0 && (
                <ul className={"tagDropdown"} role="listbox">
                    {options.map((o, i) => (
                        <li
                            className={["tagOption", i === highlighted && "tagOptionActive"].filter(Boolean).join(" ")}
                            key={o.tag + o.isNew}
                            role="option"
                            aria-selected={i === highlighted}
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
                        </li>
                    ))}
                </ul>
            )}

            {name && value.map((t) => <input key={t} type="hidden" name={name} value={t} />)}
        </div>
    );
}
