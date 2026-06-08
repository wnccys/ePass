"use client";

import { Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
    useConnect,
    useConnection,
    useConnectors,
    useDisconnect,
    usePublicClient,
    useSwitchChain,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { useChain } from "@/app/context/ChainContext";

type WalletConnectProps = {
    onAddressChange?: (address?: string) => void;
};

export default function SiweButton({ onAddressChange }: WalletConnectProps) {
    const connection = useConnection();
    const { data: session, update } = useSession();
    const {
        mutateAsync: connectMutateAsync,
        status: connectStatus,
        error: connectError,
    } = useConnect();

    const connectors = useConnectors();
    const { mutate: disconnectMutate } = useDisconnect();
    const {
        mutateAsync: switchChainMutateAsync,
        isPending: isSwitchPending,
        error: switchError,
    } = useSwitchChain();

    const chainConfig = useChain();

    // We are use Foundry by default and testing purpose
    const chainClient = usePublicClient({ chainId: chainConfig.network.id });
    const [chainStatus, setChainStatus] = useState<
        "idle" | "checking" | "ok" | "error"
    >("idle");
    const [selectedConnectorName, setSelectedConnectorName] = useState<
        string | null
    >(null);

    const [showAddress, setShowAddress] = useState(false);
    const injectedConnector = useMemo(
        () =>
            connectors.find(
                (connector) =>
                    connector.id === "injected" ||
                    connector.name.toLowerCase().includes("injected"),
            ) ?? connectors[0],
        [connectors],
    );
    const { address, chainId } = connection;
    const isConnected = connection.status === "connected";
    const isOnChain = chainId === chainConfig.network.id;
    const isConnectPending = connectStatus === "pending";

    // Update Chain health status
    useEffect(() => {
        let active = true;

        async function checkFoundryHealth() {
            if (!chainClient) {
                return;
            }

            setChainStatus("checking");

            try {
                await chainClient.getBlockNumber();
                if (active) setChainStatus("ok");
            } catch {
                if (active) setChainStatus("error");
            }
        }

        checkFoundryHealth();
        return () => {
            active = false;
        };
    }, [chainClient]);

    // Update address on parent component and session (only if changed)
    useEffect(() => {
        onAddressChange?.(address);
        const currentWallet = session?.user?.walletAddress;
        const targetWallet = address || null;
        if (session && currentWallet !== targetWallet) {
            update({ walletAddress: targetWallet });
        }
    }, [address, onAddressChange, session?.user?.walletAddress, update]);

    return (
        /** Connect wallet button */
        <div className="w-full space-y-2">
            {!isConnected && (
                <Button
                    className="w-full"
                    type="button"
                    onClick={async () => {
                        if (!injectedConnector) return;
                        setSelectedConnectorName(injectedConnector.name);
                        await connectMutateAsync({
                            connector: injectedConnector,
                        });
                    }}
                    disabled={isConnectPending || !injectedConnector}
                >
                    {isConnectPending
                        ? `Confirm in ${selectedConnectorName ?? "wallet"}...`
                        : "Connect Wallet"}
                </Button>
            )}

            {/* Switch to foundry btn */}
            {isConnected && !isOnChain && (
                <Button
                    className="w-full"
                    type="button"
                    variant="destructive"
                    onClick={async () => {
                        await switchChainMutateAsync({ chainId: chainConfig.network.id });
                    }}
                    disabled={isSwitchPending}
                >
                    {isSwitchPending
                        ? "Switching network..."
                        : `Switch to ${chainConfig.network.name}`}
                </Button>
            )}

            {/*  Show address component */}
            {isConnected && isOnChain && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1">
                        <span className="flex-1 select-all break-all font-mono text-muted-foreground text-xs">
                            {showAddress
                                ? address
                                : address
                                  ? `${address.slice(0, 6)}${"•".repeat(28)}${address.slice(-4)}`
                                  : "—"}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowAddress((v) => !v)}
                            aria-label={
                                showAddress ? "Hide address" : "Reveal address"
                            }
                        >
                            {showAddress ? (
                                <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                                <Eye className="h-3.5 w-3.5" />
                            )}
                        </Button>
                    </div>
                    <Button
                        className="w-full"
                        type="button"
                        variant="secondary"
                        onClick={() => disconnectMutate()}
                    >
                        Disconnect Wallet
                    </Button>
                </div>
            )}

            {/* Wallet / Network information block */}
            <div className="space-y-1 px-1 text-[11px] text-muted-foreground">
                <p>Network target: <span className="capitalize">{ chainConfig.network.name }</span> (chainId: {chainConfig.network.id})</p>
                {chainId && <p>Current chainId: {chainId}</p>}
                {chainStatus === "checking" && (
                    <p>Checking local Foundry RPC...</p>
                )}
                {chainStatus === "ok" && (
                    <p className="text-emerald-500">
                        Connected to <span className="capitalize">{ chainConfig.network.name }</span> RPC.
                    </p>
                )}
                {chainStatus === "error" && (
                    <p className="text-destructive">
                        Client RPC is currently unreachable.
                    </p>
                )}
                {connectError && (
                    <p className="text-destructive">
                        Wallet connect failed: {connectError.message}
                    </p>
                )}
                {switchError && (
                    <p className="text-destructive">
                        Network switch failed: {switchError.message}
                    </p>
                )}
            </div>
        </div>
    );
}
