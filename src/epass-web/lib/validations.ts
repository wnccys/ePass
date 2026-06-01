import { z } from "zod";
import { isAddress } from "viem";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Shared Zod schema for file validation
export const avatarValidationSchema = z
  .any()
  .optional()
  .refine(
    (file) => {
      if (!file) return true; // Optional field
      return file.size <= MAX_FILE_SIZE;
    },
    { message: "Max image size is 5MB." }
  )
  .refine(
    (file) => {
      if (!file) return true;
      return ACCEPTED_IMAGE_TYPES.includes(file.type);
    },
    { message: "Only .jpg, .jpeg, .png and .webp formats are supported." }
  );

// Shared schemas for the forms
export const baseProfileSchema = z.object({
  name: z.string().min(5, 'Name must be at least 5 characters long'),
  role: z.enum(['player', 'club']),
  avatar: avatarValidationSchema,
});

export const onboardingSchema = baseProfileSchema;

export const profileSchema = baseProfileSchema.extend({
  bio: z.string().max(160, 'Bio must be under 160 characters').optional(),
});

export const contractSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters long" }),
  playerWalletAddress: z.string().refine((val) => isAddress(val), {
    message: "Invalid Player Wallet Address",
  }),
  playerEmail: z.string().email({ message: "Invalid Player Email Address" }),
  attorneyWalletAddress: z.string().refine((val) => isAddress(val), {
    message: "Invalid Attorney Wallet Address",
  }),
  attorneyEmail: z.string().email({ message: "Invalid Attorney Email Address" }),
  tokenURI: z.string().min(1, { message: "Token URI is required" }),
  cautionAmountUSDC: z.string().refine((val) => {
    const num = Number(val);
    return val !== "" && !isNaN(num) && num >= 0;
  }, {
    message: "Invalid Caution Amount",
  }),
});
