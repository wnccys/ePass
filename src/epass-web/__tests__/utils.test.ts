import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn()", () => {
  it("retorna uma string vazia quando não recebe argumentos", () => {
    expect(cn()).to.equal("");
  });

  it("combina classes simples", () => {
    expect(cn("flex", "gap-4")).to.equal("flex gap-4");
  });

  it("ignora valores falsy", () => {
    expect(cn("flex", false, null, undefined, "gap-4")).to.equal("flex gap-4");
  });

  it("resolve conflitos do Tailwind mantendo a última classe", () => {
    expect(cn("p-4", "p-8")).to.equal("p-8");
    expect(cn("text-red-500", "text-blue-500")).to.equal("text-blue-500");
  });

  it("suporta classes condicionais via objeto", () => {
    expect(cn({ flex: true, hidden: false })).to.equal("flex");
  });
});
