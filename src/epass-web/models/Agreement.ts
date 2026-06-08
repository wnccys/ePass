import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { SerializedAgreement } from "@/types/agreement";

export interface IAgreement
    extends Omit<
            SerializedAgreement,
            | "_id"
            | "clubUserId"
            | "playerSignature"
            | "clubSignature"
            | "attorneySignature"
            | "mintTxHash"
            | "nftTokenId"
            | "vaultAddress"
            | "nonce"
            | "deadline"
            | "createdAt"
            | "updatedAt"
        >,
        Document {
    clubUserId: mongoose.Types.ObjectId;
    playerSignature?: string;
    clubSignature?: string;
    attorneySignature?: string;
    mintTxHash?: string;
    nftTokenId?: number;
    vaultAddress?: string;
    nonce?: number;
    deadline?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AgreementSchema = new Schema<IAgreement>(
    {
        clubUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        playerWalletAddress: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        playerEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        clubWalletAddress: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        clubEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        attorneyWalletAddress: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        attorneyEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        tokenURI: { type: String, required: true },
        cautionAmount: { type: String, required: true },
        tokenName: { type: String, required: true, trim: true },
        tokenSymbol: { type: String, required: true, trim: true },

        playerSignature: { type: String, default: null },
        clubSignature: { type: String, default: null },
        attorneySignature: { type: String, default: null },

        status: {
            type: String,
            enum: [
                "draft",
                "pending_signatures",
                "ready",
                "minted",
                "vault_created",
                "pending_deposit",
                "active",
                "rescinded",
                "expired",
            ],
            default: "pending_signatures",
            required: true,
        },

        mintTxHash: { type: String, default: null },
        nftTokenId: { type: Number, default: null },
        vaultAddress: { type: String, default: null, lowercase: true },

        nonce: { type: Number, default: null },
        deadline: {
            type: Date,
            default: null,
            set: (val: any) => {
                if (!val) return null;
                const date = new Date(val);
                // Strip milliseconds by setting them to 0
                date.setUTCMilliseconds(0);
                return date;
            },
        },
    },
    {
        timestamps: true,
    },
);

const Agreement: Model<IAgreement> =
    mongoose.models.Agreement ||
    mongoose.model<IAgreement>("Agreement", AgreementSchema);

export default Agreement;
