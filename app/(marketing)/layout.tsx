import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24">
                {children}
            </main>
            <Footer />
        </div>
    );
}
