"use client";

import { useMemo } from "react";
import { Button } from "app/components/ui/Button";
import { formatTokenAmount } from "@/functions/formats";
import { useLendingPoolContext } from "@/contexts/LendingPoolContext";
import type { LendingToken } from "@/types/lending";

type SuppliedPositionRow = {
  key: string;
  token: LendingToken | null;
  symbol: string;
  name: string;
  amount: string;
};

type SuppliedTokenListProps = {
  busy: boolean;
  onWithdraw: (token: LendingToken) => void;
};

export const SuppliedTokenList = ({
  busy,
  onWithdraw,
}: SuppliedTokenListProps) => {
  const { supportedTokens, userDeposits } = useLendingPoolContext();

  const tokenByAddress = useMemo(() => {
    const index = new Map<string, LendingToken>();
    for (const token of supportedTokens) {
      index.set(token.address.toLowerCase(), token);
    }
    return index;
  }, [supportedTokens]);

  const suppliedPositions = useMemo<SuppliedPositionRow[]>(
    () =>
      userDeposits
        .filter((position) => position.hasBalance)
        .map((position) => {
          const token =
            tokenByAddress.get(position.asset.toLowerCase()) ?? null;

          return {
            key: position.asset.toLowerCase(),
            token,
            symbol: token?.symbol ?? position.assetSymbol,
            name: token?.name ?? `${position.assetSymbol} Lend Token`,
            amount: formatTokenAmount(position.balance, token?.decimals ?? 18),
          };
        }),
    [userDeposits, tokenByAddress],
  );

  return (
    <article className="card-flat px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="section-title text-white">Supplied Tokens</h3>
        <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200">
          {suppliedPositions.length} active
        </span>
      </div>

      {suppliedPositions.length === 0 ? (
        <p className="subtle mt-3 text-sm">
          No supplied positions yet. Use Supply on a token market row.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {suppliedPositions.map((position) => (
            <div
              key={position.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {position.symbol}
                </p>
                <p className="subtle text-xs">{position.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="balance-text text-sm text-white">
                  {position.amount} {position.symbol}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy || !position.token}
                  onClick={() => {
                    if (!position.token) return;
                    onWithdraw(position.token);
                  }}
                >
                  Withdraw
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};
