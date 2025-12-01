// TODO: replace with coconut-ui imports when coconut-ui is installed
// These are minimal stub components to match Coconut UI API

import * as React from "react";
import { cn } from "@/lib/utils";

export const CoconutCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all",
            className
        )}
        {...props}
    />
));
CoconutCard.displayName = "CoconutCard";

export const CoconutCardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CoconutCardHeader.displayName = "CoconutCardHeader";

export const CoconutCardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
        {...props}
    />
));
CoconutCardTitle.displayName = "CoconutCardTitle";

export const CoconutCardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CoconutCardContent.displayName = "CoconutCardContent";

export const CoconutBadge = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "success" | "warning" }
>(({ className, variant = "default", ...props }, ref) => {
    const variants = {
        default: "bg-primary/10 text-primary",
        success: "bg-green-500/10 text-green-600 dark:text-green-400",
        warning: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    };

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                variants[variant],
                className
            )}
            {...props}
        />
    );
});
CoconutBadge.displayName = "CoconutBadge";

export const CoconutToggle = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }
>(({ className, pressed, ...props }, ref) => (
    <button
        ref={ref}
        role="switch"
        aria-checked={pressed}
        data-state={pressed ? "on" : "off"}
        className={cn(
            "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all",
            "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            pressed && "bg-primary text-primary-foreground",
            !pressed && "bg-muted/50 text-muted-foreground",
            className
        )}
        {...props}
    />
));
CoconutToggle.displayName = "CoconutToggle";

export const CoconutGrid = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("grid gap-4", className)}
        {...props}
    />
));
CoconutGrid.displayName = "CoconutGrid";
