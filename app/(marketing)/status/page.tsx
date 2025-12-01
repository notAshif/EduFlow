import { CheckCircle2, AlertCircle } from "lucide-react";

export default function StatusPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-12 p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">All Systems Operational</h1>
                        <p className="text-green-600/80 dark:text-green-400/80">Last updated: Just now</p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Current Status</h2>
                    <div className="border border-border rounded-xl overflow-hidden">
                        {[
                            "API",
                            "Dashboard",
                            "Workflow Engine",
                            "Database",
                            "Third-party Integrations"
                        ].map((service, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border-b border-border last:border-0 bg-card">
                                <span className="font-medium">{service}</span>
                                <div className="flex items-center gap-2 text-sm text-green-500">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Operational
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Past Incidents</h2>
                    <div className="space-y-6">
                        {[
                            { date: "Nov 15, 2025", title: "API Latency", status: "Resolved", desc: "We experienced elevated latency in the US-East region. The issue has been resolved." },
                            { date: "Oct 28, 2025", title: "Scheduled Maintenance", status: "Completed", desc: "Database upgrade completed successfully." }
                        ].map((incident, i) => (
                            <div key={i} className="border-l-2 border-border pl-4 py-1">
                                <div className="text-sm text-muted-foreground mb-1">{incident.date}</div>
                                <h3 className="font-medium mb-1">{incident.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{incident.desc}</p>
                                <span className="text-xs font-medium bg-muted px-2 py-1 rounded">{incident.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
