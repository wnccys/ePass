import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Agreement from "@/models/Agreement";
import Transaction from "@/models/Transaction";
import { groq } from "@ai-sdk/groq";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    const { messages } = await req.json();
    const role = session.user.role;
    const email = session.user.email;

    // llama-3.3-70b-versatile is higher quality but has a much lower daily token limit.
    const modelId = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    try {
        const result = streamText({
            model: groq(modelId),
            system: `You are ePass AI, an advanced virtual assistant for managing on-chain football image rights escrow contracts.
You help clubs and players query their contracts, transactions, and manage user profile details.
The current logged in user has role: ${role} and email: ${email}.
Only perform tool actions that match the logged-in user's role:
- Players can view their active agreements and sign pending agreements.
- Clubs can create agreements, authorize vaults, and fractionalize rights.

When a user asks you to create a contract, draft a proposal, or set up an agreement:
1. Gather all the necessary details:
   - title (string)
   - description (string)
   - playerWalletAddress (string)
   - playerEmail (string)
   - attorneyWalletAddress (string)
   - attorneyEmail (string)
   - tokenURI (string, usually a PDF URL, default to a placeholder metadata link if not specified)
   - cautionAmountUSDC (string)
   - tokenName (string, e.g. PlayerRights, max 10 chars, no spaces)
   - tokenSymbol (string, e.g. $TOKEN_E, starts with $, max 10 chars, no spaces)
2. Use the 'prepareContract' tool to generate the structured proposal.
3. Show the user the details and instruct them to click the "Review & Submit Proposal" button/link that is returned. Do NOT attempt to create the agreement directly in the database. All contract creation must go through the user-review flow.`,
            messages: await convertToModelMessages(messages),
            tools: {
                queryContracts: tool({
                    description: "Queries agreements/contracts related to the current user, optionally filtered by status.",
                    inputSchema: z.object({
                        status: z.string().optional().describe('Filter contracts by status'),
                        limit: z.number().optional().describe('Limit the number of results returned'),
                    }),
                    execute: async ({ status, limit }) => {
                        await dbConnect();
                        const userDoc = await User.findById(session.user.id).select("contracts").lean();
                        if (!userDoc || !userDoc.contracts || userDoc.contracts.length === 0) {
                            return { contracts: [] };
                        }
                        const query: any = { _id: { $in: userDoc.contracts } };
                        if (status) query.status = status;
                        const contracts = await Agreement.find(query).sort({ updatedAt: -1 }).limit(limit ?? 5).lean();
                        return { contracts: JSON.parse(JSON.stringify(contracts)) };
                    }
                }),
                queryTransactions: tool({
                    description: "Queries transaction history for the user, optionally filtered by actionType or status.",
                    inputSchema: z.object({
                        actionType: z.string().optional().describe('Filter by action type (e.g. execute_mint, create_vault, etc.)'),
                        status: z.string().optional().describe('Filter by transaction status'),
                        limit: z.number().optional().describe('Limit the number of results returned'),
                    }),
                    execute: async ({ actionType, status, limit }) => {
                        await dbConnect();
                        const userDoc = await User.findById(session.user.id).select("contracts").lean();
                        const contractIds = userDoc?.contracts || [];
                        const query: any = {
                            $or: [
                                { userId: session.user.id },
                                { agreementId: { $in: contractIds } }
                            ]
                        };
                        if (actionType) query.actionType = actionType;
                        if (status) query.status = status;
                        const transactions = await Transaction.find(query)
                            .populate('agreementId', 'title status')
                            .sort({ createdAt: -1 })
                            .limit(limit ?? 5)
                            .lean();

                        return { transactions: JSON.parse(JSON.stringify(transactions)) };
                    }
                }),
                getAccountInfo: tool({
                    description: "Fetches profile, wallet address, and account details for the currently logged in user.",
                    inputSchema: z.object({}),
                    execute: async () => {
                        await dbConnect();
                        const userDoc = await User.findById(session.user.id).lean();
                        return {
                            user: {
                                name: userDoc?.name,
                                email: userDoc?.email,
                                role: userDoc?.role,
                                walletAddress: session.user.walletAddress || 'No wallet connected',
                                totalContracts: userDoc?.contracts?.length || 0,
                            }
                        };
                    }
                }),
                getContractById: tool({
                    description: "Fetches detailed information for a specific agreement/contract by its Mongoose ID.",
                    inputSchema: z.object({
                        id: z.string().describe('The unique MongoDB identifier of the contract'),
                    }),
                    execute: async ({ id }) => {
                        await dbConnect();
                        const userDoc = await User.findById(session.user.id).select("contracts").lean();
                        const hasAccess = userDoc?.contracts?.some(cid => cid.toString() === id);
                        if (!hasAccess) {
                            return { error: 'Unauthorized or contract not found' };
                        }
                        const contract = await Agreement.findById(id).lean();
                        return { contract: JSON.parse(JSON.stringify(contract)) };
                    }
                }),
                prepareContract: tool({
                    description: "Prepares a draft contract proposal and returns a structured preview and redirect URL for user confirmation.",
                    inputSchema: z.object({
                        title: z.string().describe('Title of the contract'),
                        description: z.string().describe('Detailed description of the image rights agreement'),
                        playerWalletAddress: z.string().describe('Ethereum wallet address of the player'),
                        playerEmail: z.string().describe('Email address of the player'),
                        attorneyWalletAddress: z.string().describe('Ethereum wallet address of the attorney'),
                        attorneyEmail: z.string().describe('Email address of the attorney'),
                        tokenURI: z.string().describe('URI of the metadata or document associated with the contract'),
                        cautionAmountUSDC: z.string().describe('Caution deposit amount in USDC'),
                        tokenName: z.string().describe('Name of the fractionalized rights token (e.g. PlayerRights)'),
                        tokenSymbol: z.string().describe('Symbol of the fractionalized rights token starting with $ (e.g. $TOKEN_E)'),
                    }),
                    execute: async (args) => {
                        const prefillData = {
                            title: args.title,
                            description: args.description,
                            playerWalletAddress: args.playerWalletAddress,
                            playerEmail: args.playerEmail,
                            attorneyWalletAddress: args.attorneyWalletAddress,
                            attorneyEmail: args.attorneyEmail,
                            tokenURI: args.tokenURI,
                            cautionAmountUSDC: args.cautionAmountUSDC,
                            tokenName: args.tokenName,
                            tokenSymbol: args.tokenSymbol,
                        };
                        const base64Prefill = Buffer.from(JSON.stringify(prefillData)).toString('base64');
                        const redirectUrl = `/contracts/new?prefill=${base64Prefill}`;

                        return {
                            status: 'success',
                            preview: prefillData,
                            redirectUrl,
                            message: 'Contract draft prepared. Please review and submit using the provided link.'
                        };
                    }
                })
            },
            stopWhen: stepCountIs(5),
        });

        // Surface real, actionable errors to the client instead of the SDK's masked
        // generic message. Streaming errors (e.g. Groq rate limits) happen AFTER the
        // handler returns, so they must be handled here rather than in the try/catch.
        return result.toUIMessageStreamResponse({
            onError: (error) => {
                const msg = error instanceof Error ? error.message : String(error);
                console.error("AI stream error:", msg);

                if (/rate.?limit|tokens per day|TPD|quota|429/i.test(msg)) {
                    return "The AI is temporarily rate-limited (Groq daily token limit reached). Please try again later, or set a different GROQ_MODEL.";
                }
                if (/api key|unauthor|401|invalid.*key/i.test(msg)) {
                    return "AI is misconfigured: the Groq API key is missing or invalid. Check GROQ_API_KEY in your .env.";
                }
                if (/model.*(not found|decommission|deprecat)|does not exist/i.test(msg)) {
                    return `The configured Groq model "${modelId}" is unavailable. Set a valid GROQ_MODEL in your .env.`;
                }
                return "The AI service hit an unexpected error. Please try again.";
            },
        });
    } catch (err: any) {
        console.error("AI Chat Route Error:", err);
        return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
