"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
    children,
    showCloseButton = true,
    wide = false,
    className,
    ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean; wide?: boolean }) {
    return (
        <DialogPrimitive.Portal>
            <DialogPrimitive.Backdrop className={"dialogOverlay"} />
            <DialogPrimitive.Popup
                className={["dialogPopup", wide && "dialogWide", className].filter(Boolean).join(" ")}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <div className={"dialogCloseSlot"}>
                        <DialogPrimitive.Close render={<Button variant="ghost" size="icon" />}>
                            <XIcon />
                            <span className={"screenReaderOnly"}>Close</span>
                        </DialogPrimitive.Close>
                    </div>
                )}
            </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
    );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={["dialogHeader", className].filter(Boolean).join(" ")} {...props} />;
}

export function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
    return <DialogPrimitive.Title className={["dialogTitle", className].filter(Boolean).join(" ")} {...props} />;
}

export function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
    return (
        <DialogPrimitive.Description
            className={["dialogDescription", className].filter(Boolean).join(" ")}
            {...props}
        />
    );
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={["dialogFooter", className].filter(Boolean).join(" ")} {...props} />;
}
