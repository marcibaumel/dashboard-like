"use client";

type Variant = "default" | "secondary" | "outline";

const variants: Record<Variant, string> = {
    default: "badgeDefault",
    secondary: "badgeSecondary",
    outline: "badgeOutline",
};

/** `color` tints the badge (used for labels); otherwise `variant` applies. */
export function Badge({
    variant = "default",
    color,
    className,
    style,
    ...props
}: React.ComponentProps<"span"> & { variant?: Variant; color?: string }) {
    const colorStyle = color ? ({ ...style, "--badge-color": color } as React.CSSProperties) : style;
    return (
        <span
            className={["badge", variants[variant], color && "badgeTint", className].filter(Boolean).join(" ")}
            style={colorStyle}
            {...props}
        />
    );
}
