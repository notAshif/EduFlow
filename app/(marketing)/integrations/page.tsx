import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function IntegrationsPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Connect Your Favorite Tools</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                    EduFlow integrates with the tools you already use, making automation seamless.
                </p>
                <div className="max-w-md mx-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search integrations..." className="pl-10" />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-20">
                {[
                    "Google Classroom", "Canvas LMS", "Schoology", "Moodle",
                    "Gmail", "Outlook", "Slack", "Discord",
                    "Zoom", "Google Meet", "Notion", "Airtable",
                    "Google Sheets", "Excel", "Twilio", "SendGrid"
                ].map((tool, i) => (
                    <div key={i} className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors flex flex-col items-center text-center gap-4 group cursor-pointer">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {tool[0]}
                        </div>
                        <h3 className="font-semibold">{tool}</h3>
                    </div>
                ))}
            </div>

            <div className="bg-primary/5 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Don't see your tool?</h2>
                    <p className="text-muted-foreground">Request an integration and we'll prioritize it.</p>
                </div>
                <Link href="/contact">
                    <Button variant="outline">Request Integration</Button>
                </Link>
            </div>
        </div>
    );
}
