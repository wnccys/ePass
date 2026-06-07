import { describe, it, expect } from "vitest";
import {
  avatarValidationSchema,
  baseProfileSchema,
  profileSchema,
  MAX_FILE_SIZE,
} from "@/lib/validations";

describe("avatarValidationSchema", () => {
  it("aceita undefined (campo opcional)", () => {
    const result = avatarValidationSchema.safeParse(undefined);
    expect(result.success).to.be.true;
  });

  it("rejeita arquivo maior que 5MB", () => {
    const bigFile = { size: MAX_FILE_SIZE + 1, type: "image/png" };
    const result = avatarValidationSchema.safeParse(bigFile);
    expect(result.success).to.be.false;
  });

  it("rejeita tipo de arquivo inválido", () => {
    const file = { size: 1024, type: "image/gif" };
    const result = avatarValidationSchema.safeParse(file);
    expect(result.success).to.be.false;
  });

  it("aceita arquivo válido", () => {
    const file = { size: 1024, type: "image/png" };
    const result = avatarValidationSchema.safeParse(file);
    expect(result.success).to.be.true;
  });
});

describe("baseProfileSchema", () => {
  it("rejeita nome com menos de 5 caracteres", () => {
    const result = baseProfileSchema.safeParse({ name: "Jo", role: "player" });
    expect(result.success).to.be.false;
  });

  it("rejeita role inválida", () => {
    const result = baseProfileSchema.safeParse({ name: "Joao Silva", role: "admin" });
    expect(result.success).to.be.false;
  });

  it("aceita dados válidos de player", () => {
    const result = baseProfileSchema.safeParse({ name: "Joao Silva", role: "player" });
    expect(result.success).to.be.true;
  });

  it("aceita dados válidos de club", () => {
    const result = baseProfileSchema.safeParse({ name: "Clube Esportivo", role: "club" });
    expect(result.success).to.be.true;
  });
});

describe("profileSchema", () => {
  it("rejeita bio com mais de 160 caracteres", () => {
    const result = profileSchema.safeParse({
      name: "Joao Silva",
      bio: "a".repeat(161),
    });
    expect(result.success).to.be.false;
  });

  it("aceita bio dentro do limite", () => {
    const result = profileSchema.safeParse({
      name: "Joao Silva",
      bio: "Jogador profissional.",
    });
    expect(result.success).to.be.true;
  });

  it("aceita sem bio (campo opcional)", () => {
    const result = profileSchema.safeParse({ name: "Joao Silva" });
    expect(result.success).to.be.true;
  });
});
