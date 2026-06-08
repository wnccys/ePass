import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface ITransaction extends Document {
    userId: mongoose.Types.ObjectId;
    agreementId?: mongoose.Types.ObjectId;
    txHash: string;
    chainId: number;
    actionType:
        | "execute_mint"
        | "create_vault"
        | "authorize_vault"
        | "fractionalize"
        | "approve_token"
        | "approve_usdc_to_vault"
        | "deposit_caution"
        | "rescind_player"
        | "rescind_club"
        | "expire_contract";
    contractAddress: string;
    walletAddress: string;
    status: "submitted" | "confirmed" | "failed";
    blockNumber?: number;
    confirmedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        agreementId: {
            type: Schema.Types.ObjectId,
            ref: "Agreement",
            default: null,
        },
        txHash: { type: String, required: true, unique: true },
        chainId: { type: Number, required: true },
        actionType: {
            type: String,
            enum: [
                "execute_mint",
                "create_vault",
                "authorize_vault",
                "fractionalize",
                "approve_token",
                "approve_usdc_to_vault",
                "deposit_caution",
                "rescind_player",
                "rescind_club",
                "expire_contract",
            ],
            required: true,
        },
        contractAddress: { type: String, required: true, lowercase: true },
        walletAddress: { type: String, required: true, lowercase: true },
        status: {
            type: String,
            enum: ["submitted", "confirmed", "failed"],
            default: "submitted",
            required: true,
        },
        blockNumber: { type: Number, default: null },
        confirmedAt: { type: Date, default: null },
    },
    {
        timestamps: true,
    },
);

const Transaction: Model<ITransaction> =
    mongoose.models.Transaction ||
    mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
