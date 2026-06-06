import { env } from "@/env";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { Agent } from "https"; // <-- 1. Import this native Node module
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Prevent auth bug on production
const isDev = env.NODE_ENV === "development";
const ipv4Agent = isDev ? new Agent({ family: 4 }) : undefined;

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID as string,
            clientSecret: env.GOOGLE_CLIENT_SECRET as string,
            httpOptions: {
                timeout: 10000,
                ...(ipv4Agent && { agent: ipv4Agent })
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        // Saves data securelly into encrypted browser cookie
        async jwt({ token, user, account, trigger, session }) {
            // Only true after Provider Login (Google in our case)
            if (account && user?.email) {
                try {
                    await dbConnect();

                    let dbUser = await User.findOne({ email: user.email });

                    if (!dbUser) {
                        dbUser = await User.create({
                            email: user?.email,
                            name: user.name || user.email.split("@")[0],
                            image: user.image || "",
                            authProvider: account?.provider,
                            authProviderId: account?.providerAccountId,
                            // Role is default to 'player'
                            onboardingComplete: false
                        });
                    }

                    token.email = dbUser.email;
                    token.id = dbUser._id.toString();
                    token.role = dbUser.role;
                } catch (error) {
                    console.error("Database error during OAuth callback:", error);
                    throw new Error("Database connection failed during login");
                }
            }

            if (trigger === "update" && session) {
                // Matches two possible objects (*, *.user)
                if ("walletAddress" in session) {
                    token.walletAddress = session.walletAddress || undefined;
                } else if (session.user && "walletAddress" in session.user) {
                    token.walletAddress = session.user.walletAddress || undefined;
                }
            }

            if (token.id && trigger === "update") {
                await dbConnect();
                const userDoc = await User.findById(token.id).select("role email").lean();

                if (userDoc) {
                    token.email = userDoc.email;
                    token.role = userDoc.role;
                }
            }
            return token;
        },

        // Takes data out of that decrypted cookie and exposes it to the actual application.
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.role = token.role as "player" | "club" | undefined;
                session.user.walletAddress = token.walletAddress as string | undefined;
            }

            return session;
        }
    }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };