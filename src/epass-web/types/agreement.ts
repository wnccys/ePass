export interface SerializedAgreement {
    _id: string;
    clubUserId: string;
    playerWalletAddress: string;
    playerEmail: string;
    clubWalletAddress: string;
    clubEmail: string;
    attorneyWalletAddress: string;
    attorneyEmail: string;

    // Agreement Data
    title: string;
    description: string;
    tokenURI: string;
    cautionAmount: string; // BigInt as string (USDC/wei)
    tokenName: string;
    tokenSymbol: string;

    // EIP-712 Signatures (collected progressively)
    playerSignature?: string | null;
    clubSignature?: string | null;
    attorneySignature?: string | null;

    // Lifecycle
    status: "draft" | "pending_signatures" | "ready" | "minted" | "vault_created" | "pending_deposit" | "active" | "rescinded" | "expired";

    // On-chain references
    mintTxHash?: string | null;
    nftTokenId?: number | null;
    vaultAddress?: string | null;

    // EIP-712 parameters
    nonce?: number | null;
    deadline?: string | null;

    createdAt: string;
    updatedAt: string;
}
