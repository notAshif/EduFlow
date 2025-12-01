import { Badge } from "@/components/ui/badge";

export default function ChangelogPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold mb-12 text-center">Changelog</h1>

            <div className="space-y-12 relative border-l border-border ml-4 md:ml-0 pl-8 md:pl-0">
                {[
                    {
                        version: "v1.2.0",
                        date: "November 28, 2025",
                        title: "AI Grading Assistant & Dark Mode",
                        changes: [
                            "Introduced AI Grading Assistant for automatic feedback generation.",
                            "Added full Dark Mode support across the entire platform.",
                            "Improved workflow editor performance by 40%.",
                            "Fixed issue with Google Classroom sync delays."
                        ],
                        type: "Major"
                    },
                    {
                        version: "v1.1.5",
                        date: "November 15, 2025",
                        title: "Canvas LMS Integration",
                        changes: [
                            "New native integration for Canvas LMS.",
                            "Added 'Delay' node for timed workflows.",
                            "Updated dashboard analytics widgets."
                        ],
                        type: "Feature"
                    },
                    {
                        version: "v1.1.0",
                        date: "November 1, 2025",
                        title: "Public Beta Release",
                        changes: [
                            "Initial public release of EduFlow.",
                            "Core workflow builder with 20+ nodes.",
                            "User authentication and team management."
                        ],
                        type: "Major"
                    }
                ].map((release, i) => (
                    <div key={i} className="relative md:grid md:grid-cols-[150px_1fr] gap-8">
                        <div className="hidden md:block text-right pt-1">
                            <div className="text-sm font-medium text-muted-foreground">{release.date}</div>
                            <div className="text-xs text-muted-foreground/60">{release.version}</div>
                        </div>

                        {/* Timeline Dot */}
                        <div className="absolute -left-[37px] md:-left-[5px] top-2 w-3 h-3 rounded-full bg-primary border border-background ring-4 ring-background" />

                        <div className="space-y-4">
                            <div className="md:hidden flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <span>{release.date}</span>
                                <span>•</span>
                                <span>{release.version}</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold">{release.title}</h2>
                                <Badge variant={release.type === "Major" ? "default" : "secondary"}>{release.type}</Badge>
                            </div>

                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                {release.changes.map((change, j) => (
                                    <li key={j}>{change}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
