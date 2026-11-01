import type { Metadata } from "next";
import "./index.css";
import "@/components/index.css";
import "@/components/ui/index.css";

export const metadata: Metadata = {
    title: "Kanban Board",
    description: "Simple Trello-like Kanban board",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
