import { Zap, Users, BookOpen, Bell, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocsPage() {
    return (
        <div className="space-y-12 pb-20">
            {/* Hero Section */}
            <section className="space-y-6 border-b border-border/50 pb-12">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4">
                    <Zap className="w-4 h-4 mr-2" />
                    Documentation
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                    Automate Your Educational Workflows
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
                    Visual workflow automation designed specifically for teachers. Create powerful automations for attendance, assignments, and communications — no coding required.
                </p>
                <div className="flex gap-4 pt-4">
                    <Link href="/dashboard">
                        <Button size="lg">
                            Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Quick Start */}
            <section id="quick-start" className="scroll-mt-32 space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    Quick Start Guide
                </h2>
                <div className="grid gap-6 md:grid-cols-3">
                    {[
                        {
                            step: "01",
                            title: "Create an Account",
                            desc: "Sign up with your school email to get started instantly.",
                        },
                        {
                            step: "02",
                            title: "Choose a Template",
                            desc: "Pick from pre-built workflows for attendance or grading.",
                        },
                        {
                            step: "03",
                            title: "Connect & Run",
                            desc: "Link your Google Classroom and let the automation run.",
                        },
                    ].map((item, i) => (
                        <div key={i} className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                            <div className="text-4xl font-bold text-primary/20 mb-4">{item.step}</div>
                            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                            <p className="text-muted-foreground text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Attendance Section */}
            <section id="attendance" className="scroll-mt-32 space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-green-500" />
                    Attendance Automation
                </h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p>
                        Forget manual data entry. With EduFlow, you can automatically sync attendance data from your classroom tools directly to your reports.
                    </p>
                    <ul className="grid gap-4 md:grid-cols-2 not-prose mt-6">
                        <li className="flex gap-3 p-4 rounded-lg bg-muted/30">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            <span>Auto-mark students present when they log in</span>
                        </li>
                        <li className="flex gap-3 p-4 rounded-lg bg-muted/30">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            <span>Send SMS alerts to parents for unexcused absences</span>
                        </li>
                        <li className="flex gap-3 p-4 rounded-lg bg-muted/30">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            <span>Generate weekly attendance reports automatically</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Assignments Section */}
            <section id="assignments" className="scroll-mt-32 space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-blue-500" />
                    Assignment Management
                </h2>
                <div className="p-6 rounded-xl border border-border bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                    <h3 className="text-lg font-semibold mb-4">How it works</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500 font-bold">1</div>
                            <div>
                                <h4 className="font-medium">Submission Tracking</h4>
                                <p className="text-sm text-muted-foreground">EduFlow monitors your LMS for new submissions.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500 font-bold">2</div>
                            <div>
                                <h4 className="font-medium">AI Grading Assistant</h4>
                                <p className="text-sm text-muted-foreground">Our AI analyzes the work and suggests a grade and feedback.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500 font-bold">3</div>
                            <div>
                                <h4 className="font-medium">Gradebook Sync</h4>
                                <p className="text-sm text-muted-foreground">Approved grades are automatically pushed to your gradebook.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Communications Section */}
            <section id="communications" className="scroll-mt-32 space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="w-6 h-6 text-orange-500" />
                    Smart Communications
                </h2>
                <p className="text-muted-foreground">
                    Keep everyone in the loop without spending hours on email. Set up triggers to send personalized messages based on student performance or behavior.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                        <h3 className="font-semibold mb-2">For Parents</h3>
                        <p className="text-sm text-muted-foreground">"Your child missed 2 assignments this week. Please check the portal."</p>
                    </div>
                    <div className="p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                        <h3 className="font-semibold mb-2">For Students</h3>
                        <p className="text-sm text-muted-foreground">"Great job on the math quiz! Keep up the good work."</p>
                    </div>
                </div>
            </section>

            {/* Scheduling Section */}
            <section id="scheduling" className="scroll-mt-32 space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="w-6 h-6 text-purple-500" />
                    Schedule Automation
                </h2>
                <p className="text-muted-foreground">
                    Never miss a deadline or meeting. Sync your calendar with your workflow to automatically schedule parent-teacher conferences or study sessions.
                </p>
            </section>

            {/* Notifications Section */}
            <section id="notifications" className="scroll-mt-32 space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="w-6 h-6 text-red-500" />
                    Smart Notifications
                </h2>
                <p className="text-muted-foreground">
                    Get alerted instantly via SMS, Email, or App Notification when critical events happen, like a student failing a major exam or a sudden drop in attendance.
                </p>
            </section>
        </div>
    );
}
