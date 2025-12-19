import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { DocsSidebar } from "./Sidebar";

export const dynamic = 'force-dynamic';

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <div className="flex-1 max-w-7xl mx-auto w-full pt-24 px-4 sm:px-6 lg:px-8 flex gap-8">
                <DocsSidebar />

                <main className="flex-1 py-8 min-w-0">
                    {children}
                </main>
            </div>

            <Footer />
        </div>
    );
}
