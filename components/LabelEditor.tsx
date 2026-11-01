"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLabelAction, deleteLabelAction, updateLabelAction } from "@/lib/actions";
import { LABEL_COLORS, LABEL_COLOR_KEYS, MAX_LABEL_LENGTH, type Label, type LabelColor } from "@/lib/types";

const nextColor = (c: LabelColor) => LABEL_COLOR_KEYS[(LABEL_COLOR_KEYS.indexOf(c) + 1) % LABEL_COLOR_KEYS.length];

function ColorDot({ color, onClick }: { color: LabelColor; onClick: () => void }) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Color: ${color} (click to change)`}
            title="Change color"
            onClick={onClick}
        >
            <span className={"labelSwatch"} style={{ backgroundColor: LABEL_COLORS[color] }} />
        </Button>
    );
}

function LabelRow({
    label,
    onUpdate,
    onDelete,
}: {
    label: Label;
    onUpdate: (fields: { name?: string; color?: LabelColor }) => Promise<boolean>;
    onDelete: () => void;
}) {
    const [name, setName] = useState(label.name);

    async function commitName() {
        const next = name.trim();
        if (!next || next === label.name || !(await onUpdate({ name: next }))) setName(label.name);
    }

    return (
        <li className={"labelRow"}>
            <ColorDot color={label.color} onClick={() => onUpdate({ color: nextColor(label.color) })} />
            <Input
                value={name}
                maxLength={MAX_LABEL_LENGTH}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
                aria-label="Label name"
            />
            <Button type="button" variant="ghost" size="icon" aria-label="Delete label" onClick={onDelete}>
                <Trash2Icon />
            </Button>
        </li>
    );
}

export default function LabelEditor({ projectId, labels }: { projectId: number; labels: Label[] }) {
    const [items, setItems] = useState(labels);
    const [name, setName] = useState("");
    const [color, setColor] = useState<LabelColor>("blue");
    const [error, setError] = useState("");

    async function add(e: React.FormEvent) {
        e.preventDefault();
        const n = name.trim();
        if (!n) return;
        const created = await createLabelAction(projectId, n, color);
        if (!created) return setError("A label with that name already exists.");
        setItems((cur) => [...cur, created]);
        setName("");
        setError("");
    }

    async function update(id: number, fields: { name?: string; color?: LabelColor }) {
        const updated = await updateLabelAction(id, fields);
        if (!updated) {
            setError("A label with that name already exists.");
            return false;
        }
        setError("");
        setItems((cur) => cur.map((l) => (l.id === id ? updated : l)));
        return true;
    }

    async function remove(id: number) {
        setItems((cur) => cur.filter((l) => l.id !== id));
        await deleteLabelAction(id);
    }

    return (
        <div className={"labelEditor"}>
            <ul className={"labelList"}>
                {items.map((l) => (
                    <LabelRow
                        key={l.id}
                        label={l}
                        onUpdate={(fields) => update(l.id, fields)}
                        onDelete={() => remove(l.id)}
                    />
                ))}
                {items.length === 0 && <li className={"labelEmpty"}>No labels yet.</li>}
            </ul>
            <form className={"labelAddRow"} onSubmit={add}>
                <ColorDot color={color} onClick={() => setColor(nextColor(color))} />
                <Input
                    value={name}
                    maxLength={MAX_LABEL_LENGTH}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="New label"
                    aria-label="New label name"
                />
                <Button type="submit" variant="outline">
                    Add
                </Button>
            </form>
            {error && <p className={"labelError"}>{error}</p>}
        </div>
    );
}
