"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionModal } from "app/components/lending/ActionModal";
import { StatCard } from "app/components/lending/StatCard";
import { TokenMarketList } from "app/components/lending/TokenMarketList";
import { Button } from "app/components/ui/Button";
import { AppHeader } from "app/components/layout/AppHeader";
import { formatUnits } from "viem";
import {
  hasSupportedTokens,
  hasValidLendingPoolAddress,
  env,
} from "@/config/env";
import { useLendingPoolContext } from "@/contexts/LendingPoolContext";
import { useLendingPool } from "@/hooks/useLendingPool";
import type { LendingAction, LendingToken } from "@/types/lending";

const truncate = (value: string, head = 10, tail = 8) => {
  if (value.length <= head + tail) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
};

const formatTokenAmount = (value: bigint, decimals = 18) => {
  const amount = Number(formatUnits(value, decimals));
  if (Number.isNaN(amount)) return "0";
  return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

const formatAprFromBasisPoints = (apr: bigint) => {
  const percent = Number(apr) / 100;
  if (!Number.isFinite(percent)) return `${apr.toString()} bps`;
  return `${percent.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};

const formatLoanStart = (timestamp: bigint) => {
  if (timestamp <= 0n) return "N/A";
  const milliseconds = Number(timestamp) * 1000;
  if (!Number.isFinite(milliseconds)) return "N/A";
  return new Date(milliseconds).toLocaleString();
};

export const LendingDashboard = () => {
  const [modalState, setModalState] = useState<{
    action: LendingAction;
    token: LendingToken;
  } | null>(null);

  const {
    supportedTokens,
    assetConfigs,
    lendTokenBalances,
    userDeposits,
    userLoanIds,
    userLoans,
    isLoading: contextLoading,
    error: contextError,
    refresh,
  } = useLendingPoolContext();

  const {
    isConnected,
    txHash,
    txStatus,
    actionError,
    isLoading,
    tokenMarkets,
    summary,
    executeAction,
  } = useLendingPool();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    console.log("LendingPoolContext Results:", {
      supportedTokens,
      assetConfigs,
      lendTokenBalances,
      userDeposits,
      userLoanIds,
      userLoans,
      isLoading: contextLoading,
      error: contextError,
    });
  }, [
    supportedTokens,
    assetConfigs,
    lendTokenBalances,
    userDeposits,
    userLoanIds,
    userLoans,
    contextLoading,
    contextError,
  ]);

  const contractStatus = hasValidLendingPoolAddress
    ? "Contract ready"
    : "Contract missing";
  const tokenStatus = hasSupportedTokens
    ? "Tokens configured"
    : "Tokens missing";

  const modalActionLabel = useMemo(() => {
    if (!modalState) return "";

    const labels: Record<LendingAction, string> = {
      deposit: "Supply",
      borrow: "Borrow",
      repay: "Repay",
      withdraw: "Withdraw",
    };

    return labels[modalState.action];
  }, [modalState]);

  const tokenByAddress = useMemo(() => {
    const index = new Map<string, LendingToken>();
    for (const token of supportedTokens) {
      index.set(token.address.toLowerCase(), token);
    }
    return index;
  }, [supportedTokens]);

  const assetConfigByAddress = useMemo(() => {
    const index = new Map<
      string,
      { canBeCollateral: boolean; canBeBorrowed: boolean }
    >();
    for (const config of assetConfigs) {
      index.set(config.address.toLowerCase(), {
        canBeCollateral: config.canBeCollateral,
        canBeBorrowed: config.canBeBorrowed,
      });
    }
    return index;
  }, [assetConfigs]);

  const tokenMarketRows = useMemo(
    () =>
      tokenMarkets.map((market) => {
        const config = assetConfigByAddress.get(market.address.toLowerCase());
        return {
          ...market,
          canBeCollateral: config?.canBeCollateral ?? false,
          canBeBorrowed: config?.canBeBorrowed ?? false,
        };
      }),
    [assetConfigByAddress, tokenMarkets],
  );

  const suppliedPositions = useMemo(
    () =>
      lendTokenBalances
        .filter((position) => position.hasBalance)
        .map((position) => {
          const token = tokenByAddress.get(position.asset.toLowerCase());

          return {
            key: position.asset.toLowerCase(),
            token,
            symbol: token?.symbol ?? position.assetSymbol,
            name: token?.name ?? `${position.assetSymbol} Lend Token`,
            amount: formatTokenAmount(position.balance, token?.decimals ?? 18),
          };
        }),
    [lendTokenBalances, tokenByAddress],
  );

  const borrowedPositions = useMemo(
    () =>
      userLoans
        .filter((loan) => loan.active && loan.principal > 0n)
        .map((loan) => {
          const borrowToken = tokenByAddress.get(loan.borrowAsset.toLowerCase());
          const collateralToken = tokenByAddress.get(
            loan.collateralAsset.toLowerCase(),
          );

          return {
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
    [tokenByAddress, userLoans],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="grid gap-5">
        <AppHeader />

        <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <article className="card p-5 sm:p-6">
            <p className="kicker">Pool Operations</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Lend, borrow, and manage risk from one clean desk.
            </h2>
            <p className="subtle mt-3 max-w-2xl text-sm leading-relaxed">
              AWRA focuses on fast execution and clear position visibility.
              Connect your wallet, inspect liquidity, and execute pool
              operations in a single flow.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-rose-300/40 bg-rose-400/15 px-3 py-1.5 text-rose-100">
                Chain ID {env.chainId}
              </span>
              <span className="rounded-full border border-white/20 bg-white/8 px-3 py-1.5 text-slate-100">
                {contractStatus}
              </span>
              <span className="rounded-full border border-rose-300/40 bg-rose-400/10 px-3 py-1.5 text-rose-100">
                {tokenStatus}
              </span>
              <span className="rounded-full border border-sky-300/40 bg-sky-400/10 px-3 py-1.5 text-sky-100">
                {isConnected ? "Wallet connected" : "Wallet not connected"}
              </span>
            </div>
          </article>

          <aside className="card-flat p-5 sm:p-6">
            <h3 className="section-title text-white">Position Snapshot</h3>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                <span className="subtle">Configured Assets</span>
                <span className="balance-text font-medium text-white">
                  {summary.supportedAssets}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                <span className="subtle">Assets In Wallet</span>
                <span className="balance-text font-medium text-white">
                  {summary.walletAssetCount}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                <span className="subtle">Collateral Markets</span>
                <span className="balance-text font-medium text-white">
                  {summary.collateralMarkets}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                <span className="subtle">Debt Markets</span>
                <span className="balance-text font-medium text-white">
                  {summary.debtMarkets}
                </span>
              </div>
            </div>
          </aside>
        </section>

        {!hasValidLendingPoolAddress ? (
          <section className="card-flat border-rose-300/35 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            Set <code>NEXT_PUBLIC_LENDING_POOL_ADDRESS</code> in your env file
            before submitting transactions.
          </section>
        ) : null}

        {!hasSupportedTokens ? (
          <section className="card-flat border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Set <code>NEXT_PUBLIC_SUPPORTED_TOKENS</code> in your env file with
            token symbols, addresses, and decimals.
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Supported Assets"
            value={summary.supportedAssets}
            hint="Markets configured in env"
          />
          <StatCard
            label="Wallet Assets"
            value={summary.walletAssetCount}
            hint="Tokens with balance in wallet"
          />
          <StatCard
            label="Collateral Markets"
            value={summary.collateralMarkets}
            hint="Assets currently supplied"
          />
          <StatCard
            label="Debt Markets"
            value={summary.debtMarkets}
            hint="Assets currently borrowed"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
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
                        disabled={isLoading || !position.token}
                        onClick={() => {
                          if (!position.token) return;
                          setModalState({
                            action: "withdraw",
                            token: position.token,
                          });
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

          <article className="card-flat px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="section-title text-white">Borrowed Tokens</h3>
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200">
                {borrowedPositions.length} active loans
              </span>
            </div>

            {borrowedPositions.length === 0 ? (
              <p className="subtle mt-3 text-sm">
                No active borrowed positions yet. Borrow against collateral from
                a token market row.
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
                          disabled={isLoading || !position.repayToken}
                          onClick={() => {
                            if (!position.repayToken) return;
                            setModalState({
                              action: "repay",
                              token: position.repayToken,
                            });
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
        </section>

        <TokenMarketList
          markets={tokenMarketRows}
          busy={isLoading}
          onAction={(action, token) => setModalState({ action, token })}
        />

        <section className="card-flat px-4 py-4 text-sm sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="section-title text-white">Transaction Activity</h3>
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-200">
              Status: {txStatus}
            </span>
          </div>
          <p className="subtle mt-3">Network Chain ID: {env.chainId}</p>
          {modalState ? (
            <p className="subtle mt-1">
              Pending action: {modalActionLabel} {modalState.token.symbol}
            </p>
          ) : null}
          {txHash ? (
            <p className="mt-1 text-sky-100">
              Last tx:{" "}
              <span className="font-mono text-xs">{truncate(txHash)}</span>
            </p>
          ) : (
            <p className="subtle mt-1">No transaction submitted yet.</p>
          )}
          {contextLoading ? (
            <p className="subtle mt-1">
              Lending pool context data is loading...
            </p>
          ) : null}
          {actionError ? (
            <p className="mt-2 text-rose-300">{actionError}</p>
          ) : null}
          {contextError ? (
            <p className="mt-2 text-rose-300">
              Lending pool context error: {contextError}
            </p>
          ) : null}
        </section>
      </div>

      <ActionModal
        key={
          modalState
            ? `${modalState.action}-${modalState.token.address}`
            : "closed-modal"
        }
        isOpen={modalState !== null}
        action={modalState?.action ?? null}
        token={modalState?.token ?? null}
        busy={isLoading}
        error={actionError}
        onClose={() => setModalState(null)}
        onConfirm={async (amount) => {
          if (!modalState) return;

          const submitted = await executeAction(
            modalState.action,
            modalState.token,
            amount,
          );

          if (submitted) {
            setModalState(null);
          }
        }}
      />
    </main>
  );
};
