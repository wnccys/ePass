import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    image?: string;         // Optional
    authProvider: string;
    authProviderId: string;
    role: string;
    onboardingComplete: boolean;
}

// Pass the interface into the Schema via <IUser>
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  authProvider: { type: String, required: true },
  authProviderId: { type: String, required: true },
  role: { type: String, enum: ["player, club"], required: true, default: "player" },
  onboardingComplete: { type: Boolean, default: false }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Pass the interface into the Model via Model<IUser> and model<IUser>
// The logical OR (||) prevents Next.js from recompiling the model multiple times in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;