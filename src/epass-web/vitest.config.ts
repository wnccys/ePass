import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "node",
        globals: true,
        exclude: [...configDefaults.exclude, "**/e2e/**", "**/.features-gen/**"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./"),
        },
    },
});
