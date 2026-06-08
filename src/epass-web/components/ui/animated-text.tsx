"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const AnimatedTextRoller = ({ greetings }: { greetings: string[] }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % greetings.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [greetings.length]);

    return (
        <span
            className="inline-flex flex-col overflow-hidden align-bottom"
            style={{ height: "1.25em" }}
        >
            <span
                className="flex flex-col transition-transform duration-700 ease-in-out"
                style={{ transform: `translateY(calc(-${index} * 1.25em))` }}
            >
                {greetings.map((g, i) => (
                    <span
                        key={i}
                        className={cn(
                            "flex items-center justify-start whitespace-nowrap pb-0.5 text-lime-400",
                        )}
                        style={{ height: "1.25em", lineHeight: "1.25em" }}
                    >
                        {g}
                    </span>
                ))}
            </span>
        </span>
    );
};

export default AnimatedTextRoller;
