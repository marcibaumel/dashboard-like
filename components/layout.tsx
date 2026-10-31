"use client";

import Link from "next/link";
import styled from "styled-components";

export const Main = styled.main<{ $width: number }>`
    width: 100%;
    max-width: ${(p) => p.$width}px;
    margin: 0 auto;
    padding: 24px;
`;

export const PageHeader = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
`;

export const Heading = styled.h1`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.3;
`;

export const Subtitle = styled.p`
    margin-top: 4px;
    color: var(--muted-foreground);
`;

export const BackLink = styled(Link)`
    display: inline-block;
    margin-bottom: 8px;
    color: var(--link);
    font-size: 14px;

    &:hover {
        text-decoration: underline;
    }
`;
