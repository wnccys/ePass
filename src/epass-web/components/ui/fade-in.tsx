'use client'

import { motion } from "framer-motion";
import React from "react";

export function FadeIn({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 md:p-12 rounded-3xl w-full max-w-2xl flex flex-col gap-8"
        >
            {children}
        </motion.div>
    );
}