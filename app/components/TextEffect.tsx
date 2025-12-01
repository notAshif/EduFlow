"use client";

import { useEffect, useState } from "react";

interface TextEffectProps {
    text: string;
    speed?: number;
    className?: string;
    cursor?: boolean;
}

export function TextEffect({ text, speed = 100, className = "", cursor = true }: TextEffectProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < text.length) {
            const timeoutId = setTimeout(() => {
                setDisplayedText((prev) => prev + text.charAt(index));
                setIndex((prev) => prev + 1);
            }, speed);
            return () => clearTimeout(timeoutId);
        }
    }, [index, text, speed]);

    // Reset if text changes
    useEffect(() => {
        setDisplayedText("");
        setIndex(0);
    }, [text]);

    return (
        <span className={className}>
            {displayedText}
            {cursor && index < text.length && (
                <span className="animate-pulse ml-0.5 inline-block h-[1em] w-[2px] bg-current align-middle" />
            )}
        </span>
    );
}
