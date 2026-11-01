export const STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    BLOCKED: "Blocked",
    DONE: "Done",
};

export const STATUS_BAR_COLORS: Record<Status, string> = {
    TODO: "#d1d5db",
    IN_PROGRESS: "#3b82f6",
    BLOCKED: "#ef4444",
    DONE: "#22c55e",
};

export function isStatus(value: unknown): value is Status {
    return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export const MAX_TAG_LENGTH = 30;

/** Canonical tag form so "Bug", "#bug " and "bug" are the same tag. */
export function normalizeTag(raw: string): string {
    return raw.trim().replace(/^#+/, "").replace(/\s+/g, "-").toLowerCase().slice(0, MAX_TAG_LENGTH);
}

export function normalizeTags(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    const tags = raw.filter((t): t is string => typeof t === "string").map(normalizeTag);
    return [...new Set(tags.filter(Boolean))];
}

export const LABEL_COLORS = {
    red: "#ef4444",
    orange: "#f97316",
    yellow: "#eab308",
    green: "#22c55e",
    cyan: "#06b6d4",
    blue: "#3b82f6",
    purple: "#a855f7",
    pink: "#ec4899",
    gray: "#6b7280",
} as const;
export type LabelColor = keyof typeof LABEL_COLORS;
export const LABEL_COLOR_KEYS = Object.keys(LABEL_COLORS) as LabelColor[];
export const MAX_LABEL_LENGTH = 30;

export function isLabelColor(value: unknown): value is LabelColor {
    return typeof value === "string" && value in LABEL_COLORS;
}

/** Labels every project starts with; each project can then edit its own set. */
export const DEFAULT_LABELS: { name: string; color: LabelColor }[] = [
    { name: "bug", color: "red" },
    { name: "feature", color: "blue" },
    { name: "enhancement", color: "cyan" },
    { name: "documentation", color: "purple" },
    { name: "question", color: "pink" },
    { name: "help wanted", color: "green" },
    { name: "urgent", color: "orange" },
    { name: "wontfix", color: "gray" },
];

export interface Label {
    id: number;
    name: string;
    color: LabelColor;
}

export interface Project {
    id: number;
    title: string;
    description: string;
    done: boolean;
    tags: string[];
    labels: Label[];
    createdAt: string;
}

export interface ProjectWithCounts extends Project {
    counts: Record<Status, number>;
}

export interface Task {
    id: number;
    projectId: number;
    title: string;
    description: string;
    status: Status;
    sortOrder: number;
    labelIds: number[];
    createdAt: string;
    updatedAt: string;
}
