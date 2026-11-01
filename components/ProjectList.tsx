"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import ProjectSettings from "@/components/ProjectSettings";
import StatusBar from "@/components/StatusBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProjectWithCounts } from "@/lib/types";

type StateFilter = "all" | "active" | "done";

export default function ProjectList({ projects, allTags }: { projects: ProjectWithCounts[]; allTags: string[] }) {
    const [search, setSearch] = useState("");
    const [state, setState] = useState<StateFilter>("all");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const usedTags = useMemo(() => [...new Set(projects.flatMap((p) => p.tags))].sort(), [projects]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return projects
            .filter((p) => {
                if (state === "active" && p.done) return false;
                if (state === "done" && !p.done) return false;
                if (!selectedTags.every((t) => p.tags.includes(t))) return false;
                if (!q) return true;
                return (
                    p.title.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q) ||
                    p.tags.some((t) => t.includes(q.replace(/^#/, "")))
                );
            })
            .sort((a, b) => Number(a.done) - Number(b.done));
    }, [projects, search, state, selectedTags]);

    const toggleTag = (t: string) =>
        setSelectedTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

    return (
        <div className={"projectListWrapper"}>
            <div className={"projectControls"}>
                <div className={"projectSearch"}>
                    <SearchIcon />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects"
                        aria-label="Search projects"
                    />
                </div>
                <div className={"projectStateButtons"}>
                    {(["all", "active", "done"] as const).map((s) => (
                        <Button
                            key={s}
                            size="sm"
                            variant={state === s ? "default" : "outline"}
                            onClick={() => setState(s)}
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            {usedTags.length > 0 && (
                <div className={"projectTagFilter"}>
                    {usedTags.map((t) => (
                        <button
                            className={"projectPlainButton"}
                            key={t}
                            type="button"
                            onClick={() => toggleTag(t)}
                            aria-pressed={selectedTags.includes(t)}
                        >
                            <Badge variant={selectedTags.includes(t) ? "default" : "outline"}>#{t}</Badge>
                        </button>
                    ))}
                    {selectedTags.length > 0 && (
                        <Button size="sm" variant="ghost" onClick={() => setSelectedTags([])}>
                            Clear
                        </Button>
                    )}
                </div>
            )}

            {visible.length === 0 ? (
                <p className={"projectEmptyText"}>
                    {projects.length === 0
                        ? "No projects yet. Create your first one above."
                        : "No projects match your filters."}
                </p>
            ) : (
                <ul className={"projectGrid"}>
                    {visible.map((p) => (
                        <li className={"projectItem"} key={p.id}>
                            <Card $dim={p.done} $hoverable>
                                <CardHeader>
                                    <CardTitle>
                                        <Link className={"projectTitleLink"} href={`/projects/${p.id}`}>
                                            {p.title}
                                        </Link>
                                        {p.done && <Badge variant="secondary">Done</Badge>}
                                    </CardTitle>
                                    <CardDescription>{p.description}</CardDescription>
                                    <CardAction>
                                        <ProjectSettings project={p} allTags={allTags} />
                                    </CardAction>
                                </CardHeader>
                                <CardContent style={{ marginTop: "auto" }}>
                                    {p.tags.length > 0 && (
                                        <div className={"projectTags"}>
                                            {p.tags.map((t) => (
                                                <Badge key={t} variant="outline">
                                                    #{t}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    <StatusBar counts={p.counts} />
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
