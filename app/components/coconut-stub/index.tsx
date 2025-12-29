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
            "rounded-[2rem] border border-border/50 bg-card/50 backdrop-blur-sm text-card-foreground shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/20",
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
        className={cn("flex flex-col space-y-2 p-8 pb-4", className)}
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
        className={cn("text-3xl font-bold leading-none tracking-tight", className)}
        {...props}
    />
));
CoconutCardTitle.displayName = "CoconutCardTitle";

export const CoconutCardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-8 pt-4", className)} {...props} />
));
CoconutCardContent.displayName = "CoconutCardContent";

export const CoconutBadge = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "success" | "warning" }
>(({ className, variant = "default", ...props }, ref) => {
    const variants = {
        default: "bg-muted text-foreground font-bold border border-border/50",
        success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold",
        warning: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold",
    };

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-wider transition-colors shadow-sm",
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
            "inline-flex items-center justify-center rounded-full px-6 py-2.5 text-xs font-bold transition-all duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            pressed && "bg-[#0b1221] text-white shadow-lg",
            !pressed && "text-muted-foreground hover:bg-muted",
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
