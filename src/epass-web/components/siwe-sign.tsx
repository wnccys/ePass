"use client";

import { Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    useConnect,
    useConnection,
    useConnectors,
    useDisconnect,
    usePublicClient,
    useSwitchChain,
} from "wagmi";
import { useChain } from "@/app/context/ChainContext";
import { Button } from "@/components/ui/button";

type WalletConnectProps = {
    onAddressChange?: (address?: string) => void;
};

export default function SiweButton({ onAddressChange }: WalletConnectProps) {
    const { t } = useTranslation();
    const connection = useConnection();
    const { data: session, update, status: sessionStatus } = useSession();
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

    // Keep refs to unstable callbacks so effects don't re-fire on identity changes
    const updateRef = useRef(update);
    const onAddressChangeRef = useRef(onAddressChange);
    useEffect(() => {
        updateRef.current = update;
    }, [update]);
    useEffect(() => {
        onAddressChangeRef.current = onAddressChange;
    }, [onAddressChange]);

    // Notify parent component when address changes
    useEffect(() => {
        onAddressChangeRef.current?.(address);
    }, [address]);

    // Sync wallet address to NextAuth session (only when it actually changes)
    const prevSyncedAddress = useRef<string | null | undefined>(undefined);
    useEffect(() => {
        // Don't sync if there's no active, authenticated session
        // (e.g. during signOut or loading transitions)
        if (sessionStatus !== "authenticated" || !session?.user) return;

        const targetWallet = address || null;
        // Skip if we already synced this value
        if (prevSyncedAddress.current === targetWallet) return;

        const currentWallet = session.user.walletAddress ?? null;
        if (currentWallet !== targetWallet) {
            prevSyncedAddress.current = targetWallet;
            updateRef.current({ walletAddress: targetWallet });
        } else {
            // Session already matches, just record it
            prevSyncedAddress.current = targetWallet;
        }
    }, [address, session?.user?.walletAddress, session?.user, sessionStatus]);

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
                        ? t("siwe.confirmInWallet", {
                              wallet: selectedConnectorName ?? t("siwe.wallet"),
                          })
                        : t("siwe.connectWallet")}
                </Button>
            )}

            {/* Switch to foundry btn */}
            {isConnected && !isOnChain && (
                <Button
                    className="w-full"
                    type="button"
                    variant="destructive"
                    onClick={async () => {
                        await switchChainMutateAsync({
                            chainId: chainConfig.network.id,
                        });
                    }}
                    disabled={isSwitchPending}
                >
                    {isSwitchPending
                        ? t("siwe.switchingNetwork")
                        : t("siwe.switchTo", {
                              network: chainConfig.network.name,
                          })}
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
                                showAddress
                                    ? t("siwe.hideAddress")
                                    : t("siwe.revealAddress")
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
                        {t("siwe.disconnectWallet")}
                    </Button>
                </div>
            )}

            {/* Wallet / Network information block */}
            <div className="space-y-1 px-1 text-[11px] text-muted-foreground">
                <p>
                    {t("siwe.networkTarget")}{" "}
                    <span className="capitalize">
                        {chainConfig.network.name}
                    </span>{" "}
                    (chainId: {chainConfig.network.id})
                </p>
                {chainId !== chainConfig.network.id && (
                    <p>
                        {t("siwe.currentChainId")} {chainId || t("siwe.none")}
                    </p>
                )}
                {chainStatus === "checking" && (
                    <p>
                        {t("siwe.checkingRpc", {
                            network: chainConfig.network.name,
                        })}
                    </p>
                )}
                {chainStatus === "ok" && (
                    <p className="text-emerald-500">
                        {t("siwe.connectedRpc", {
                            network: chainConfig.network.name,
                        })}
                    </p>
                )}
                {chainStatus === "error" && (
                    <p className="text-destructive">
                        {t("siwe.rpcUnreachable")}
                    </p>
                )}
                {connectError && (
                    <p className="text-destructive">
                        {t("siwe.connectFailed", {
                            error: connectError.message,
                        })}
                    </p>
                )}
                {switchError && (
                    <p className="text-destructive">
                        {t("siwe.switchFailed", { error: switchError.message })}
                    </p>
                )}
            </div>
        </div>
    );
}
