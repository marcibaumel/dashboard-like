"use client";

type Variant = "default" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "icon";

const variants: Record<Variant, string> = {
    default: "buttonDefault",
    outline: "buttonOutline",
    ghost: "buttonGhost",
    destructive: "buttonDestructive",
};

const sizes: Record<Size, string> = {
    default: "buttonSizeDefault",
    sm: "buttonSizeSmall",
    icon: "buttonSizeIcon",
};

export function Button({
    variant = "default",
    size = "default",
    className,
    ...props
}: React.ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
    return (
        <button
            className={["button", variants[variant], sizes[size], className].filter(Boolean).join(" ")}
            {...props}
        />
    );
}
