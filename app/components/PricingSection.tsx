"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    CoconutCard,
    CoconutCardHeader,
    CoconutCardTitle,
    CoconutCardContent,
    CoconutBadge,
    CoconutToggle,
} from "./coconut-stub";

interface PricingTier {
    name: string;
    description: string;
    monthlyPrice: number;
    annualPrice: number;
    features: string[];
    highlighted?: boolean;
    ctaText: string;
}

const pricingTiers: PricingTier[] = [
    {
        name: "Starter",
        description: "Perfect for individual teachers getting started with automation",
        monthlyPrice: 19,
        annualPrice: 15,
        features: [
            "Up to 5 workflows",
            "100 workflow executions/month",
            "Basic integrations",
            "Email support",
            "Community access",
        ],
        ctaText: "Start Free Trial",
    },
    {
        name: "Practitioner",
        description: "For teachers who want to automate their entire classroom",
        monthlyPrice: 49,
        annualPrice: 39,
        features: [
            "Unlimited workflows",
            "1,000 workflow executions/month",
            "All integrations",
            "Priority email support",
            "Advanced analytics",
            "Custom templates",
            "API access",
        ],
        highlighted: true,
        ctaText: "Start Free Trial",
    },
    {
        name: "Studio",
        description: "For schools and departments managing multiple classrooms",
        monthlyPrice: 149,
        annualPrice: 119,
        features: [
            "Everything in Practitioner",
            "Unlimited executions",
            "Team collaboration",
            "Dedicated support",
            "Custom integrations",
            "SSO & advanced security",
            "Onboarding & training",
            "SLA guarantee",
        ],
        ctaText: "Contact Sales",
    },
];

export function PricingSection() {
    const [isAnnual, setIsAnnual] = React.useState(false);

    const calculateSavings = (monthly: number, annual: number) => {
        const monthlyCost = monthly * 12;
        const annualCost = annual * 12;
        const savings = Math.round(((monthlyCost - annualCost) / monthlyCost) * 100);
        return savings;
    };

    return (
        <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Choose Your Practice
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                        Start with a 14-day free trial. No credit card required.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-3 p-1 bg-muted rounded-xl">
                        <CoconutToggle
                            pressed={!isAnnual}
                            onClick={() => setIsAnnual(false)}
                            aria-label="Switch to monthly billing"
                        >
                            Monthly
                        </CoconutToggle>
                        <CoconutToggle
                            pressed={isAnnual}
                            onClick={() => setIsAnnual(true)}
                            aria-label="Switch to annual billing"
                        >
                            Annual
                            <CoconutBadge variant="success" className="ml-2">
                                Save 20%
                            </CoconutBadge>
                        </CoconutToggle>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pricingTiers.map((tier) => {
                        const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
                        const savings = calculateSavings(tier.monthlyPrice, tier.annualPrice);

                        return (
                            <CoconutCard
                                key={tier.name}
                                className={tier.highlighted ? "ring-2 ring-primary shadow-xl scale-105" : ""}
                            >
                                <CoconutCardHeader>
                                    <div className="flex items-center justify-between mb-2">
                                        <CoconutCardTitle>{tier.name}</CoconutCardTitle>
                                        {tier.highlighted && (
                                            <CoconutBadge variant="default">Most Popular</CoconutBadge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                                </CoconutCardHeader>

                                <CoconutCardContent>
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold">${price}</span>
                                            <span className="text-muted-foreground">/month</span>
                                        </div>
                                        {isAnnual && (
                                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                                Save {savings}% • Billed annually at ${price * 12}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        className="w-full mb-6"
                                        variant={tier.highlighted ? "default" : "outline"}
                                        size="lg"
                                    >
                                        {tier.ctaText}
                                    </Button>

                                    <ul className="space-y-3">
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3">
                                                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                <span className="text-sm text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CoconutCardContent>
                            </CoconutCard>
                        );
                    })}
                </div>

                {/* FAQ or Additional Info */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground">
                        All plans include a 14-day free trial. Need a custom plan?{" "}
                        <a href="#contact" className="text-primary hover:underline font-medium">
                            Contact us
                        </a>
                    </p>
                </div>
            </div>
        </section>
    );
}
