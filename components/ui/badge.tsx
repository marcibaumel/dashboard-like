"use client";

import styled, { css } from "styled-components";

type Variant = "default" | "secondary" | "outline";

const variants: Record<Variant, ReturnType<typeof css>> = {
    default: css`
        background: var(--primary);
        color: var(--primary-foreground);
    `,
    secondary: css`
        background: var(--secondary);
        color: var(--foreground);
    `,
    outline: css`
        border-color: var(--border);
    `,
};

const StyledBadge = styled.span<{ $variant: Variant; $color?: string }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    width: fit-content;
    height: 20px;
    padding: 0 8px;
    border: 1px solid transparent;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;

    svg {
        width: 12px;
        height: 12px;
        pointer-events: none;
    }

    ${(p) => variants[p.$variant]}
    ${(p) =>
        p.$color &&
        css`
            background: color-mix(in srgb, ${p.$color} 15%, transparent);
            border-color: color-mix(in srgb, ${p.$color} 40%, transparent);
            color: color-mix(in srgb, ${p.$color} 70%, var(--foreground));
        `}
`;

/** `color` tints the badge (used for labels); otherwise `variant` applies. */
export function Badge({
    variant = "default",
    color,
    ...props
}: React.ComponentProps<"span"> & { variant?: Variant; color?: string }) {
    return <StyledBadge $variant={variant} $color={color} {...props} />;
}
