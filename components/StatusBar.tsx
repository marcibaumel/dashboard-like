"use client";

import { STATUSES, STATUS_BAR_COLORS, STATUS_LABELS, type Status } from "@/lib/types";

export default function StatusBar({ counts }: { counts: Record<Status, number> }) {
    const total = STATUSES.reduce((sum, s) => sum + counts[s], 0);

    return (
        <div>
            <div className={"statusTrack"}>
                {total > 0 &&
                    STATUSES.map((s) =>
                        counts[s] > 0 ? (
                            <div
                                className={"statusSegment"}
                                key={s}
                                style={
                                    {
                                        "--segment-color": STATUS_BAR_COLORS[s],
                                        "--segment-percent": `${(counts[s] / total) * 100}%`,
                                    } as React.CSSProperties
                                }
                                title={`${STATUS_LABELS[s]}: ${counts[s]}`}
                            />
                        ) : null,
                    )}
            </div>
            <p className={"statusCaption"}>{total === 0 ? "No tasks" : `${counts.DONE}/${total} done`}</p>
        </div>
    );
}
