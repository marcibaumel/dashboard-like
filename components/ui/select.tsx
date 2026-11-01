"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ children, className, ...props }: SelectPrimitive.Trigger.Props) {
    return (
        <SelectPrimitive.Trigger className={["selectTrigger", className].filter(Boolean).join(" ")} {...props}>
            {children}
            <SelectPrimitive.Icon render={<ChevronDownIcon />} />
        </SelectPrimitive.Trigger>
    );
}

export function SelectContent({ children, className, ...props }: SelectPrimitive.Popup.Props) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner className={"selectPositioner"} sideOffset={4} alignItemWithTrigger={false}>
                <SelectPrimitive.Popup className={["selectPopup", className].filter(Boolean).join(" ")} {...props}>
                    <SelectPrimitive.List>{children}</SelectPrimitive.List>
                </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
    );
}

export function SelectItem({ children, className, ...props }: SelectPrimitive.Item.Props) {
    return (
        <SelectPrimitive.Item className={["selectItem", className].filter(Boolean).join(" ")} {...props}>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator render={<span className={"selectIndicator"} />}>
                <CheckIcon />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    );
}
