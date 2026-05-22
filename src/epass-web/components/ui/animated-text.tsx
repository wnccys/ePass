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
      style={{ height: "1.1em" }}
    >
      <span
        className="transition-transform duration-700 ease-in-out flex flex-col"
        style={{ transform: `translateY(calc(-${index} * 1.1em))` }}
      >
        {greetings.map((g, i) => (
          <span
            key={i}
            className={cn(
              "text-lime-400 whitespace-nowrap flex items-center justify-start"
            )}
            style={{ height: "1.1em", lineHeight: "1.1em" }}
          >
            {g}
          </span>
        ))}
      </span>
    </span>
  );
};

export default AnimatedTextRoller;
