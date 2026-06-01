import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAgreement extends Document {
  // Parties
  clubUserId: mongoose.Types.ObjectId;
  playerWalletAddress: string;
  playerEmail: string;
  clubWalletAddress: string;
  attorneyWalletAddress: string;
  attorneyEmail: string;
  
  // Agreement Data
  tokenURI: string;
  cautionAmount: string; // BigInt as string (wei)
  
  // EIP-712 Signatures (collected progressively)
  playerSignature?: string;
  clubSignature?: string;
  attorneySignature?: string;
  
  // Lifecycle
  status: "draft" | "pending_signatures" | "ready" | "minted" | "vault_created" | "active" | "rescinded" | "expired";
  
  // On-chain references
  mintTxHash?: string;
  nftTokenId?: number;
  vaultAddress?: string;
  
  // EIP-712 parameters
  nonce?: number;
  deadline?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const AgreementSchema = new Schema<IAgreement>({
  clubUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  playerWalletAddress: { type: String, required: true, lowercase: true, trim: true, index: true },
  playerEmail: { type: String, required: true, trim: true, lowercase: true },
  clubWalletAddress: { type: String, required: true, lowercase: true, trim: true, index: true },
  attorneyWalletAddress: { type: String, required: true, lowercase: true, trim: true },
  attorneyEmail: { type: String, required: true, trim: true, lowercase: true },
  
  tokenURI: { type: String, required: true },
  cautionAmount: { type: String, required: true },
  
  playerSignature: { type: String, default: null },
  clubSignature: { type: String, default: null },
  attorneySignature: { type: String, default: null },
  
  status: { 
    type: String, 
    enum: ['draft', 'pending_signatures', 'ready', 'minted', 'vault_created', 'active', 'rescinded', 'expired'],
    default: 'pending_signatures',
    required: true 
  },
  
  mintTxHash: { type: String, default: null },
  nftTokenId: { type: Number, default: null },
  vaultAddress: { type: String, default: null, lowercase: true },
  
  nonce: { type: Number, default: null },
  deadline: { type: Date, default: null },
}, {
  timestamps: true
});

const Agreement: Model<IAgreement> = mongoose.models.Agreement || mongoose.model<IAgreement>("Agreement", AgreementSchema);

export default Agreement;
