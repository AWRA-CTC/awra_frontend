"use client";

import { useMemo } from "react";
import { useAccount, useConnect, useConnectors, useDisconnect } from "wagmi";
import { Button } from "app/components/ui/Button";

const shortenAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const WalletConnectButton = () => {
  const { connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const connectors = useConnectors();

  const availableConnectors = useMemo(
    () =>
      connectors.filter(
        (connector) =>
          connector.type !== "walletConnect" ||
          connector.id === "walletConnect",
      ),
    [connectors],
  );

  if (isConnected && address) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-400/10 px-3 py-2 text-xs text-sky-100 sm:text-sm">
          <span className="status-dot" />
          {shortenAddress(address)}
        </span>
        <Button variant="secondary" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {availableConnectors.map((connector) => (
          <Button
            key={connector.uid}
            size="sm"
            disabled={isPending}
            onClick={() => connect({ connector })}
          >
            {isPending ? "Connecting..." : `Connect ${connector.name}`}
          </Button>
        ))}
      </div>
      {error ? <p className="text-xs text-rose-300">{error.message}</p> : null}
    </div>
  );
};
