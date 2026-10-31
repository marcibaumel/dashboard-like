"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import styled from "styled-components";
import ProjectSettings from "@/components/ProjectSettings";
import StatusBar from "@/components/StatusBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProjectWithCounts } from "@/lib/types";

type StateFilter = "all" | "active" | "done";

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const Controls = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
`;

const SearchBox = styled.div`
    position: relative;
    flex: 1;
    min-width: 224px;

    svg {
        position: absolute;
        top: 50%;
        left: 10px;
        width: 16px;
        height: 16px;
        transform: translateY(-50%);
        color: var(--muted-foreground);
        pointer-events: none;
    }
    input {
        padding-left: 32px;
    }
`;

const StateButtons = styled.div`
    display: flex;
    gap: 4px;
    text-transform: capitalize;
`;

const TagFilter = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
`;

const PlainButton = styled.button`
    padding: 0;
    border: 0;
    background: none;
`;

const Grid = styled.ul`
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;

    @media (min-width: 640px) {
        grid-template-columns: repeat(2, 1fr);
    }
    @media (min-width: 1024px) {
        grid-template-columns: repeat(3, 1fr);
    }
`;

const Item = styled.li`
    display: flex;

    > * {
        flex: 1;
    }
`;

// Stretches over the whole card so the card is clickable.
const TitleLink = styled(Link)`
    &::after {
        content: "";
        position: absolute;
        inset: 0;
    }
`;

const Tags = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
`;

const EmptyText = styled.p`
    margin-top: 16px;
    color: var(--muted-foreground);
`;

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
        <Wrapper>
            <Controls>
                <SearchBox>
                    <SearchIcon />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search projects…"
                        aria-label="Search projects"
                    />
                </SearchBox>
                <StateButtons>
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
                </StateButtons>
            </Controls>

            {usedTags.length > 0 && (
                <TagFilter>
                    {usedTags.map((t) => (
                        <PlainButton
                            key={t}
                            type="button"
                            onClick={() => toggleTag(t)}
                            aria-pressed={selectedTags.includes(t)}
                        >
                            <Badge variant={selectedTags.includes(t) ? "default" : "outline"}>#{t}</Badge>
                        </PlainButton>
                    ))}
                    {selectedTags.length > 0 && (
                        <Button size="sm" variant="ghost" onClick={() => setSelectedTags([])}>
                            Clear
                        </Button>
                    )}
                </TagFilter>
            )}

            {visible.length === 0 ? (
                <EmptyText>
                    {projects.length === 0
                        ? "No projects yet. Create your first one above."
                        : "No projects match your filters."}
                </EmptyText>
            ) : (
                <Grid>
                    {visible.map((p) => (
                        <Item key={p.id}>
                            <Card $dim={p.done} $hoverable>
                                <CardHeader>
                                    <CardTitle>
                                        <TitleLink href={`/projects/${p.id}`}>{p.title}</TitleLink>
                                        {p.done && <Badge variant="secondary">Done</Badge>}
                                    </CardTitle>
                                    <CardDescription>{p.description}</CardDescription>
                                    <CardAction>
                                        <ProjectSettings project={p} allTags={allTags} />
                                    </CardAction>
                                </CardHeader>
                                <CardContent style={{ marginTop: "auto" }}>
                                    {p.tags.length > 0 && (
                                        <Tags>
                                            {p.tags.map((t) => (
                                                <Badge key={t} variant="outline">
                                                    #{t}
                                                </Badge>
                                            ))}
                                        </Tags>
                                    )}
                                    <StatusBar counts={p.counts} />
                                </CardContent>
                            </Card>
                        </Item>
                    ))}
                </Grid>
            )}
        </Wrapper>
    );
}
