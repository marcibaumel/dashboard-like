"use client";

import styled from "styled-components";

export const Card = styled.div<{ $size?: "sm"; $dim?: boolean; $hoverable?: boolean }>`
    --card-spacing: ${(p) => (p.$size === "sm" ? "12px" : "16px")};
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--card-spacing);
    padding-block: var(--card-spacing);
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--card);
    opacity: ${(p) => (p.$dim ? 0.7 : 1)};

    ${(p) =>
        p.$hoverable &&
        `
    &:hover {
      border-color: var(--ring);
    }
  `}
`;

export const CardHeader = styled.div`
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: 4px 8px;
    padding-inline: var(--card-spacing);
`;

export const CardTitle = styled.div`
    grid-column: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
`;

export const CardDescription = styled.div`
    grid-column: 1;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: var(--muted-foreground);
`;

export const CardAction = styled.div`
    grid-column: 2;
    grid-row: 1 / span 2;
    justify-self: end;
`;

export const CardContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-inline: var(--card-spacing);
`;
