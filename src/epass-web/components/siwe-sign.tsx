'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useConnect, useConnection, useConnectors, useDisconnect, usePublicClient, useSwitchChain } from 'wagmi';
import { foundry } from 'wagmi/chains';

type WalletConnectProps = {
  onAddressChange?: (address?: string) => void;
};

export default function SiweButton({ onAddressChange }: WalletConnectProps) {
  const connection = useConnection();
  const { mutateAsync: connectMutateAsync, status: connectStatus, error: connectError } = useConnect();
  const connectors = useConnectors();
  const { mutate: disconnectMutate } = useDisconnect();
  const { mutateAsync: switchChainMutateAsync, isPending: isSwitchPending, error: switchError } = useSwitchChain();
  const foundryClient = usePublicClient({ chainId: foundry.id });
  const [foundryStatus, setFoundryStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [selectedConnectorName, setSelectedConnectorName] = useState<string | null>(null);
  const injectedConnector = useMemo(
    () =>
      connectors.find((connector) => connector.id === 'injected' || connector.name.toLowerCase().includes('injected')) ??
      connectors[0],
    [connectors]
  );
  const { address, chainId } = connection;
  const isConnected = connection.status === 'connected';
  const isOnFoundry = chainId === foundry.id;
  const isConnectPending = connectStatus === 'pending';

  useEffect(() => {
    let active = true;

    async function checkFoundryHealth() {
      if (!foundryClient) {
        return;
      }

      setFoundryStatus('checking');

      try {
        await foundryClient.getBlockNumber();
        if (active) setFoundryStatus('ok');
      } catch {
        if (active) setFoundryStatus('error');
      }
    }

    checkFoundryHealth();
    return () => {
      active = false;
    };
  }, [foundryClient]);

  useEffect(() => {
    onAddressChange?.(address);
  }, [address, onAddressChange]);

  return (
    <div className="w-full space-y-2">
      {!isConnected && (
        <Button
          className="w-full"
          type="button"
          onClick={async () => {
            if (!injectedConnector) return;
            setSelectedConnectorName(injectedConnector.name);
            await connectMutateAsync({ connector: injectedConnector });
          }}
          disabled={isConnectPending || !injectedConnector}
        >
          {isConnectPending ? `Confirm in ${selectedConnectorName ?? 'wallet'}...` : 'Connect Wallet'}
        </Button>
      )}

      {isConnected && !isOnFoundry && (
        <Button
          className="w-full"
          type="button"
          variant="destructive"
          onClick={async () => {
            await switchChainMutateAsync({ chainId: foundry.id });
          }}
          disabled={isSwitchPending}
        >
          {isSwitchPending ? 'Switching network...' : 'Switch to Foundry'}
        </Button>
      )}

      {isConnected && isOnFoundry && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground font-mono px-1 break-all">{address}</div>
          <Button className="w-full" type="button" variant="secondary" onClick={() => disconnectMutate()}>
            Disconnect Wallet
          </Button>
        </div>
      )}

      <div className="text-[11px] text-muted-foreground px-1 space-y-1">
        <p>Network target: Foundry (chainId: {foundry.id})</p>
        {chainId && <p>Current chainId: {chainId}</p>}
        {foundryStatus === 'checking' && <p>Checking local Foundry RPC...</p>}
        {foundryStatus === 'ok' && <p className="text-emerald-500">Foundry RPC is reachable.</p>}
        {foundryStatus === 'error' && (
          <p className="text-destructive">
            Foundry RPC is currently unreachable.
          </p>
        )}
        {connectError && <p className="text-destructive">Wallet connect failed: {connectError.message}</p>}
        {switchError && <p className="text-destructive">Network switch failed: {switchError.message}</p>}
      </div>
    </div>
  );
}