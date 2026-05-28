'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';

export default function SiweButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Prevent hydration mismatch
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        if (!ready) {
          return null; // Return a skeleton loader here if you want
        }

        return (
          <div
            {...(!mounted
                ? {
                    "aria-hidden": true,
                    style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
                }
            : {})}
            className="w-full"
          >
            {/* STATE 1: User has not connected a wallet yet */}
            {!connected && (
              <Button className="w-full" onClick={openConnectModal} type="button">
                Connect Wallet
              </Button>
            )}

            {/* STATE 2: User connected to the wrong network */}
            {chain?.unsupported && (
              <Button className="w-full" onClick={openChainModal} type="button" variant="destructive">
                Wrong Network
              </Button>
            )}

            {/* STATE 3: User is fully connected and verified */}
            {connected && !chain?.unsupported && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="secondary"
                  onClick={openChainModal}
                  style={{ display: 'flex', alignItems: 'center' }}
                  type="button"
                >
                  {chain.hasIcon && (
                    <div
                      style={{
                        background: chain.iconBackground,
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        overflow: 'hidden',
                        marginRight: 4,
                      }}
                    >
                      {chain.iconUrl && (
                        <img
                          alt={chain.name ?? 'Chain icon'}
                          src={chain.iconUrl}
                          style={{ width: 12, height: 12 }}
                        />
                      )}
                    </div>
                  )}
                  {chain.name}
                </Button>

                <Button
                  variant="secondary"
                  onClick={openAccountModal}
                  type="button"
                  className="font-mono"
                >
                  {account.displayName}
                  {account.displayBalance ? ` (${account.displayBalance})` : ''}
                </Button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}