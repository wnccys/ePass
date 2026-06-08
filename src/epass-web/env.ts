import { createEnv } from "next-env-safe";
import z from "zod";

const ethAddressSchema = z
    .string()
    .startsWith("0x", { message: "Address must start with 0x" })
    .length(42, { message: "Address must be exactly 42 characters long" })
    .transform((val) => val as `0x${string}`);

export const env = createEnv({
    /*
     * 🔒 Server-side Environment Variables
     * Safe from leaking to the browser.
     */
    server: {
        NODE_ENV: z
            .enum(["development", "production", "test"])
            .default("development"),

        // MongoDB Connection
        MONGODB_URI: z.url(),

        // NextAuth Global Settings
        NEXTAUTH_SECRET: z.string().min(1),
        NEXTAUTH_URL: z.url(),

        // Google OAuth Credentials
        GOOGLE_CLIENT_ID: z.string().min(1),
        GOOGLE_CLIENT_SECRET: z.string().min(1),

        // Pinata Integration
        PINATA_JWT: z.string().min(1),

        // AI & Web3 Server Configurations
        ADMIN_PRIVATE_KEY: z
            .string()
            .startsWith("0x", { message: "Private key must start with 0x" }),
        GROQ_API_KEY: z.string().min(1),
        GROQ_MODEL: z.string().default("llama-3.1-8b-instant"),
    },

    /*
     * 🌐 Client-side Environment Variables
     * Safe to use in React components. Must start with NEXT_PUBLIC_.
     */
    client: {
        // Rainbow Kit ID
        NEXT_PUBLIC_RAINBOW_PROJECT_ID: z.string().min(1),

        // Sepolia Config & RPC
        NEXT_PUBLIC_SEPOLIA_RPC_URL: z.url(),

        // Foundry Config & RPC
        NEXT_PUBLIC_FOUNDRY_RPC_URL: z.url().default("http://127.0.0.1:8545"),

        // Web3 Contract Addresses
        NEXT_PUBLIC_MOCK_USDC_ADDRESS: ethAddressSchema,
        NEXT_PUBLIC_RIGHTS_MINTER_ADDRESS: ethAddressSchema,
        NEXT_PUBLIC_PLAYER_RIGHTS_MASTER_ADDRESS: ethAddressSchema,
        NEXT_PUBLIC_VAULT_FACTORY_ADDRESS: ethAddressSchema,
    },

    /*
     * ⚙️ Runtime environment configuration mapping
     */
    runtimeEnv: {
        NODE_ENV: process.env.NODE_ENV,
        MONGODB_URI: process.env.MONGODB_URI,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        PINATA_JWT: process.env.PINATA_JWT,
        ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        GROQ_MODEL: process.env.GROQ_MODEL,

        NEXT_PUBLIC_RAINBOW_PROJECT_ID:
            process.env.NEXT_PUBLIC_RAINBOW_PROJECT_ID,
        NEXT_PUBLIC_SEPOLIA_RPC_URL: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
        NEXT_PUBLIC_FOUNDRY_RPC_URL: process.env.NEXT_PUBLIC_FOUNDRY_RPC_URL,
        NEXT_PUBLIC_MOCK_USDC_ADDRESS:
            process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS,
        NEXT_PUBLIC_RIGHTS_MINTER_ADDRESS:
            process.env.NEXT_PUBLIC_RIGHTS_MINTER_ADDRESS,
        NEXT_PUBLIC_PLAYER_RIGHTS_MASTER_ADDRESS:
            process.env.NEXT_PUBLIC_PLAYER_RIGHTS_MASTER_ADDRESS,
        NEXT_PUBLIC_VAULT_FACTORY_ADDRESS:
            process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS,
    },
});
