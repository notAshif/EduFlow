import { Button } from "@/components/ui/button";
import { MessageSquare, Github, Twitter } from "lucide-react";

export default function CommunityPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Join the Community</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Connect with other educators, share workflows, and get help.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-20">
                <div className="p-8 rounded-2xl border border-border bg-card text-center hover:border-primary/50 transition-colors">
                    <div className="w-16 h-16 bg-[#5865F2]/10 text-[#5865F2] rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Discord Server</h3>
                    <p className="text-muted-foreground mb-6">Chat in real-time with 5,000+ educators and developers.</p>
                    <Button className="w-full bg-[#5865F2] hover:bg-[#5865F2]/90 text-white">Join Discord</Button>
                </div>

                <div className="p-8 rounded-2xl border border-border bg-card text-center hover:border-primary/50 transition-colors">
                    <div className="w-16 h-16 bg-black/5 dark:bg-white/10 text-foreground rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Github className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">GitHub Discussions</h3>
                    <p className="text-muted-foreground mb-6">Report bugs, request features, and contribute to code.</p>
                    <Button variant="outline" className="w-full">View GitHub</Button>
                </div>

                <div className="p-8 rounded-2xl border border-border bg-card text-center hover:border-primary/50 transition-colors">
                    <div className="w-16 h-16 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Twitter className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Twitter Community</h3>
                    <p className="text-muted-foreground mb-6">Follow for updates, tips, and teacher spotlights.</p>
                    <Button variant="outline" className="w-full">Follow @EduFlow</Button>
                </div>
            </div>

            <div className="bg-muted/30 rounded-2xl p-8 md:p-12 text-center">
                <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
                <div className="grid gap-4 max-w-2xl mx-auto text-left">
                    {[
                        { title: "Workflow Wednesday: Attendance Automation", date: "Dec 3, 2025 • 2:00 PM EST" },
                        { title: "Community Town Hall", date: "Dec 10, 2025 • 1:00 PM EST" },
                        { title: "Developer Workshop: Building Custom Nodes", date: "Dec 15, 2025 • 3:00 PM EST" }
                    ].map((event, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                            <span className="font-medium">{event.title}</span>
                            <span className="text-sm text-muted-foreground">{event.date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
