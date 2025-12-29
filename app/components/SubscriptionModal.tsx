"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Check,
    ShieldCheck,
    CreditCard,
    Lock,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: {
        name: string;
        price: number;
        interval: string;
    } | null;
}

export function SubscriptionModal({ isOpen, onClose, plan }: SubscriptionModalProps) {
    const [status, setStatus] = React.useState<"idle" | "processing" | "success">("idle");

    const handleCheckout = () => {
        setStatus("processing");
        // Simulate payment processing
        setTimeout(() => {
            setStatus("success");
        }, 2500);
    };

    if (!plan) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] overflow-hidden">
                <AnimatePresence mode="wait">
                    {status === "idle" || status === "processing" ? (
                        <motion.div
                            key="checkout"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                    Secure Checkout
                                </DialogTitle>
                                <DialogDescription>
                                    You're subscribing to the <strong>{plan.name}</strong> plan.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-6 space-y-6">
                                {/* Order Summary */}
                                <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">{plan.name} Plan</span>
                                        <span className="text-xl font-bold">${plan.price}/{plan.interval}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground italic">Billed automatically every {plan.interval}. Cancel anytime.</p>
                                </div>

                                {/* Payment Mock */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                                        <CreditCard className="w-5 h-5 text-primary" />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">Pay with Card</p>
                                            <p className="text-xs text-muted-foreground">Visa, Mastercard, AMEX</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="w-6 h-4 bg-muted animate-pulse rounded" />
                                            <div className="w-6 h-4 bg-muted animate-pulse rounded" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                            <Lock className="w-3 h-3" />
                                            256-bit SSL Encrypted Payment
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                            <ShieldCheck className="w-3 h-3" />
                                            Authorized Payment Partner
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="ghost" onClick={onClose} disabled={status === "processing"}>
                                    Cancel
                                </Button>
                                <Button
                                    className="px-8 relative overflow-hidden group"
                                    disabled={status === "processing"}
                                    onClick={handleCheckout}
                                >
                                    {status === "processing" ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Complete Subscription"
                                    )}
                                </Button>
                            </DialogFooter>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-10 text-center gap-4"
                        >
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-2 shadow-xl shadow-green-500/20">
                                <Check className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">You're All Set!</h2>
                                <p className="text-muted-foreground">Welcome to the {plan.name} plan. Your educational superpowers are now active.</p>
                            </div>
                            <Button className="mt-4 w-full" onClick={onClose}>
                                Start Automating
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
