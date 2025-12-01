import { Zap, Users, BookOpen, Bell, Shield, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FeaturesPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Powerful Features for Modern Educators</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Everything you need to automate your classroom and focus on what matters most: teaching.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {[
                    {
                        icon: Zap,
                        title: "Visual Workflow Builder",
                        desc: "Drag-and-drop interface to create complex automations without writing a single line of code.",
                    },
                    {
                        icon: Users,
                        title: "Student Management",
                        desc: "Keep track of attendance, behavior, and participation with automated logs and reports.",
                    },
                    {
                        icon: BookOpen,
                        title: "Assignment Tracking",
                        desc: "Automatically sync grades between your LMS and gradebook. Never miss a submission.",
                    },
                    {
                        icon: Bell,
                        title: "Smart Notifications",
                        desc: "Send personalized updates to parents and students via Email, SMS, or WhatsApp.",
                    },
                    {
                        icon: Shield,
                        title: "Secure & Compliant",
                        desc: "Enterprise-grade security ensuring your student data is safe and FERPA compliant.",
                    },
                    {
                        icon: BarChart,
                        title: "Analytics Dashboard",
                        desc: "Gain insights into student performance with real-time charts and data visualization.",
                    },
                ].map((feature, i) => (
                    <div key={i} className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                            <feature.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.desc}</p>
                    </div>
                ))}
            </div>

            <div className="bg-muted/30 rounded-2xl p-8 md:p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to transform your classroom?</h2>
                <p className="text-lg text-muted-foreground mb-8">Join thousands of teachers saving hours every week with EduFlow.</p>
                <Link href="/sign-up">
                    <Button size="lg" className="text-lg px-8">Get Started for Free</Button>
                </Link>
            </div>
        </div>
    );
}
