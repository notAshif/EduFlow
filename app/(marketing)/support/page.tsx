import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Book, MessageCircle, FileText } from "lucide-react";

export default function SupportPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">How can we help?</h1>
                <div className="max-w-xl mx-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search for articles..." className="pl-10 h-12 text-lg" />
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer">
                    <Book className="w-8 h-8 text-blue-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Knowledge Base</h3>
                    <p className="text-muted-foreground mb-4">Browse tutorials, guides, and FAQs.</p>
                    <Button variant="link" className="p-0">Browse Articles &rarr;</Button>
                </div>

                <div className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer">
                    <MessageCircle className="w-8 h-8 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
                    <p className="text-muted-foreground mb-4">Chat with our support team in real-time.</p>
                    <Button variant="link" className="p-0">Start Chat &rarr;</Button>
                </div>

                <div className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer">
                    <FileText className="w-8 h-8 text-purple-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Submit a Ticket</h3>
                    <p className="text-muted-foreground mb-4">For complex issues that require investigation.</p>
                    <Button variant="link" className="p-0">Open Ticket &rarr;</Button>
                </div>
            </div>

            <div className="space-y-8">
                <h2 className="text-2xl font-bold">Popular Articles</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {[
                        "How to connect Google Classroom",
                        "Troubleshooting email notifications",
                        "Understanding workflow credits",
                        "Inviting team members",
                        "Exporting grades to CSV",
                        "Setting up two-factor authentication"
                    ].map((article, i) => (
                        <div key={i} className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors cursor-pointer flex justify-between items-center group">
                            <span>{article}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

import { ChevronRight } from "lucide-react";
