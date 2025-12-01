import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CareersPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Join Our Mission</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Help us build the future of education technology.
                </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold mb-6">Open Positions</h2>

                {[
                    { title: "Senior Full Stack Engineer", dept: "Engineering", loc: "Remote", type: "Full-time" },
                    { title: "Product Designer", dept: "Design", loc: "New York, NY", type: "Full-time" },
                    { title: "Customer Success Manager", dept: "Sales", loc: "Remote", type: "Full-time" },
                    { title: "Developer Advocate", dept: "Marketing", loc: "San Francisco, CA", type: "Full-time" }
                ].map((job, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-all group cursor-pointer">
                        <div>
                            <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{job.title}</h3>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>{job.dept}</span>
                                <span>•</span>
                                <span>{job.loc}</span>
                                <span>•</span>
                                <span>{job.type}</span>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                ))}

                <div className="mt-12 p-8 bg-muted/30 rounded-xl text-center">
                    <h3 className="text-xl font-semibold mb-2">Don't see the right role?</h3>
                    <p className="text-muted-foreground mb-6">We're always looking for talented people. Send us your resume.</p>
                    <Button variant="outline">Email Careers</Button>
                </div>
            </div>
        </div>
    );
}
