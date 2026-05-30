export const VAULT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS as `0x${string}`;

export const vaultFactoryAbi = [
  {
    type: 'function',
    name: 'createVault',
    inputs: [
      { name: '_masterNftAddress', type: 'address', internalType: 'address' },
      { name: '_stablecoinAddress', type: 'address', internalType: 'address' },
      { name: '_player', type: 'address', internalType: 'address' },
      { name: '_club', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: 'vault', type: 'address', internalType: 'address' }],
    stateMutability: 'nonpayable',
  },
] as const;
