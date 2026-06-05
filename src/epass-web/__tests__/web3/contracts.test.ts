import { describe, it, expect } from "vitest";
import {
  ContractStatus,
  CONTRACT_STATUS_LABELS,
  RIGHTS_MINTER,
  PLAYER_RIGHTS_MASTER,
  VAULT_FACTORY,
  MOCK_USDC,
  RIGHTS_VAULT_ABI,
} from "@/lib/web3/contracts";

describe("ContractStatus", () => {
  it("PENDING é 0", () => expect(ContractStatus.PENDING).to.equal(0));
  it("ACTIVE é 1",   () => expect(ContractStatus.ACTIVE).to.equal(1));
  it("RESCINDED é 2", () => expect(ContractStatus.RESCINDED).to.equal(2));
  it("EXPIRED é 3",  () => expect(ContractStatus.EXPIRED).to.equal(3));
});

describe("CONTRACT_STATUS_LABELS", () => {
  it("todos os status têm label definida", () => {
    const statuses = [
      ContractStatus.PENDING,
      ContractStatus.ACTIVE,
      ContractStatus.RESCINDED,
      ContractStatus.EXPIRED,
    ];
    for (const s of statuses) {
      expect(CONTRACT_STATUS_LABELS[s]).to.be.a("string").and.not.equal("");
    }
  });

  it("labels correspondem aos valores esperados", () => {
    expect(CONTRACT_STATUS_LABELS[ContractStatus.PENDING]).to.equal("Pending");
    expect(CONTRACT_STATUS_LABELS[ContractStatus.ACTIVE]).to.equal("Active");
    expect(CONTRACT_STATUS_LABELS[ContractStatus.RESCINDED]).to.equal("Rescinded");
    expect(CONTRACT_STATUS_LABELS[ContractStatus.EXPIRED]).to.equal("Expired");
  });
});

describe("envAddress fallback (sem env var)", () => {
  const ZERO = "0x0000000000000000000000000000000000000000";

  it("RIGHTS_MINTER usa zero address quando env não está definida", () => {
    expect(RIGHTS_MINTER.address).to.equal(ZERO);
  });

  it("PLAYER_RIGHTS_MASTER usa zero address quando env não está definida", () => {
    expect(PLAYER_RIGHTS_MASTER.address).to.equal(ZERO);
  });

  it("VAULT_FACTORY usa zero address quando env não está definida", () => {
    expect(VAULT_FACTORY.address).to.equal(ZERO);
  });

  it("MOCK_USDC usa zero address quando env não está definida", () => {
    expect(MOCK_USDC.address).to.equal(ZERO);
  });
});

describe("RIGHTS_MINTER ABI", () => {
  const names = RIGHTS_MINTER.abi.map((f) => f.name);

  it("contém executeMint",        () => expect(names).to.include("executeMint"));
  it("contém executedAgreements", () => expect(names).to.include("executedAgreements"));
  it("contém eip712Domain",       () => expect(names).to.include("eip712Domain"));
});

describe("VAULT_FACTORY ABI", () => {
  const names = VAULT_FACTORY.abi.map((f) => f.name);

  it("contém createVault",      () => expect(names).to.include("createVault"));
  it("contém getVaults",        () => expect(names).to.include("getVaults"));
  it("contém getVaultsByClub",  () => expect(names).to.include("getVaultsByClub"));
});

describe("RIGHTS_VAULT_ABI", () => {
  const names = RIGHTS_VAULT_ABI.map((f) => f.name);

  it("contém fractionalize",   () => expect(names).to.include("fractionalize"));
  it("contém depositCaution",  () => expect(names).to.include("depositCaution"));
  it("contém rescindByPlayer", () => expect(names).to.include("rescindByPlayer"));
  it("contém rescindByClub",   () => expect(names).to.include("rescindByClub"));
  it("contém expireContract",  () => expect(names).to.include("expireContract"));
  it("contém status",          () => expect(names).to.include("status"));
  it("contém timeRemaining",   () => expect(names).to.include("timeRemaining"));
});
