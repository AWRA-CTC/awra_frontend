"use client";

import { useMemo } from "react";
import { Button } from "app/components/ui/Button";
import {
  truncate,
  formatTokenAmount,
  formatAprFromBasisPoints,
  formatLoanStart,
} from "@/functions/formats";
import { useLendingPoolContext } from "@/contexts/LendingPoolContext";
import type { LendingToken } from "@/types/lending";

type BorrowedPositionRow = {
  loanIdValue: bigint;
  loanId: string;
  repayToken: LendingToken | null;
  borrowSymbol: string;
  borrowAmount: string;
  collateralSymbol: string;
  collateralAmount: string;
  aprPercent: string;
  aprBps: string;
  startedAt: string;
};

type BorrowedTokenListProps = {
  busy: boolean;
  onRepay: (token: LendingToken, loanId: bigint) => void;
};

const BIGINT_ZERO = BigInt(0);

export const BorrowedTokenList = ({
  busy,
  onRepay,
}: BorrowedTokenListProps) => {
  const { supportedTokens, userLoans } = useLendingPoolContext();

  const tokenByAddress = useMemo(() => {
    const index = new Map<string, LendingToken>();
    for (const token of supportedTokens) {
      index.set(token.address.toLowerCase(), token);
    }
    return index;
  }, [supportedTokens]);

  const borrowedPositions = useMemo<BorrowedPositionRow[]>(
    () =>
      userLoans
        .filter((loan) => loan.active && loan.principal > BIGINT_ZERO)
        .map((loan) => {
          const borrowToken = tokenByAddress.get(
            loan.borrowAsset.toLowerCase(),
          );
          const collateralToken = tokenByAddress.get(
            loan.collateralAsset.toLowerCase(),
          );

          return {
            loanIdValue: loan.loanId,
            loanId: loan.loanId.toString(),
            repayToken: borrowToken ?? null,
            borrowSymbol: borrowToken?.symbol ?? truncate(loan.borrowAsset),
            borrowAmount: formatTokenAmount(
              loan.principal,
              borrowToken?.decimals ?? 18,
            ),
            collateralSymbol:
              collateralToken?.symbol ?? truncate(loan.collateralAsset),
            collateralAmount: formatTokenAmount(
              loan.collateral,
              collateralToken?.decimals ?? 18,
            ),
            aprPercent: formatAprFromBasisPoints(loan.apr),
            aprBps: loan.apr.toString(),
            startedAt: formatLoanStart(loan.startTime),
          };
        }),
    [userLoans, tokenByAddress],
  );

  return (
    <article className="card-flat px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="section-title text-white">Borrowed Tokens</h3>
        <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200">
          {borrowedPositions.length} active loans
        </span>
      </div>

      {borrowedPositions.length === 0 ? (
        <p className="subtle mt-3 text-sm">
          No active borrowed positions yet. Borrow against collateral from a
          token market row.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {borrowedPositions.map((position) => (
            <div
              key={position.loanId}
              className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">
                  {position.borrowSymbol}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-sky-100">
                    APR {position.aprPercent} ({position.aprBps} bps)
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy || !position.repayToken}
                    onClick={() => {
                      if (!position.repayToken) return;
                      onRepay(position.repayToken, position.loanIdValue);
                    }}
                  >
                    Repay
                  </Button>
                </div>
              </div>
              <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                <p className="subtle">
                  Borrowed:{" "}
                  <span className="balance-text text-slate-100">
                    {position.borrowAmount} {position.borrowSymbol}
                  </span>
                </p>
                <p className="subtle">
                  Collateral:{" "}
                  <span className="balance-text text-slate-100">
                    {position.collateralAmount} {position.collateralSymbol}
                  </span>
                </p>
                <p className="subtle">
                  Loan ID:{" "}
                  <span className="font-mono text-slate-100">
                    {position.loanId}
                  </span>
                </p>
                <p className="subtle">
                  Started:{" "}
                  <span className="text-slate-100">{position.startedAt}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};
