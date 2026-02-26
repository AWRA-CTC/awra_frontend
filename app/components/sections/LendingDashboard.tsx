"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ActionModal } from "app/components/lending/ActionModal";
import { BorrowedTokenList } from "app/components/lending/BorrowedTokenList";
import { StatCard } from "app/components/lending/StatCard";
import { SuppliedTokenList } from "app/components/lending/SuppliedTokenList";
import { TokenMarketList } from "app/components/lending/TokenMarketList";
import { AppHeader } from "app/components/layout/AppHeader";
import {
  hasSupportedTokens,
  hasValidLendingPoolAddress,
  env,
} from "@/config/env";
import { useLendingPoolContext } from "@/contexts/LendingPoolContext";
import { useLendingPool } from "@/hooks/useLendingPool";
import type { LendingAction, LendingToken } from "@/types/lending";
import { truncate } from "@/functions/formats";

export const LendingDashboard = () => {
  const [modalState, setModalState] = useState<{
    action: LendingAction;
    token: LendingToken;
    loanId?: bigint;
  } | null>(null);
  const [isAwaitingModalResult, setIsAwaitingModalResult] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    assetConfigs,
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

  const walletBalanceByAddress = useMemo(() => {
    const index = new Map<string, string>();
    for (const market of tokenMarketRows) {
      index.set(market.address.toLowerCase(), market.walletBalance);
    }
    return index;
  }, [tokenMarketRows]);

  const modalWalletBalance = useMemo(() => {
    if (!modalState) return "0";
    return (
      walletBalanceByAddress.get(modalState.token.address.toLowerCase()) ?? "0"
    );
  }, [modalState, walletBalanceByAddress]);

  const closeModal = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setModalState(null);
    setIsAwaitingModalResult(false);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!modalState || !isAwaitingModalResult) return;

    const hasResult =
      txStatus === "success" || txStatus === "error" || Boolean(actionError);
    if (!hasResult) {
      return;
    }

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    const delay = txStatus === "success" ? 1200 : actionError ? 2000 : 1600;
    closeTimerRef.current = setTimeout(() => {
      closeModal();
    }, delay);
  }, [actionError, isAwaitingModalResult, modalState, txStatus]);

  const modalStatus = useMemo(() => {
    if (!isAwaitingModalResult) return null;

    if (txStatus === "success") {
      return {
        tone: "success" as const,
        message: "Transaction confirmed. Closing modal...",
      };
    }

    if (txStatus === "error") {
      return {
        tone: "error" as const,
        message: "Transaction failed. Closing modal...",
      };
    }

    if (actionError) {
      return {
        tone: "error" as const,
        message: actionError,
      };
    }

    return {
      tone: "processing" as const,
      message: "Processing transaction...",
    };
  }, [actionError, isAwaitingModalResult, txStatus]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="grid gap-5">
        <AppHeader />

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

        <section className="grid gap-4 lg:grid-cols-2">
          <SuppliedTokenList
            busy={isLoading}
            onWithdraw={(token) => setModalState({ action: "withdraw", token })}
          />
          <BorrowedTokenList
            busy={isLoading}
            onRepay={(token, loanId) =>
              setModalState({ action: "repay", token, loanId })
            }
          />
        </section>

        <TokenMarketList
          markets={tokenMarketRows}
          busy={isLoading}
          onAction={(action, token) => setModalState({ action, token })}
        />

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
            ? `${modalState.action}-${modalState.token.address}-${modalState.loanId?.toString() ?? "none"}`
            : "closed-modal"
        }
        isOpen={modalState !== null}
        action={modalState?.action ?? null}
        token={modalState?.token ?? null}
        busy={isLoading || isAwaitingModalResult}
        error={isAwaitingModalResult ? null : actionError}
        statusMessage={modalStatus?.message ?? null}
        statusTone={modalStatus?.tone ?? null}
        walletBalance={modalWalletBalance}
        preferredLoanId={modalState?.loanId ?? null}
        onClose={closeModal}
        onConfirm={async (payload) => {
          if (!modalState) return;

          const submitted = await executeAction(payload);

          if (submitted) {
            setIsAwaitingModalResult(true);
          }
        }}
      />
    </main>
  );
};
