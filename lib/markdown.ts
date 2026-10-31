// Matches "- [ ]", "* [x]", "1. [ ]" (optionally inside blockquotes) at the start of a line.
const TASK_ITEM = /^(\s*(?:>\s*)*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\])/;
const FENCE = /^\s*(```|~~~)/;

function taskLines(source: string): { index: number; checked: boolean }[] {
    const found: { index: number; checked: boolean }[] = [];
    let inFence = false;
    source.split("\n").forEach((line, index) => {
        if (FENCE.test(line)) inFence = !inFence;
        else if (!inFence) {
            const m = TASK_ITEM.exec(line);
            if (m) found.push({ index, checked: m[2] !== " " });
        }
    });
    return found;
}

/** Flips the checkbox on the given 1-based source line. */
export function toggleCheckbox(source: string, line: number): string {
    const lines = source.split("\n");
    const current = lines[line - 1];
    if (current === undefined) return source;
    lines[line - 1] = current.replace(
        TASK_ITEM,
        (_, pre: string, mark: string, post: string) => `${pre}${mark === " " ? "x" : " "}${post}`,
    );
    return lines.join("\n");
}

export function checklistProgress(source: string): { done: number; total: number } {
    const items = taskLines(source);
    return { done: items.filter((i) => i.checked).length, total: items.length };
}

/** Rough plain-text version of markdown, for card previews. */
export function plainExcerpt(source: string): string {
    return source
        .split("\n")
        .filter((l) => !TASK_ITEM.test(l) && !FENCE.test(l))
        .map((l) =>
            l
                .replace(/^\s*(?:#{1,6}|>|[-*+]|\d+[.)])\s+/, "")
                .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
                .replace(/[*_`~]/g, "")
                .trim(),
        )
        .filter(Boolean)
        .join(" ");
}
