import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function PressKitPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Press Kit</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Assets, logos, and guidelines for using the EduFlow brand.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-20">
                <div>
                    <h2 className="text-2xl font-bold mb-6">Logos</h2>
                    <div className="space-y-6">
                        <div className="p-8 border border-border rounded-xl bg-white flex items-center justify-center">
                            <div className="text-2xl font-bold text-black flex items-center gap-2">
                                <span className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">⚡</span>
                                EduFlow
                            </div>
                        </div>
                        <div className="p-8 border border-border rounded-xl bg-black flex items-center justify-center">
                            <div className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">⚡</span>
                                EduFlow
                            </div>
                        </div>
                        <Button variant="outline" className="w-full">
                            <Download className="w-4 h-4 mr-2" />
                            Download All Logos
                        </Button>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-6">Brand Colors</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="h-24 rounded-xl bg-blue-600 shadow-sm" />
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Primary Blue</span>
                                <span className="text-muted-foreground">#2563EB</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-24 rounded-xl bg-slate-900 shadow-sm" />
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Dark Slate</span>
                                <span className="text-muted-foreground">#0F172A</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-24 rounded-xl bg-slate-50 border border-border shadow-sm" />
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Light Gray</span>
                                <span className="text-muted-foreground">#F8FAFC</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-24 rounded-xl bg-purple-600 shadow-sm" />
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Accent Purple</span>
                                <span className="text-muted-foreground">#9333EA</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">About EduFlow</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p>
                        EduFlow is a visual workflow automation platform designed specifically for educational institutions. Founded in 2024, our mission is to help teachers reclaim their time by automating administrative tasks.
                    </p>
                    <p>
                        For press inquiries, please contact <a href="mailto:press@eduflow.com" className="text-primary">press@eduflow.com</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
