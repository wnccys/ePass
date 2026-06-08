"use client";

import { motion } from "framer-motion";
import type React from "react";
import { cn } from "@/lib/utils";

export function FadeInDown({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    );
}
