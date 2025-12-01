import Image from "next/image";

export default function AboutPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Empowering Educators Everywhere</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    We're on a mission to give teachers their time back through intelligent automation.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                <div>
                    <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                    <div className="space-y-4 text-lg text-muted-foreground">
                        <p>
                            EduFlow started in 2024 when a group of former teachers and engineers realized that educators were spending more time on administrative tasks than on teaching.
                        </p>
                        <p>
                            We saw brilliant teachers burning out from grading, attendance tracking, and endless email chains. We knew there had to be a better way.
                        </p>
                        <p>
                            Today, EduFlow helps thousands of schools automate their workflows, saving an average of 10 hours per teacher per week.
                        </p>
                    </div>
                </div>
                <div className="relative h-[400px] bg-muted rounded-2xl overflow-hidden flex items-center justify-center">
                    <div className="text-muted-foreground">Team Photo Placeholder</div>
                </div>
            </div>

            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-12">Our Values</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: "Teachers First", desc: "Every feature we build starts with the question: 'Does this help teachers?'" },
                        { title: "Simplicity", desc: "Technology should be invisible. If it requires a manual, it's too complex." },
                        { title: "Privacy", desc: "Student data is sacred. We protect it with enterprise-grade security." }
                    ].map((value, i) => (
                        <div key={i} className="p-6 rounded-xl bg-card border border-border">
                            <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                            <p className="text-muted-foreground">{value.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
