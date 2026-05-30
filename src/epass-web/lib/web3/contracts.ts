/**
 * Contract configuration module.
 *
 * Centralizes ABI fragments and addresses for every contract
 * the frontend interacts with.  Addresses are read from
 * NEXT_PUBLIC_* env vars set after running the deploy script.
 */

// ---------------------------------------------------------------------------
// Address helpers
// ---------------------------------------------------------------------------

function envAddress(key: string): `0x${string}` {
  const raw = process.env[key];
  if (!raw) return "0x0000000000000000000000000000000000000000";
  return raw as `0x${string}`;
}

// ---------------------------------------------------------------------------
// RightsMinter — EIP-712 multi-party signature gateway
// ---------------------------------------------------------------------------

export const RIGHTS_MINTER = {
  address: envAddress("NEXT_PUBLIC_RIGHTS_MINTER_ADDRESS"),
  abi: [
    // Write
    {
      name: "executeMint",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        {
          name: "req",
          type: "tuple",
          components: [
            { name: "player", type: "address" },
            { name: "club", type: "address" },
            { name: "attorney", type: "address" },
            { name: "tokenURI", type: "string" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        },
        { name: "playerSig", type: "bytes" },
        { name: "clubSig", type: "bytes" },
        { name: "attorneySig", type: "bytes" },
      ],
      outputs: [],
    },
    // Read
    {
      name: "nonces",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "owner", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "MINT_AGREEMENT_TYPEHASH",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "bytes32" }],
    },
    {
      name: "eip712Domain",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [
        { name: "fields", type: "bytes1" },
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
        { name: "salt", type: "bytes32" },
        { name: "extensions", type: "uint256[]" },
      ],
    },
    {
      name: "masterNftAddress",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "address" }],
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// PlayerRightsMaster — ERC-721 NFT
// ---------------------------------------------------------------------------

export const PLAYER_RIGHTS_MASTER = {
  address: envAddress("NEXT_PUBLIC_PLAYER_RIGHTS_MASTER_ADDRESS"),
  abi: [
    {
      name: "ownerOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "tokenId", type: "uint256" }],
      outputs: [{ name: "", type: "address" }],
    },
    {
      name: "approve",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "to", type: "address" },
        { name: "tokenId", type: "uint256" },
      ],
      outputs: [],
    },
    {
      name: "tokenURI",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "tokenId", type: "uint256" }],
      outputs: [{ name: "", type: "string" }],
    },
    // Events
    {
      name: "RightsMinted",
      type: "event",
      inputs: [
        { name: "tokenId", type: "uint256", indexed: true },
        { name: "recipient", type: "address", indexed: true },
        { name: "tokenURI", type: "string", indexed: false },
      ],
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// VaultFactory — deploys RightsVault per agreement
// ---------------------------------------------------------------------------

export const VAULT_FACTORY = {
  address: envAddress("NEXT_PUBLIC_VAULT_FACTORY_ADDRESS"),
  abi: [
    {
      name: "createVault",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "_masterNftAddress", type: "address" },
        { name: "_stablecoinAddress", type: "address" },
        { name: "_player", type: "address" },
        { name: "_club", type: "address" },
      ],
      outputs: [{ name: "vault", type: "address" }],
    },
    {
      name: "getVaults",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "address[]" }],
    },
    {
      name: "getVaultsByClub",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "club", type: "address" }],
      outputs: [{ name: "", type: "address[]" }],
    },
    // Events
    {
      name: "VaultCreated",
      type: "event",
      inputs: [
        { name: "vault", type: "address", indexed: true },
        { name: "player", type: "address", indexed: true },
        { name: "club", type: "address", indexed: true },
      ],
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// RightsVault — per-agreement ERC-20 + caution lifecycle
// ---------------------------------------------------------------------------

export const RIGHTS_VAULT_ABI = [
  // Write functions
  {
    name: "fractionalize",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_tokenId", type: "uint256" },
      { name: "_supply", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "depositCaution",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "rescindByPlayer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "rescindByClub",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "expireContract",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  // Read functions
  {
    name: "status",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "timeRemaining",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isBeforeHalfTime",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "cautionAmount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "player",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "club",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "contractStart",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "lockedTokenId",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Events
  {
    name: "ContractActivated",
    type: "event",
    inputs: [
      { name: "club", type: "address", indexed: true },
      { name: "cautionAmount", type: "uint256", indexed: false },
      { name: "contractStart", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ContractRescindedByPlayer",
    type: "event",
    inputs: [
      { name: "toClub", type: "uint256", indexed: false },
      { name: "toPlayer", type: "uint256", indexed: false },
      { name: "penaltyApplied", type: "bool", indexed: false },
    ],
  },
  {
    name: "ContractRescindedByClub",
    type: "event",
    inputs: [
      { name: "toPlayer", type: "uint256", indexed: false },
      { name: "toClub", type: "uint256", indexed: false },
      { name: "penaltyApplied", type: "bool", indexed: false },
    ],
  },
  {
    name: "ContractExpired",
    type: "event",
    inputs: [
      { name: "cautionReturned", type: "uint256", indexed: false },
      { name: "returnedTo", type: "address", indexed: true },
    ],
  },
  {
    name: "Fractionalized",
    type: "event",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "totalShares", type: "uint256", indexed: false },
      { name: "depositor", type: "address", indexed: true },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// MockUSDC — ERC-20 test stablecoin
// ---------------------------------------------------------------------------

export const MOCK_USDC = {
  address: envAddress("NEXT_PUBLIC_MOCK_USDC_ADDRESS"),
  abi: [
    {
      name: "approve",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
    },
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "allowance",
      type: "function",
      stateMutability: "view",
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "mint",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [],
    },
    {
      name: "decimals",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint8" }],
    },
    {
      name: "symbol",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "string" }],
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// Contract status enum (mirrors Solidity)
// ---------------------------------------------------------------------------

export enum ContractStatus {
  PENDING = 0,
  ACTIVE = 1,
  RESCINDED = 2,
  EXPIRED = 3,
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  [ContractStatus.PENDING]: "Pending",
  [ContractStatus.ACTIVE]: "Active",
  [ContractStatus.RESCINDED]: "Rescinded",
  [ContractStatus.EXPIRED]: "Expired",
};
