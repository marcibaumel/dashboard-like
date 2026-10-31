"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import styled from "styled-components";
import { Button } from "@/components/ui/button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

const Overlay = styled(DialogPrimitive.Backdrop)`
    position: fixed;
    inset: 0;
    z-index: 50;
    background: var(--overlay);
`;

const Popup = styled(DialogPrimitive.Popup)`
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 50;
    display: grid;
    gap: 16px;
    width: calc(100% - 2rem);
    max-width: 440px;
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
    padding: 16px;
    transform: translate(-50%, -50%);
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--popover);
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.2);
    outline: none;
`;

const CloseSlot = styled.div`
    position: absolute;
    top: 8px;
    right: 8px;
`;

const SrOnly = styled.span`
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
`;

export function DialogContent({
    children,
    showCloseButton = true,
    ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
    return (
        <DialogPrimitive.Portal>
            <Overlay />
            <Popup {...props}>
                {children}
                {showCloseButton && (
                    <CloseSlot>
                        <DialogPrimitive.Close render={<Button variant="ghost" size="icon" />}>
                            <XIcon />
                            <SrOnly>Close</SrOnly>
                        </DialogPrimitive.Close>
                    </CloseSlot>
                )}
            </Popup>
        </DialogPrimitive.Portal>
    );
}

export const DialogHeader = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-right: 32px;
`;

export const DialogTitle = styled(DialogPrimitive.Title)`
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
`;

export const DialogDescription = styled(DialogPrimitive.Description)`
    margin: 0;
    color: var(--muted-foreground);
`;

export const DialogFooter = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
`;
