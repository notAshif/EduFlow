import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PricingPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Choose the plan that fits your needs. No hidden fees.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
                {[
                    {
                        name: "Free",
                        price: "$0",
                        desc: "Perfect for individual teachers getting started.",
                        features: ["5 Active Workflows", "100 Executions/month", "Email Support", "Basic Integrations"],
                        cta: "Start Free",
                        popular: false,
                    },
                    {
                        name: "Pro",
                        price: "$12",
                        desc: "For power users who need more automation.",
                        features: ["Unlimited Workflows", "5,000 Executions/month", "Priority Support", "Advanced Integrations", "AI Grading Assistant"],
                        cta: "Get Pro",
                        popular: true,
                    },
                    {
                        name: "School",
                        price: "Custom",
                        desc: "For schools and districts needing control.",
                        features: ["Unlimited Everything", "SSO & Admin Panel", "Dedicated Account Manager", "Custom Training", "SLA"],
                        cta: "Contact Sales",
                        popular: false,
                    },
                ].map((plan, i) => (
                    <div key={i} className={`relative p-8 rounded-2xl border ${plan.popular ? 'border-primary shadow-xl bg-card' : 'border-border bg-card/50'} flex flex-col`}>
                        {plan.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                Most Popular
                            </div>
                        )}
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                            </div>
                            <p className="text-muted-foreground text-sm">{plan.desc}</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature, j) => (
                                <li key={j} className="flex items-center gap-3 text-sm">
                                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <Link href={plan.name === "School" ? "/contact" : "/sign-up"} className="w-full">
                            <Button variant={plan.popular ? "default" : "outline"} className="w-full">
                                {plan.cta}
                            </Button>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
