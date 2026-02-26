"use client";

import { useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { Button } from "app/components/ui/Button";
import { NumberInput } from "app/components/ui/NumberInput";
import { TokenSelect } from "app/components/ui/TokenSelect";
import { useLendingPoolContext } from "@/contexts/LendingPoolContext";
import { formatTokenAmount } from "@/functions/formats";
import type { LendingPoolActionRequest } from "@/hooks/useLendingPool";
import type { LendingAction, LendingToken } from "@/types/lending";

type ActionModalProps = {
  isOpen: boolean;
  action: LendingAction | null;
  token: LendingToken | null;
  busy: boolean;
  error: string | null;
  statusMessage?: string | null;
  statusTone?: "processing" | "success" | "error" | null;
  walletBalance: string;
  preferredLoanId?: bigint | null;
  onClose: () => void;
  onConfirm: (payload: LendingPoolActionRequest) => Promise<void>;
};

const actionLabel: Record<LendingAction, string> = {
  deposit: "Supply",
  borrow: "Borrow",
  repay: "Repay",
  withdraw: "Withdraw",
};

const actionDescription: Record<LendingAction, string> = {
  deposit:
    "Supply this asset into the pool to increase your borrowing capacity.",
  borrow: "Borrow this asset against your existing collateral.",
  repay: "Repay this borrowed asset to reduce your debt.",
  withdraw:
    "Withdraw supplied collateral while maintaining a healthy position.",
};

const percentChoices = [10, 25, 50, 75, 100] as const;
const BIGINT_ZERO = BigInt(0);

const addressKey = (address: string) => address.toLowerCase();

const parsePositiveUnits = (input: string, decimals: number): bigint | null => {
  const normalized = input.trim();
  if (!normalized) return null;

  const amount = Number(normalized);
  if (Number.isNaN(amount) || amount <= 0) return null;

  try {
    const parsed = parseUnits(normalized, decimals);
    if (parsed <= BIGINT_ZERO) return null;
    return parsed;
  } catch {
    return null;
  }
};

const toInputAmount = (rawAmount: bigint, decimals: number) => {
  const formatted = formatUnits(rawAmount, decimals);
  if (!formatted.includes(".")) return formatted;
  return formatted.replace(/\.?0+$/, "");
};

export const ActionModal = ({
  isOpen,
  action,
  token,
  busy,
  error,
  statusMessage,
  statusTone,
  walletBalance,
  preferredLoanId,
  onClose,
  onConfirm,
}: ActionModalProps) => {
  const { assetConfigs, lendTokenBalances, userLoans } =
    useLendingPoolContext();

  const [amount, setAmount] = useState("");
  const [borrowCollateralAddress, setBorrowCollateralAddress] = useState("");
  const [borrowCollateralAmount, setBorrowCollateralAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayLoanId, setRepayLoanId] = useState("");

  const title = useMemo(() => {
    if (!action || !token) return "Action";
    return `${actionLabel[action]} ${token.symbol}`;
  }, [action, token]);

  const suppliedAmountRaw = useMemo(() => {
    if (!token) return BIGINT_ZERO;
    const supplied = lendTokenBalances.find(
      (position) => addressKey(position.asset) === addressKey(token.address),
    );
    return supplied?.balance ?? BIGINT_ZERO;
  }, [lendTokenBalances, token]);

  const collateralTokens = useMemo(
    () =>
      assetConfigs.filter(
        (config) => config.isActive && config.canBeCollateral,
      ),
    [assetConfigs],
  );

  const effectiveBorrowCollateralAddress = useMemo(() => {
    if (
      borrowCollateralAddress &&
      collateralTokens.some(
        (collateralToken) =>
          addressKey(collateralToken.address) ===
          addressKey(borrowCollateralAddress),
      )
    ) {
      return borrowCollateralAddress;
    }
    return collateralTokens[0]?.address ?? "";
  }, [borrowCollateralAddress, collateralTokens]);

  const selectedCollateralToken = useMemo(
    () =>
      collateralTokens.find(
        (collateralToken) =>
          addressKey(collateralToken.address) ===
          addressKey(effectiveBorrowCollateralAddress),
      ) ?? null,
    [collateralTokens, effectiveBorrowCollateralAddress],
  );

  const repayLoans = useMemo(() => {
    if (!token) return [];

    return userLoans
      .filter(
        (loan) =>
          loan.active &&
          loan.principal > BIGINT_ZERO &&
          addressKey(loan.borrowAsset) === addressKey(token.address),
      )
      .sort((a, b) => {
        if (a.loanId > b.loanId) return -1;
        if (a.loanId < b.loanId) return 1;
        return 0;
      });
  }, [token, userLoans]);

  const effectiveRepayLoanId = useMemo(() => {
    if (
      repayLoanId &&
      repayLoans.some((loan) => loan.loanId.toString() === repayLoanId)
    ) {
      return repayLoanId;
    }

    const preferredId = preferredLoanId?.toString();
    if (
      preferredId &&
      repayLoans.some((loan) => loan.loanId.toString() === preferredId)
    ) {
      return preferredId;
    }

    return repayLoans[0]?.loanId.toString() ?? "";
  }, [preferredLoanId, repayLoanId, repayLoans]);

  const selectedRepayLoan = useMemo(
    () =>
      repayLoans.find(
        (loan) => loan.loanId.toString() === effectiveRepayLoanId,
      ) ?? null,
    [effectiveRepayLoanId, repayLoans],
  );

  const repayOwedRaw = selectedRepayLoan?.principal ?? BIGINT_ZERO;

  const validationError = useMemo(() => {
    if (!action || !token) return null;

    if (action === "withdraw") {
      if (!amount.trim()) return null;
      const parsedAmount = parsePositiveUnits(amount, token.decimals);
      if (parsedAmount === null)
        return "Enter a valid amount greater than zero.";
      if (parsedAmount > suppliedAmountRaw) return "Over the supplied amount.";
      return null;
    }

    if (action === "repay") {
      if (!selectedRepayLoan)
        return "No active loans found for this borrow asset.";
      if (!amount.trim()) return null;

      const parsedAmount = parsePositiveUnits(amount, token.decimals);
      if (parsedAmount === null)
        return "Enter a valid amount greater than zero.";
      if (parsedAmount > repayOwedRaw) return "Over the owed amount.";
      return null;
    }

    if (action === "borrow") {
      if (borrowCollateralAmount.trim()) {
        const collateralDecimals = selectedCollateralToken?.decimals ?? 18;
        const parsedCollateral = parsePositiveUnits(
          borrowCollateralAmount,
          collateralDecimals,
        );
        if (parsedCollateral === null) {
          return "Enter a valid collateral amount greater than zero.";
        }
      }

      if (borrowAmount.trim()) {
        const parsedBorrow = parsePositiveUnits(borrowAmount, token.decimals);
        if (parsedBorrow === null) {
          return "Enter a valid borrow amount greater than zero.";
        }
      }
    }

    return null;
  }, [
    action,
    amount,
    borrowAmount,
    borrowCollateralAmount,
    repayOwedRaw,
    selectedCollateralToken?.decimals,
    selectedRepayLoan,
    suppliedAmountRaw,
    token,
  ]);

  const submitDisabled = useMemo(() => {
    if (!action || !token || busy || Boolean(validationError)) return true;

    if (action === "deposit") {
      return !amount.trim();
    }

    if (action === "withdraw") {
      return !amount.trim() || suppliedAmountRaw <= BIGINT_ZERO;
    }

    if (action === "borrow") {
      return (
        !effectiveBorrowCollateralAddress ||
        !borrowCollateralAmount.trim() ||
        !borrowAmount.trim()
      );
    }

    return !amount.trim() || !selectedRepayLoan;
  }, [
    action,
    amount,
    borrowAmount,
    effectiveBorrowCollateralAddress,
    borrowCollateralAmount,
    busy,
    selectedRepayLoan,
    suppliedAmountRaw,
    token,
    validationError,
  ]);

  if (!isOpen || !action || !token) return null;

  const suppliedAmountText = formatTokenAmount(
    suppliedAmountRaw,
    token.decimals,
  );
  const repayOwedText = formatTokenAmount(repayOwedRaw, token.decimals);

  const applyPercentAmount = (
    percent: number,
    maxAmount: bigint,
    decimals: number,
  ) => {
    const nextAmount = (maxAmount * BigInt(percent)) / BigInt(100);
    setAmount(toInputAmount(nextAmount, decimals));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close action modal overlay"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <section className="card-flat relative z-10 w-full max-w-md p-5 sm:p-6">
        <p className="kicker">{actionLabel[action]} Position</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
        <p className="subtle mt-2 text-sm leading-relaxed">
          {actionDescription[action]}
        </p>

        {action === "borrow" ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm">
            <p className="subtle">Borrow Asset</p>
            <p className="mt-1 flex items-center justify-between gap-2 font-medium text-white">
              <span>
                {token.name} ({token.symbol})
              </span>
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm">
            <p className="subtle">Asset</p>
            <p className="mt-1 flex items-center justify-between gap-2 font-medium text-white">
              <span>
                {token.name} ({token.symbol})
              </span>
              {action === "deposit" ? (
                <span className="text-xs font-normal text-slate-200">
                  Wallet: {walletBalance} {token.symbol}
                </span>
              ) : null}
            </p>
          </div>
        )}

        {action === "deposit" ? (
          <div className="mt-4">
            <NumberInput
              label={`Amount (${token.symbol})`}
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
        ) : null}

        {action === "withdraw" ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-200">
              Supplied:{" "}
              <span className="font-medium text-white">
                {suppliedAmountText} {token.symbol}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {percentChoices.map((percent) => (
                <Button
                  key={percent}
                  variant="secondary"
                  size="sm"
                  disabled={busy || suppliedAmountRaw <= BIGINT_ZERO}
                  onClick={() =>
                    applyPercentAmount(
                      percent,
                      suppliedAmountRaw,
                      token.decimals,
                    )
                  }
                >
                  {percent}%
                </Button>
              ))}
            </div>
            <NumberInput
              label={`Amount (${token.symbol})`}
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
        ) : null}

        {action === "borrow" ? (
          <div className="mt-4 space-y-3">
            <TokenSelect
              label="Collateral Asset"
              value={effectiveBorrowCollateralAddress}
              options={collateralTokens.map((collateralToken) => ({
                value: collateralToken.address,
                label: collateralToken.symbol,
                hint: collateralToken.name,
              }))}
              disabled={busy || collateralTokens.length === 0}
              onChange={setBorrowCollateralAddress}
            />
            <NumberInput
              label={`Collateral Amount (${selectedCollateralToken?.symbol ?? "Asset"})`}
              placeholder="0.00"
              value={borrowCollateralAmount}
              onChange={(event) =>
                setBorrowCollateralAmount(event.target.value)
              }
            />
            <NumberInput
              label={`Borrow Amount (${token.symbol})`}
              placeholder="0.00"
              value={borrowAmount}
              onChange={(event) => setBorrowAmount(event.target.value)}
            />
            {collateralTokens.length === 0 ? (
              <p className="text-sm text-rose-300">
                No collateral assets are configured for this pool.
              </p>
            ) : null}
          </div>
        ) : null}

        {action === "repay" ? (
          <div className="mt-4 space-y-3">
            <TokenSelect
              label="Loan"
              value={effectiveRepayLoanId}
              options={repayLoans.map((loan) => ({
                value: loan.loanId.toString(),
                label: `Loan #${loan.loanId.toString()}`,
                hint: `Owes ${formatTokenAmount(loan.principal, token.decimals)} ${
                  token.symbol
                }`,
              }))}
              disabled={busy || repayLoans.length === 0}
              onChange={setRepayLoanId}
            />
            <p className="text-xs text-slate-200">
              Owed:{" "}
              <span className="font-medium text-white">
                {repayOwedText} {token.symbol}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {percentChoices.map((percent) => (
                <Button
                  key={percent}
                  variant="secondary"
                  size="sm"
                  disabled={busy || repayOwedRaw <= BIGINT_ZERO}
                  onClick={() =>
                    applyPercentAmount(percent, repayOwedRaw, token.decimals)
                  }
                >
                  {percent}%
                </Button>
              ))}
            </div>
            <NumberInput
              label={`Amount (${token.symbol})`}
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            {repayLoans.length === 0 ? (
              <p className="text-sm text-rose-300">
                No active loans found for this borrow asset.
              </p>
            ) : null}
          </div>
        ) : null}

        {validationError ? (
          <p className="mt-3 text-sm text-rose-300">{validationError}</p>
        ) : null}
        {statusMessage ? (
          <p
            className={`mt-3 text-sm ${
              statusTone === "success"
                ? "text-emerald-300"
                : statusTone === "error"
                  ? "text-rose-300"
                  : "text-sky-200"
            }`}
          >
            {statusMessage}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={submitDisabled}
            onClick={async () => {
              if (validationError) return;

              if (action === "deposit") {
                await onConfirm({
                  action: "deposit",
                  token,
                  amountInput: amount,
                });
                return;
              }

              if (action === "withdraw") {
                await onConfirm({
                  action: "withdraw",
                  token,
                  amountInput: amount,
                });
                return;
              }

              if (action === "borrow") {
                if (!selectedCollateralToken) return;

                await onConfirm({
                  action: "borrow",
                  borrowToken: token,
                  collateralToken: selectedCollateralToken,
                  collateralAmountInput: borrowCollateralAmount,
                  borrowAmountInput: borrowAmount,
                });
                return;
              }

              if (!selectedRepayLoan) return;

              await onConfirm({
                action: "repay",
                token,
                loanId: selectedRepayLoan.loanId,
                amountInput: amount,
              });
            }}
          >
            {busy ? "Submitting..." : actionLabel[action]}
          </Button>
        </div>
      </section>
    </div>
  );
};
