export const MINT_AGREEMENT_TYPES = {
  MintAgreement: [
    { name: 'player', type: 'address' },
    { name: 'club', type: 'address' },
    { name: 'attorney', type: 'address' },
    { name: 'tokenURI', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

/**
 * Build EIP-712 domain required by RightsMinter
 * @param minterAddress
 * @param chainId
 * @returns
 */
export function buildMintAgreementDomain(minterAddress: `0x${string}`, chainId: number) {
  return {
    name: "RightsMinter",
    version: "1",
    chainId,
    // minterAddress is already a keccak-256 representation of the mintAgreement fn
    verifyingContract: minterAddress,
  } as const;
}
