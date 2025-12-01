import * as React from "react";
import Link from "next/link";
import { Zap, Users, BookOpen, Bell, Mail, Calendar, BarChart, Shield } from "lucide-react";
import { CoconutCard, CoconutCardContent, CoconutBadge } from "./coconut-stub";

const bentoFeatures = [
    {
        icon: <Zap className="w-6 h-6" />,
        title: "Lightning Fast Automation",
        description: "Create workflows in minutes, not hours",
        label: "krna dena",
        size: "large" as const,
        gradient: "from-blue-500/10 to-purple-500/10",
        href: "/docs#quick-start",
    },
    {
        icon: <Users className="w-5 h-5" />,
        title: "Student Management",
        description: "Track attendance and engagement effortlessly",
        size: "medium" as const,
        gradient: "from-green-500/10 to-emerald-500/10",
        href: "/docs#attendance",
    },
    {
        icon: <BookOpen className="w-5 h-5" />,
        title: "Assignment Tracking",
        description: "Automated grading and feedback",
        size: "medium" as const,
        gradient: "from-orange-500/10 to-red-500/10",
        href: "/docs#assignments",
    },
    {
        icon: <Bell className="w-5 h-5" />,
        title: "Smart Notifications",
        description: "Multi-channel alerts for parents and students",
        label: "krna dena",
        size: "small" as const,
        gradient: "from-pink-500/10 to-rose-500/10",
        href: "/docs#notifications",
    },
    {
        icon: <Mail className="w-5 h-5" />,
        title: "Email Integration",
        description: "Seamless communication workflows",
        size: "small" as const,
        gradient: "from-indigo-500/10 to-blue-500/10",
        href: "/docs#communications",
    },
    {
        icon: <Calendar className="w-5 h-5" />,
        title: "Schedule Automation",
        description: "Never miss a deadline or meeting",
        size: "medium" as const,
        gradient: "from-violet-500/10 to-purple-500/10",
        href: "/docs#scheduling",
    },
    {
        icon: <BarChart className="w-5 h-5" />,
        title: "Analytics Dashboard",
        description: "Real-time insights into classroom performance",
        size: "small" as const,
        gradient: "from-cyan-500/10 to-teal-500/10",
        href: "/docs",
    },
    {
        icon: <Shield className="w-5 h-5" />,
        title: "Secure & Compliant",
        description: "FERPA compliant with enterprise-grade security",
        size: "small" as const,
        gradient: "from-amber-500/10 to-yellow-500/10",
        href: "/docs",
    },
];

export function FeatureBentoGrid() {
    return (
        <section className="py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Everything You Need in One Place
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Powerful features designed to simplify your teaching workflow
                    </p>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-fr">
                    {bentoFeatures.map((feature, idx) => {
                        const sizeClasses = {
                            large: "md:col-span-2 lg:col-span-3 md:row-span-2",
                            medium: "md:col-span-2 lg:col-span-2",
                            small: "md:col-span-2 lg:col-span-1",
                        };

                        return (
                            <Link
                                key={idx}
                                href={feature.href}
                                className={`${sizeClasses[feature.size]} block group`}
                            >
                                <CoconutCard
                                    className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                                    <CoconutCardContent className={`relative z-10 h-full flex flex-col ${feature.size === "large" ? "p-8" : "p-6"}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`rounded-xl bg-primary/10 text-primary p-3 group-hover:scale-110 transition-transform duration-300 ${feature.size === "large" ? "p-4" : ""}`}>
                                                {feature.icon}
                                            </div>
                                            {feature.label && (
                                                <CoconutBadge variant="warning" className="text-xs">
                                                    {feature.label}
                                                </CoconutBadge>
                                            )}
                                        </div>

                                        <h3 className={`font-semibold text-foreground mb-2 ${feature.size === "large" ? "text-2xl" : "text-lg"}`}>
                                            {feature.title}
                                        </h3>

                                        <p className={`text-muted-foreground flex-1 ${feature.size === "large" ? "text-base" : "text-sm"}`}>
                                            {feature.description}
                                        </p>

                                        {feature.size === "large" && (
                                            <div className="mt-6 flex items-center gap-2 text-sm text-primary font-medium group-hover:gap-3 transition-all">
                                                Learn more
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </CoconutCardContent>
                                </CoconutCard>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
