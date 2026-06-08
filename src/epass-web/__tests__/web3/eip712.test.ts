import { describe, expect, it } from "vitest";
import {
    buildMintAgreementDomain,
    MINT_AGREEMENT_TYPES,
} from "@/lib/web3/eip712";

describe("MINT_AGREEMENT_TYPES", () => {
    const fields = MINT_AGREEMENT_TYPES.MintAgreement;

    it("contém exatamente 6 campos", () => {
        expect(fields).to.have.length(6);
    });

    it("possui o campo player do tipo address", () => {
        expect(fields[0]).to.deep.equal({ name: "player", type: "address" });
    });

    it("possui o campo club do tipo address", () => {
        expect(fields[1]).to.deep.equal({ name: "club", type: "address" });
    });

    it("possui o campo attorney do tipo address", () => {
        expect(fields[2]).to.deep.equal({ name: "attorney", type: "address" });
    });

    it("possui o campo tokenURI do tipo string", () => {
        expect(fields[3]).to.deep.equal({ name: "tokenURI", type: "string" });
    });

    it("possui nonce e deadline do tipo uint256", () => {
        expect(fields[4]).to.deep.equal({ name: "nonce", type: "uint256" });
        expect(fields[5]).to.deep.equal({ name: "deadline", type: "uint256" });
    });
});

describe("buildMintAgreementDomain()", () => {
    const minter =
        "0xaabbccddeeaabbccddeeaabbccddeeaabbccddee" as `0x${string}`;
    const chainId = 31337; // Foundry local chain

    const domain = buildMintAgreementDomain(minter, chainId);

    it("retorna name igual a RightsMinter", () => {
        expect(domain.name).to.equal("RightsMinter");
    });

    it("retorna version igual a 1", () => {
        expect(domain.version).to.equal("1");
    });

    it("usa o chainId fornecido", () => {
        expect(domain.chainId).to.equal(chainId);
    });

    it("usa o endereço do contrato fornecido como verifyingContract", () => {
        expect(domain.verifyingContract).to.equal(minter);
    });

    it("domínios com chainIds diferentes não são iguais", () => {
        const mainnet = buildMintAgreementDomain(minter, 1);
        expect(mainnet.chainId).to.not.equal(domain.chainId);
    });
});
