"use client";

type CardProps = React.ComponentProps<"div"> & { $size?: "sm"; $dim?: boolean; $hoverable?: boolean };

export function Card({ $size, $dim, $hoverable, className, ...props }: CardProps) {
    return (
        <div
            className={[
                "card",
                $size === "sm" && "cardSmall",
                $dim && "cardDim",
                $hoverable && "cardHoverable",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            {...props}
        />
    );
}

function CardPart({ baseClass, className, ...props }: React.ComponentProps<"div"> & { baseClass: string }) {
    return <div className={[baseClass, className].filter(Boolean).join(" ")} {...props} />;
}

export const CardHeader = (props: React.ComponentProps<"div">) => <CardPart baseClass={"cardHeader"} {...props} />;
export const CardTitle = (props: React.ComponentProps<"div">) => <CardPart baseClass={"cardTitle"} {...props} />;
export const CardDescription = (props: React.ComponentProps<"div">) => (
    <CardPart baseClass={"cardDescription"} {...props} />
);
export const CardAction = (props: React.ComponentProps<"div">) => <CardPart baseClass={"cardAction"} {...props} />;
export const CardContent = (props: React.ComponentProps<"div">) => <CardPart baseClass={"cardContent"} {...props} />;
