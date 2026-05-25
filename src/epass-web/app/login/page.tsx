"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
        <h1>Welcome Back</h1>
        <button
            onClick={() => signIn("google", { callbackUrl: "/home" })}
            className="px-4 py-2 bg-blue-600 text-white rounded"
        >
            Sign in with Google
        </button>
        </div>
    );
}