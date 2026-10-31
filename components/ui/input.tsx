"use client";

import styled, { css } from "styled-components";

export const fieldStyles = css`
    width: 100%;
    min-width: 0;
    padding: 6px 10px;
    border: 1px solid var(--input);
    border-radius: 8px;
    background: transparent;
    font-size: 14px;
    outline: none;

    &::placeholder {
        color: var(--muted-foreground);
    }
    &:focus-visible {
        border-color: var(--ring);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent);
    }
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

export const Input = styled.input`
    ${fieldStyles}
    height: 32px;
`;

export const Textarea = styled.textarea`
    ${fieldStyles}
    min-height: 64px;
    resize: vertical;
`;

export const Label = styled.label`
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
`;

export const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;
