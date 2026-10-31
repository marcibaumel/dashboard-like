"use client";

import styled from "styled-components";
import { STATUSES, STATUS_BAR_COLORS, STATUS_LABELS, type Status } from "@/lib/types";

const Track = styled.div`
    display: flex;
    width: 100%;
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--muted);
`;

const Segment = styled.div<{ $color: string; $percent: number }>`
    width: ${(p) => p.$percent}%;
    background: ${(p) => p.$color};
`;

const Caption = styled.p`
    margin-top: 4px;
    color: var(--muted-foreground);
    font-size: 12px;
`;

export default function StatusBar({ counts }: { counts: Record<Status, number> }) {
    const total = STATUSES.reduce((sum, s) => sum + counts[s], 0);

    return (
        <div>
            <Track>
                {total > 0 &&
                    STATUSES.map((s) =>
                        counts[s] > 0 ? (
                            <Segment
                                key={s}
                                $color={STATUS_BAR_COLORS[s]}
                                $percent={(counts[s] / total) * 100}
                                title={`${STATUS_LABELS[s]}: ${counts[s]}`}
                            />
                        ) : null,
                    )}
            </Track>
            <Caption>{total === 0 ? "No tasks" : `${counts.DONE}/${total} done`}</Caption>
        </div>
    );
}
