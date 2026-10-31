"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import styled from "styled-components";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

const Trigger = styled(SelectPrimitive.Trigger)`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    width: 100%;
    height: 32px;
    padding: 0 8px 0 10px;
    border: 1px solid var(--input);
    border-radius: 8px;
    background: transparent;
    font-size: 14px;
    text-align: left;
    outline: none;

    &:focus-visible {
        border-color: var(--ring);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent);
    }
    svg {
        width: 16px;
        height: 16px;
        color: var(--muted-foreground);
        pointer-events: none;
    }
`;

export function SelectTrigger({ children, ...props }: SelectPrimitive.Trigger.Props) {
    return (
        <Trigger {...props}>
            {children}
            <SelectPrimitive.Icon render={<ChevronDownIcon />} />
        </Trigger>
    );
}

const Positioner = styled(SelectPrimitive.Positioner)`
    /* Above the dialog (z-index 50) the select is opened from. */
    z-index: 60;
`;

const Popup = styled(SelectPrimitive.Popup)`
    min-width: var(--anchor-width);
    max-height: var(--available-height);
    overflow-y: auto;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--popover);
    box-shadow: 0 6px 20px rgb(0 0 0 / 0.15);
`;

export function SelectContent({ children, ...props }: SelectPrimitive.Popup.Props) {
    return (
        <SelectPrimitive.Portal>
            <Positioner sideOffset={4} alignItemWithTrigger={false}>
                <Popup {...props}>
                    <SelectPrimitive.List>{children}</SelectPrimitive.List>
                </Popup>
            </Positioner>
        </SelectPrimitive.Portal>
    );
}

const Item = styled(SelectPrimitive.Item)`
    position: relative;
    display: flex;
    align-items: center;
    padding: 6px 28px 6px 8px;
    border-radius: 6px;
    cursor: default;
    user-select: none;
    outline: none;

    &[data-highlighted],
    &:focus {
        background: var(--accent);
    }
`;

const Indicator = styled.span`
    position: absolute;
    right: 8px;
    display: flex;
    svg {
        width: 16px;
        height: 16px;
    }
`;

export function SelectItem({ children, ...props }: SelectPrimitive.Item.Props) {
    return (
        <Item {...props}>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator render={<Indicator />}>
                <CheckIcon />
            </SelectPrimitive.ItemIndicator>
        </Item>
    );
}
