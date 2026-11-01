"use client";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
    return <input className={["fieldControl", "input", className].filter(Boolean).join(" ")} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return <textarea className={["fieldControl", "textarea", className].filter(Boolean).join(" ")} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
    return <label className={["fieldLabel", className].filter(Boolean).join(" ")} {...props} />;
}

export function Field({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={["field", className].filter(Boolean).join(" ")} {...props} />;
}
