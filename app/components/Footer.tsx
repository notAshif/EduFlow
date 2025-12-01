"use client";

import Link from "next/link";
import { useState } from "react";
import { Zap, Github, Twitter, Linkedin, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function Footer() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to subscribe");
            }

            toast({
                title: "Subscribed!",
                description: "You've been added to our newsletter.",
            });
            setEmail("");
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <footer id="contact" className="relative bg-muted/30 border-t border-border mt-20 overflow-hidden">
            {/* Large Background Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                <span className="text-[20vw] font-bold text-foreground/[0.03] whitespace-nowrap">
                    EDUFLOW
                </span>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <Zap className="h-6 w-6" />
                            </div>
                            <span className="text-2xl font-bold text-foreground">EduFlow</span>
                        </div>
                        <p className="text-base text-muted-foreground max-w-sm leading-relaxed">
                            Empowering educators with visual workflow automation. Transform your teaching experience and save hours every week.
                        </p>

                        {/* Newsletter */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-foreground">Stay Updated</h4>
                            <form className="flex gap-2" onSubmit={handleSubscribe}>
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="h-10 bg-background/50 backdrop-blur-sm"
                                    aria-label="Email for newsletter"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                                <Button type="submit" size="sm" className="shrink-0" disabled={isLoading}>
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4 mr-2" />
                                            Subscribe
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">
                            Product
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/integrations" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Integrations
                                </Link>
                            </li>
                            <li>
                                <Link href="/changelog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Changelog
                                </Link>
                            </li>
                            <li>
                                <Link href="/roadmap" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Roadmap
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">
                            Company
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/careers" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="/press" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Press Kit
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase mb-4">
                            Resources
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link href="/api-reference" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    API Reference
                                </Link>
                            </li>
                            <li>
                                <Link href="/community" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Community
                                </Link>
                            </li>
                            <li>
                                <Link href="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Support
                                </Link>
                            </li>
                            <li>
                                <Link href="/status" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Status
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-16 pt-8 border-t border-border/50">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
                            <p>&copy; {new Date().getFullYear()} EduFlow Inc. All rights reserved.</p>
                            <div className="flex items-center gap-4">
                                <Link href="#" className="hover:text-foreground transition-colors">
                                    Privacy
                                </Link>
                                <Link href="#" className="hover:text-foreground transition-colors">
                                    Terms
                                </Link>
                                <Link href="#" className="hover:text-foreground transition-colors">
                                    Cookies
                                </Link>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            <Link
                                href="#"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link
                                href="#"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="GitHub"
                            >
                                <Github className="h-5 w-5" />
                            </Link>
                            <Link
                                href="#"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
