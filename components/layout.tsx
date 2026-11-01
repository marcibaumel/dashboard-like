import Link from "next/link";
import type { ComponentProps } from "react";

function combineClasses(base: string, extra?: string) {
    return [base, extra].filter(Boolean).join(" ");
}

export function Main({ $width, className, style, ...props }: ComponentProps<"main"> & { $width: number }) {
    return (
        <main className={combineClasses("mainWindow", className)} style={{ ...style, maxWidth: $width }} {...props} />
    );
}

export function PageHeader({ className, ...props }: ComponentProps<"div">) {
    return <div className={combineClasses("pageHeader", className)} {...props} />;
}

export function Heading({ className, ...props }: ComponentProps<"h1">) {
    return <h1 className={combineClasses("heading", className)} {...props} />;
}

export function Subtitle({ className, ...props }: ComponentProps<"p">) {
    return <p className={combineClasses("subtitle", className)} {...props} />;
}

export function BackLink({ className, ...props }: ComponentProps<typeof Link>) {
    return <Link className={combineClasses("backLink", className)} {...props} />;
}
