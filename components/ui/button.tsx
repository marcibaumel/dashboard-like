"use client";

import styled, { css } from "styled-components";

type Variant = "default" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "icon";

const variants: Record<Variant, ReturnType<typeof css>> = {
    default: css`
        background: var(--primary);
        color: var(--primary-foreground);
        &:hover:not(:disabled) {
            opacity: 0.85;
        }
    `,
    outline: css`
        border-color: var(--border);
        background: transparent;
        &:hover:not(:disabled) {
            background: var(--muted);
        }
    `,
    ghost: css`
        background: transparent;
        &:hover:not(:disabled) {
            background: var(--muted);
        }
    `,
    destructive: css`
        background: color-mix(in srgb, var(--destructive) 12%, transparent);
        color: var(--destructive);
        &:hover:not(:disabled) {
            background: color-mix(in srgb, var(--destructive) 22%, transparent);
        }
    `,
};

const sizes: Record<Size, ReturnType<typeof css>> = {
    default: css`
        height: 32px;
        padding: 0 10px;
    `,
    sm: css`
        height: 28px;
        padding: 0 10px;
        font-size: 13px;
    `,
    icon: css`
        width: 32px;
        height: 32px;
        padding: 0;
    `,
};

const StyledButton = styled.button<{ $variant: Variant; $size: Size }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid transparent;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    outline: none;

    &:focus-visible {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent);
    }
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }

    ${(p) => variants[p.$variant]}
    ${(p) => sizes[p.$size]}
`;

export function Button({
    variant = "default",
    size = "default",
    ...props
}: React.ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
    return <StyledButton $variant={variant} $size={size} {...props} />;
}
