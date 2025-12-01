import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function ApiReferencePage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid lg:grid-cols-[250px_1fr] gap-12">
                {/* Sidebar */}
                <div className="hidden lg:block space-y-8 sticky top-24 h-fit">
                    <div>
                        <h3 className="font-semibold mb-3">Getting Started</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="text-primary font-medium">Introduction</li>
                            <li className="hover:text-foreground cursor-pointer">Authentication</li>
                            <li className="hover:text-foreground cursor-pointer">Rate Limits</li>
                            <li className="hover:text-foreground cursor-pointer">Errors</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3">Resources</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="hover:text-foreground cursor-pointer">Workflows</li>
                            <li className="hover:text-foreground cursor-pointer">Executions</li>
                            <li className="hover:text-foreground cursor-pointer">Users</li>
                            <li className="hover:text-foreground cursor-pointer">Webhooks</li>
                        </ul>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-12">
                    <div>
                        <h1 className="text-4xl font-bold mb-4">API Reference</h1>
                        <p className="text-xl text-muted-foreground">
                            Welcome to the EduFlow API documentation. You can use our API to access EduFlow API endpoints, which can get information on various data, objects, and services.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Authentication</h2>
                        <p className="text-muted-foreground">
                            The EduFlow API uses API keys to authenticate requests. You can view and manage your API keys in the Dashboard.
                        </p>
                        <div className="bg-muted/50 p-4 rounded-lg border border-border font-mono text-sm overflow-x-auto">
                            Authorization: Bearer YOUR_API_KEY
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Endpoints</h2>

                        <div className="space-y-4">
                            <div className="border border-border rounded-lg overflow-hidden">
                                <div className="bg-muted/30 p-4 flex items-center gap-3 border-b border-border">
                                    <span className="bg-green-500/10 text-green-600 px-2 py-1 rounded text-xs font-bold">GET</span>
                                    <code className="text-sm">/v1/workflows</code>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-muted-foreground mb-4">List all workflows for the authenticated user.</p>
                                    <Button variant="outline" size="sm">
                                        View Details <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>

                            <div className="border border-border rounded-lg overflow-hidden">
                                <div className="bg-muted/30 p-4 flex items-center gap-3 border-b border-border">
                                    <span className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded text-xs font-bold">POST</span>
                                    <code className="text-sm">/v1/workflows</code>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-muted-foreground mb-4">Create a new workflow.</p>
                                    <Button variant="outline" size="sm">
                                        View Details <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
