import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoadmapPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Product Roadmap</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    See what we're working on and what's coming next.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* In Progress */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                        <h2 className="text-xl font-semibold">In Progress</h2>
                    </div>

                    {[
                        { title: "Advanced Reporting", tag: "Analytics", desc: "Customizable PDF reports for administrators." },
                        { title: "Mobile App", tag: "Platform", desc: "Native iOS and Android apps for on-the-go management." },
                        { title: "Zapier Integration", tag: "Integration", desc: "Connect with 5000+ apps via Zapier." }
                    ].map((item, i) => (
                        <Card key={i} className="bg-card/50">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-base">{item.title}</CardTitle>
                                    <Badge variant="secondary" className="text-xs">{item.tag}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Planned */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <h2 className="text-xl font-semibold">Planned</h2>
                    </div>

                    {[
                        { title: "Parent Portal", tag: "Feature", desc: "Dedicated dashboard for parents to view student progress." },
                        { title: "Behavior Tracking", tag: "Feature", desc: "Points system and behavior logs for students." },
                        { title: "Microsoft Teams", tag: "Integration", desc: "Deep integration with MS Teams for Education." }
                    ].map((item, i) => (
                        <Card key={i} className="bg-card/50">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-base">{item.title}</CardTitle>
                                    <Badge variant="outline" className="text-xs">{item.tag}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Under Consideration */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-gray-500" />
                        <h2 className="text-xl font-semibold">Consideration</h2>
                    </div>

                    {[
                        { title: "AI Lesson Planner", tag: "AI", desc: "Generate lesson plans based on curriculum standards." },
                        { title: "Peer Review System", tag: "Feature", desc: "Allow students to review each other's work anonymously." }
                    ].map((item, i) => (
                        <Card key={i} className="bg-card/30 opacity-80">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-base">{item.title}</CardTitle>
                                    <Badge variant="outline" className="text-xs">{item.tag}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
