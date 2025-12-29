import Link from "next/link";
import {
  ArrowRight,
  Play,
  Zap,
  Users,
  BookOpen,
  Bell,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { TextEffect } from "@/app/components/TextEffect";
import { PricingSection } from "@/app/components/PricingSection";
import { FeatureBentoGrid } from "@/app/components/FeatureBentoGrid";
import { InteractiveDemo } from "@/app/components/InteractiveDemo";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none z-[-1]">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
          </div>

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-8 backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              New: AI Grading Assistant
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
              Automate Your <br className="hidden sm:block" />
              <span className="text-primary inline-block min-w-[200px]">
                <TextEffect text="Educational" speed={150} />
              </span>{" "}
              Workflows
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              Visual workflow automation designed specifically for teachers.
              Create powerful automations for attendance, assignments, and
              communications — no coding required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <SignedOut>
                <Link href="/sign-up">
                  <Button size="lg" className="text-lg px-8 py-6 h-auto shadow-lg hover:shadow-primary/20 transition-all rounded-xl">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-6 h-auto shadow-lg hover:shadow-primary/20 transition-all rounded-xl">
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </SignedIn>

              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto rounded-xl border-2 hover:bg-muted/50">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Hero Image / Preview */}
            <div className="mt-16 relative mx-auto max-w-5xl h-[500px]">
              <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden h-full">
                <InteractiveDemo />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Everything You Need to Automate Your Classroom
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed by educators, for educators.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <FeatureCard
                icon={<Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                title="Visual Workflow Builder"
                description="Drag-and-drop interface makes creating complex automations as easy as connecting blocks."
                color="bg-blue-100 dark:bg-blue-900/20"
              />
              <FeatureCard
                icon={<Users className="w-5 h-5 text-green-600 dark:text-green-400" />}
                title="Attendance Automation"
                description="Automatically notify parents and staff when students are marked absent."
                color="bg-green-100 dark:bg-green-900/20"
              />
              <FeatureCard
                icon={<BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                title="Assignment Management"
                description="Send reminders, collect submissions, and provide feedback automatically."
                color="bg-purple-100 dark:bg-purple-900/20"
              />
              <FeatureCard
                icon={<Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                title="Smart Notifications"
                description="Reach students and parents through SMS, email, Slack, and Discord."
                color="bg-orange-100 dark:bg-orange-900/20"
              />
              <FeatureCard
                icon={<Zap className="w-5 h-5 text-red-600 dark:text-red-400" />}
                title="AI-Powered Insights"
                description="Get intelligent summaries and feedback on student submissions."
                color="bg-red-100 dark:bg-red-900/20"
              />
              <FeatureCard
                icon={<Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                title="Multi-Platform Integration"
                description="Connect with all your favorite educational tools and communication platforms."
                color="bg-indigo-100 dark:bg-indigo-900/20"
              />
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <FeatureBentoGrid />

        {/* Pricing Section */}
        <PricingSection />
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm group">
      <CardContent className="p-6">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2 text-card-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
