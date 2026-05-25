"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
        <h1>Welcome Back</h1>
        <Button
            onClick={() => signIn("google", { callbackUrl: "/home" })}
            className="px-4 py-2 rounded"
        >
            Sign in with Google
        </Button>
        </div>
    );
}