import { z } from "zod";

const envSchema = z.object({
  // Database
  MONGODB_URI: z.url({ error: "MONGODB_URI must be a valid MongoDB connection string" }),

  // NextAuth Config
  NEXTAUTH_SECRET: z.string().min(1, { error: "NEXTAUTH_SECRET is required" }),
  NEXTAUTH_URL: z.url({ error: "NEXTAUTH_URL must be a valid absolute URL" }),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, { error: "GOOGLE_CLIENT_ID is required" }),
  GOOGLE_CLIENT_SECRET: z.string().min(1, { error: "GOOGLE_CLIENT_SECRET is required" }),

  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Run validation safely
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables found:");
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));

  // Crash the server immediately to prevent runtime errors
  process.exit(1);
}

// Export the validated typed object
export const env = parsedEnv.data;

// Declaring global types so TypeScript gives you autocompletion on process.env
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}