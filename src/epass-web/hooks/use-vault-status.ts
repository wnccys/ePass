import { useReadContracts } from 'wagmi';
import { RIGHTS_VAULT_ABI, ContractStatus } from '@/lib/web3/contracts';

export function useVaultStatus(vaultAddress?: `0x${string}`) {
  const vaultContract = {
    address: vaultAddress,
    abi: RIGHTS_VAULT_ABI,
  } as const;

  const { data, isError, isLoading, refetch } = useReadContracts({
    contracts: vaultAddress ? [
      { ...vaultContract, functionName: 'status' },
      { ...vaultContract, functionName: 'timeRemaining' },
      { ...vaultContract, functionName: 'isBeforeHalfTime' },
      { ...vaultContract, functionName: 'cautionAmount' },
      { ...vaultContract, functionName: 'player' },
      { ...vaultContract, functionName: 'club' },
      { ...vaultContract, functionName: 'contractStart' },
    ] : [],
    query: {
      enabled: !!vaultAddress,
      refetchInterval: 5000, // Poll every 5s for MVP
    }
  });

  if (!vaultAddress || !data) {
    return {
      status: undefined,
      timeRemaining: undefined,
      isBeforeHalfTime: undefined,
      cautionAmount: undefined,
      player: undefined,
      club: undefined,
      contractStart: undefined,
      isLoading,
      isError,
      refetch,
    };
  }

  return {
    status: data[0].result as ContractStatus | undefined,
    timeRemaining: data[1].result as bigint | undefined,
    isBeforeHalfTime: data[2].result as boolean | undefined,
    cautionAmount: data[3].result as bigint | undefined,
    player: data[4].result as `0x${string}` | undefined,
    club: data[5].result as `0x${string}` | undefined,
    contractStart: data[6].result as bigint | undefined,
    isLoading,
    isError,
    refetch,
  };
}
